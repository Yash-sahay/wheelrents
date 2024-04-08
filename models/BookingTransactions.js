const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingTransactions = new Schema({
    clientId:{
        type: String,
        required: true
    },
    hostId:{
        type: String,
        required: true
    },
    bookingId:{
        type: String,
        required: true
    },
    amount:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
  });
  const BookingTransactionsModel = mongoose.model('booking_transactions', BookingTransactions);
  module.exports = BookingTransactionsModel;