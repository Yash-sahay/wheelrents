const express = require('express')
const app = express()
const port = "5000"
// const hostname = '0.0.0.0';
const cors = require('cors'); 
const connectToMongo = require('./db');
const path = require('path');
const startCronJob = require('./controller/cronController');
// Socket dependencies
const http = require('http');
const socketIO = require('socket.io');
// to connect mongo db
connectToMongo();



const server = http.createServer(app);
const io = socketIO(server);

// Store user data (you can use a database in a real-world scenario)
const users = {};

io.on('connection', (socket) => {
  // notify existing users

  socket.emit("user connected", users);

  socket.on('join', (userId) => {
    // Store the socket ID for the user
    users[userId] = socket.id;
    console.log(`User ${userId} joined`);
  })

  socket.on("chat message", ({ content, to }) => {
    console.warn(users)
    console.log(`Message from user ${to}: ${JSON.stringify(content)}`);
    socket.emit("chat message", {
      content,
      from: to,
      socketId: socket.id
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const disconnectedUserId = Object.keys(users).find((key) => users[key] === socket.id);
    if (disconnectedUserId) {
      console.log(`User ${disconnectedUserId} disconnected`);
      delete users[disconnectedUserId];
    }
  });

});

server.listen(8000, () => {
  console.log('Server is running on port 8000');
});


app.use(cors())
app.use(express.json())
app.use('/public', express.static(path.join(__dirname, '/public')));

// Available Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/service', require('./routes/service'))
app.use('/api/vehicle', require('./routes/vehicle'))
app.use('/api/bookings', require('./routes/bookings'))

startCronJob('0 * * * *', 'my first cron job')


app.listen(port, () => {
    console.log(`project-x backend listening at http://${'hostname'}:${port}`)
  })
