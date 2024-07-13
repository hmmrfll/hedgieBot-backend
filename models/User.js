const mongoose = require('mongoose')

const trackSchema = new mongoose.Schema({
	asset: String,
	expiryDate: String,
	strikePrice: Number,
	optionType: String,
	optionPrice: Number,
	notificationPrice: Number,
	percentChange: Number,
})

const userSchema = new mongoose.Schema({
	telegramId: { type: String, unique: true },
	tracks: [trackSchema],
})

const User = mongoose.model('User', userSchema)

module.exports = User
