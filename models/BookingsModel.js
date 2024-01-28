const mongoose = require('mongoose');
const { Schema } = mongoose;

const BookingSchema = new Schema({
    vehicleId: {
        type: String,
        required: true
    },
    userId: {
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
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true
    },
    hostUserId: {
        type: String,
        required: true
    },
    vehicleSize: {
        type: String,
        required: true,
        enum: ['SUV', 'Mini', 'Saden']
    },
});
const BookingsModel = mongoose.model('bookings', BookingSchema);
module.exports = BookingsModel