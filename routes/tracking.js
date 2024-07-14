const express = require('express')
const router = express.Router()
const User = require('../models/User')

// Создание нового пользователя или обновление существующего
router.post('/user', async (req, res) => {
	const { telegramId } = req.body
	try {
		let user = await User.findOne({ telegramId })
		if (!user) {
			user = new User({ telegramId, tracks: [] })
			await user.save()
			console.log(`User with telegramId ${telegramId} created.`)
		} else {
			console.log(`User with telegramId ${telegramId} already exists.`)
		}
		res.status(201).json(user)
	} catch (err) {
		console.error('Error registering user:', err)
		res.status(400).json({ message: err.message })
	}
})

// Создание нового трека для пользователя
router.post('/:telegramId/tracks', async (req, res) => {
	const { telegramId } = req.params
	const newTrack = req.body

	console.log(
		'Adding new track for telegramId:',
		telegramId,
		'Track details:',
		newTrack
	)

	if (!newTrack.asset || !newTrack.expiryDate || isNaN(newTrack.strikePrice)) {
		console.error('Invalid track data:', newTrack)
		return res.status(400).json({ message: 'Invalid track data' })
	}

	try {
		const user = await User.findOne({ telegramId })
		if (user) {
			user.tracks.push({
				...newTrack,
				lastPrice: newTrack.lastPrice || 0,
				notificationThreshold: newTrack.notificationThreshold || 0,
			})
			await user.save()
			console.log('Track added:', newTrack)
			res.status(201).json(newTrack) // Returning only the added track
		} else {
			console.log('User not found:', telegramId)
			res.status(404).json({ message: 'User not found' })
		}
	} catch (err) {
		console.error('Error adding track:', err)
		res
			.status(400)
			.json({ message: err.message || 'Error processing your request' })
	}
})

// Получение всех треков пользователя
router.get('/:telegramId/tracks', async (req, res) => {
	const { telegramId } = req.params

	try {
		const user = await User.findOne({ telegramId })
		if (user) {
			res.status(200).json(user.tracks)
		} else {
			res.status(404).json({ message: 'User not found' })
		}
	} catch (err) {
		console.error('Error fetching tracks:', err)
		res.status(400).json({ message: err.message })
	}
})

// Удаление трека пользователя по индексу
router.delete('/:telegramId/tracks/:trackIndex', async (req, res) => {
	const { telegramId, trackIndex } = req.params

	try {
		const user = await User.findOne({ telegramId })
		if (user) {
			const index = parseInt(trackIndex)
			if (index >= 0 && index < user.tracks.length) {
				user.tracks.splice(index, 1)
				await user.save()
				console.log(`Track at index ${index} deleted.`)
				res.status(200).json({ message: 'Track deleted successfully' })
			} else {
				console.log(`Track at index ${index} not found for user ${telegramId}.`)
				res.status(404).json({ message: 'Track not found' })
			}
		} else {
			console.log(`User with telegramId ${telegramId} not found.`)
			res.status(404).json({ message: 'User not found' })
		}
	} catch (err) {
		console.error('Error deleting track:', err)
		res
			.status(400)
			.json({ message: err.message || 'Error processing your request' })
	}
})

module.exports = router
