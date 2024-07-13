const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const trackingRoutes = require('./routes/tracking')
const cors = require('cors')

const app = express()

// Настройка CORS для разрешения запросов с вашего ngrok URL и Telegram Mini Apps
app.use(
	cors({
		origin: '*',
	})
)

app.use(bodyParser.json())

app.use('/api/tracking', trackingRoutes)

const PORT = process.env.PORT || 5001
const MONGO_URI = 'mongodb://localhost:27017/HedgieBot'

mongoose
	.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then(() => console.log('MongoDB connected'))
	.catch(err => console.error('MongoDB connection error:', err))

// Простой маршрут для проверки доступности сервера
app.get('/test', (req, res) => {
	res.send('Server is working')
})

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
