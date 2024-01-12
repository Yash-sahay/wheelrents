const express = require('express')
const app = express()
const port = "5000"
// const hostname = '0.0.0.0';
const cors = require('cors'); 
const connectToMongo = require('./db');
const path = require('path')

// to connect mongo db
connectToMongo();

app.use(cors())
app.use(express.json())
app.use('/public', express.static(path.join(__dirname, '/public')));

// Available Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/service', require('./routes/service'))
app.use('/api/vehicle', require('./routes/vehicle'))
app.use('/api/bookings', require('./routes/bookings'))

app.listen(port, () => {
    console.log(`project-x backend listening at http://${'hostname'}:${port}`)
  })
