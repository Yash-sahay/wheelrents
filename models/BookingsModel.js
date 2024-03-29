const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingSchema = new Schema({
    vehicleId:{
        type: String,
        required: true
    },
    clientId:{
        type: String,
        required: true
    },
    hostId:{
        type: String,
        required: true
    },
    totalPrice: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
  });
  const BookingsModel = mongoose.model('bookings', BookingSchema);
  module.exports = BookingsModel