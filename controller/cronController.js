const cron = require('node-cron');
const BookingsModel = require('../models/BookingsModel');
const moment = require('moment');

// Function to start the cron job
function startCronJob(schedule, command) {
    console.log(`Scheduling cron job with schedule: ${schedule}`);
    cron.schedule(schedule, async () => {
        rejectBookingsIfPastStartDate()
    });
}



async function rejectBookingsIfPastStartDate() {
    try {
        const currentTime = moment();
        const bookings = await BookingsModel.find({
            $or: [
                { bookingStatus: 'active' },
                { bookingStatus: 'pending' }
            ],
            startDate: { $lt: currentTime }
        });

        for (const booking of bookings) {
            booking.bookingStatus = 'reject';
            await booking.save();
            console.log(`Booking with ID ${booking._id} has been rejected.`);
        }
    } catch (error) {
        console.error('Error rejecting bookings:', error);
    }
}

module.exports = startCronJob;

