const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
require('dotenv').config()

const token = process.env.BOT_TOKEN
const webAppUrl = process.env.WEB_APP_URL
const apiBaseUrl = 'http://localhost:5001/api/tracking'
const bot = new TelegramBot(token, { polling: true })

bot.on('message', async msg => {
	const chatId = msg.chat.id
	const text = msg.text
	const telegramId = msg.from.id.toString()
	const name = msg.from.username

	if (text === '/start') {
		try {
			await axios.post(`${apiBaseUrl}/user`, { telegramId })
			await bot.sendMessage(
				chatId,
				`Welcome! @${name}, you've joined Hedgie Bot. This bot tracks option prices and notifies you when they hit your target.`,
				{
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'GO!',
									web_app: { url: `${webAppUrl}?telegramId=${telegramId}` },
								},
							],
						],
					},
				}
			)
		} catch (error) {
			console.error('Error registering user:', error)
			await bot.sendMessage(chatId, 'Error registering user.')
		}
	}
})
