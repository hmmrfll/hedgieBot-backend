const mongoose = require('mongoose')

const trackSchema = new mongoose.Schema({
	optionId: String,
	asset: String,
	expiryDate: Date,
	strikePrice: Number,
	optionType: String,
	optionPrice: Number,
	notificationPrice: Number,
	percentChange: Number,
	lastPrice: { type: Number, default: 0 }, // Новый lastPrice
	notificationThreshold: { type: Number, default: 0 }, // Новый notificationThreshold
})

const userSchema = new mongoose.Schema({
	telegramId: String,
	tracks: [trackSchema],
})

module.exports = mongoose.model('User', userSchema)
