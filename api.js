const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')
const cron = require('node-cron')
const TelegramBot = require('node-telegram-bot-api')
const moment = require('moment')
require('dotenv').config()

const User = require('./models/User')
const trackingRouter = require('./routes/tracking')

const app = express()

app.use(cors({ origin: '*' }))
app.use(bodyParser.json())

const PORT = process.env.PORT || 5001
const MONGO_URI = 'mongodb://localhost:27017/HedgieBot'

mongoose
	.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => console.log('MongoDB connected'))
	.catch(err => console.error('MongoDB connection error:', err))

app.use('/api/tracking', trackingRouter) // Регистрация маршрута

app.get('/test', (req, res) => {
	res.send('Server is working')
})

const token = process.env.BOT_TOKEN
const bot = new TelegramBot(token, { polling: true })

async function fetchOptionPrice(asset, expiryDate, strikePrice, optionType) {
	try {
		const formattedDate = moment(expiryDate).format('DDMMMYY').toUpperCase()
		const instrumentName = `${asset.toUpperCase()}-${formattedDate}-${strikePrice}-${
			optionType === 'call' ? 'C' : 'P'
		}`
		console.log(`Fetching option price for instrument: ${instrumentName}`)

		const response = await axios.get(
			`https://www.deribit.com/api/v2/public/ticker`,
			{
				params: { instrument_name: instrumentName },
			}
		)

		if (
			response.data &&
			response.data.result &&
			response.data.result.mark_price !== undefined
		) {
			return response.data.result.mark_price
		} else {
			throw new Error('No price data available for this option.')
		}
	} catch (error) {
		console.error('Error fetching option price:', error)
		throw error
	}
}

async function checkPrices() {
	try {
		const users = await User.find()

		for (const user of users) {
			for (const track of user.tracks) {
				try {
					const currentPrice = await fetchOptionPrice(
						track.asset,
						track.expiryDate,
						track.strikePrice,
						track.optionType
					)

					console.log(
						`Current price for ${track.asset} option: ${currentPrice}`
					)

					const formattedDate = moment(track.expiryDate)
						.format('DDMMMYY')
						.toUpperCase()
					const instrumentName = `${track.asset.toUpperCase()}-${formattedDate}-${
						track.strikePrice
					}-${track.optionType === 'call' ? 'C' : 'P'}`

					const priceDifference =
						((currentPrice - track.lastPrice) / track.lastPrice) * 100
					if (Math.abs(priceDifference) >= track.percentChange) {
						const direction = priceDifference > 0 ? 'выросла' : 'упала'
						bot.sendMessage(
							user.telegramId,
							`Цена ${instrumentName} опциона ${direction} на ${Math.abs(
								priceDifference
							).toFixed(2)}% и текущая стоимость: ${currentPrice}`
						)
						track.lastPrice = currentPrice
					}

					if (currentPrice >= track.notificationPrice) {
						bot.sendMessage(
							user.telegramId,
							`Цена опциона ${instrumentName} достигла ${track.notificationPrice}`
						)
					}
				} catch (error) {
					console.error(
						`Error checking prices for user ${user.telegramId}:`,
						error
					)
				}
			}

			await user.save()
		}
	} catch (error) {
		console.error('Error checking prices:', error)
	}
}

cron.schedule('* * * * *', checkPrices)

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
