const express = require('express');
const router = express.Router();
const { body, checkSchema, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');

let path = require('path');
const multer = require('multer');
const BookingsModel = require('../models/BookingsModel');
const VehicleModel = require('../models/VehicleModel');
const UserModel = require('../models/UserModel');
const VehicleFilesModel = require('../models/VehicleFilesModel');
const BookingTransactionsModel = require('../models/BookingTransactions');
const { sendNotify } = require('../controller/fcmController');
const FCMModel = require('../models/FCMModel');
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './public/vehicle') 
//     },
//     filename: function (req, file, cb) {
//         cb(null,  Date.now() + "-wheelrents-" + Math.random() + file.originalname);
//     }
// })
// const upload = multer({ storage: storage })


// For adding booking Vehicle by vehicleId
router.post('/add', fetchuser, async (req, res) => {
    try {
        const vehicleId = req.body.vehicleId;
        const userId = req.user.id;
        const totalPrice = req.body.totalPrice;
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;

        if (vehicleId && userId) {
            let hostIdgetting = await VehicleModel.find({ _id: vehicleId })
            const vehicleDetails = hostIdgetting?.[0];
            hostIdgetting = hostIdgetting?.[0]?.userId


            const createBooking = await BookingsModel.create({ vehicleId, clientId: userId, hostId: hostIdgetting, totalPrice, endDate, startDate, bookingStatus: "pending", payment: "none" })

            const allFcms = await FCMModel.find({ userId: createBooking.hostId })

            allFcms.forEach(element => {
                sendNotify({ title: `New Booking for ${vehicleDetails?.name}`, body: "Please proceed to approve the request that has been submitted by the client.", token: element.fcm_token })
            });
            return res.send({ success: true, ...createBooking, startDate })
        }

        return res.send({ success: false, error: "please provide vehicle id" })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})


router.post('/get_host_bookings', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const bookingStatus = req.body.bookingStatus || 'pending'
        let getAllBooking = [];
        if (req.body?.isClient) {
            getAllBooking = await BookingsModel.find({ clientId: userId, $or: bookingStatus == "completed" ? [{ bookingStatus: bookingStatus }] : [{ bookingStatus: "pending" }, { bookingStatus: "active" }, { bookingStatus: "started" }] });
        } else {
            getAllBooking = await BookingsModel.find({ hostId: userId, $or: bookingStatus == "completed" ? [{ bookingStatus: bookingStatus }] : [{ bookingStatus: "pending" }, { bookingStatus: "active" }, { bookingStatus: "started" }] });
        }

        let array = [];
        for (let index = 0; index < getAllBooking.length; index++) {
            const currObj = getAllBooking[index]?._doc;

            if (currObj && currObj.vehicleId) {
                const getLinkedVehicle = await VehicleModel.find({ userId: currObj.hostId, _id: currObj.vehicleId });

                const clientDetails = await UserModel.find({ _id: currObj.clientId });
                const hostDetails = await UserModel.find({ _id: currObj.hostId });
                const vehicle_image = await VehicleFilesModel.find({ vehicleId: currObj.vehicleId });
                if (getLinkedVehicle) {
                    const veh = getLinkedVehicle?.[0]?._doc
                    delete veh._id
                    array = [{ ...currObj, ...veh, hostName: hostDetails?.[0]?._doc?.name, hostNumber: hostDetails?.[0]?._doc?.phoneNo, clientName: clientDetails?.[0]?._doc?.name, clientNumber: clientDetails?.[0]?._doc?.phoneNo, images: vehicle_image }, ...array];
                } else {
                    console.error(`Vehicle not found for booking ID: ${currObj._id}`);
                }
            } else {
                console.error(`Invalid vehicleId for booking ID: ${currObj._id}`);
            }
        }

        res.send(array);
    } catch (error) {
        console.error('Error fetching host bookings:', error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
});


router.delete('/delete_booking_by_id/:booking_id', fetchuser, async (req, res) => {
    try {
        const bookingId = req.params.booking_id
        const bookingData = await BookingsModel.findByIdAndUpdate(bookingId, { bookingStatus: "reject" })
        const allFcms = await FCMModel.find({ userId: bookingData.clientId })

        allFcms.forEach(element => {
            sendNotify({ title: "Your Booking has been rejected!", body: "The vehicle owner has rejected your booking. Please try to book another vehicle", token: element.fcm_token })
        });

        res.status(200).send({ success: true, message: "booking deleted succesfully!" });
    } catch (error) {
        console.error('Error deleting host booking:', error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
})


router.post('/booking_status_change', fetchuser, async (req, res) => {
    try {
        const bodyData = req.body
        const bookingId = req.body.bookingId

        console.warn(bodyData)
        const dataByStatus = await BookingsModel.findByIdAndUpdate(bookingId, { ...bodyData })



        let hostIdgetting = await VehicleModel.find({ _id: dataByStatus.vehicleId })
        const vehicleDetails = hostIdgetting?.[0];

        if (bodyData?.payment == "pending") {
            const clientAllFcms = await FCMModel.find({ userId: dataByStatus.clientId })
            clientAllFcms?.forEach(element => {
                sendNotify({ title: `Vehicle request accepted!`, body: `The vehicle owner has accepted your request for ${vehicleDetails?.name}.`, token: element?.fcm_token })
            });
        } else {
            const hostAllFcms = await FCMModel.find({ userId: dataByStatus.hostId })
            hostAllFcms?.forEach(element => {
                sendNotify({ title: `Payment recieved for ${vehicleDetails?.name}!`, body: `You will receive the amount of ₹${dataByStatus?.totalPrice} once the trip has begun.`, token: element?.fcm_token })
            });
        }



        res.status(200).send({ success: true, message: "booking status has been changed succesfully!" });
    } catch (error) {
        console.error('Error changing status for booking:', error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
})

router.post('/booking_payment', fetchuser, async (req, res) => {
    try {
        const bookingId = req.body.bookingId
        const dataByStatus = await BookingsModel.findByIdAndUpdate(bookingId, { bookingStatus: "started" })
        const bookingTrxn = await BookingTransactionsModel.create({ withDrawStatus: 'new', clientId: dataByStatus.clientId, bookingId: bookingId, hostId: dataByStatus.hostId, amount: dataByStatus.totalPrice })

        let hostIdgetting = await VehicleModel.find({ _id: dataByStatus.vehicleId })
        const vehicleDetails = hostIdgetting?.[0];

        const allFcms = await FCMModel.find({ userId: dataByStatus.hostId })

        allFcms.forEach(element => {
            sendNotify({ title: `Payment recieved for ${vehicleDetails?.name}!`, body: `An amount of ₹${dataByStatus?.totalPrice} has been received to your wallet.`, token: element?.fcm_token })
        });

        res.status(200).send({ success: true, message: "booking payment is done succesfully!" });
    } catch (error) {
        console.error('Error create payment for booking:', error);
        res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
})


// Assuming this function is an Express route handler
router.post('/get_transaction_details', fetchuser, async (req, res) => {
    try {
        const hostId = req.user.id; // Assuming hostId is passed in the request params
        // const hostId = req.body.hostId; // Assuming hostId is passed in the request params

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Query to get today's earnings for the specified host
        const todayEarnings = await BookingTransactionsModel.find({
            hostId: hostId,
            date: { $gte: startOfToday, $lt: endOfToday }
        });

        // Query to get overall earnings for the specified host
        const overallEarnings = await BookingTransactionsModel.find({ hostId: hostId });

        // Calculate total earning for the specified host
        let totalEarning = 0;
        let allTransaction = []
        for (let index = 0; index < overallEarnings.length; index++) {
            const earning = overallEarnings[index]._doc;
            const bookinRef = await BookingsModel.find({ _id: earning?.bookingId });

            const amount = parseFloat(earning?.amount) + parseFloat(bookinRef?.[0]?._doc?.extendedPrice || "0") + parseFloat(bookinRef?.[0]?._doc?.nonInformedExtendedPrice || "0")

            if (bookinRef?.[0]?._doc.bookingStatus != "reject") {
                allTransaction = [{ ...earning, ...bookinRef?.[0]?._doc, amount }, ...allTransaction]
                totalEarning += amount;
            }

        }

        res.json({
            todaysEarning: todayEarnings?.reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
            overallEarning: allTransaction,
            totalEarning: totalEarning
        });
    } catch (error) {
        console.error("Error fetching earnings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/extend_trip', async (req, res) => {
    try {
        const responceData = await BookingsModel.findByIdAndUpdate(req.body?.bookingId, { extendedHours: req.body?.extendedHours })


        let hostIdgetting = await VehicleModel.find({ _id: responceData.vehicleId })
        const vehicleDetails = hostIdgetting?.[0];

        const allFcms = await FCMModel.find({ userId: responceData.hostId })

        allFcms.forEach(element => {
            sendNotify({ title: `Trip has been extended!`, body: `The duration of the ${vehicleDetails.name} trip has been extended by an additional ${req.body?.extendedHours} hours.`, token: element.fcm_token })
        });

        res.json({ status: true, ...responceData._doc })
    } catch (error) {
        console.error("Error extended trip:", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.post('/finish_trip', async (req, res) => {
    try {
        const responceData = await BookingsModel.findByIdAndUpdate(req.body?.bookingId, { bookingStatus: 'completed', finalExtendedHours: req.body?.finalExtendedHours, extendedPrice: req.body?.extendedPrice, nonInformedExtendedPrice: req.body?.nonInformedExtendedPrice })

        let hostIdgetting = await VehicleModel.find({ _id: responceData.vehicleId })
        const vehicleDetails = hostIdgetting?.[0];

        const allFcms = await FCMModel.find({ userId: responceData.hostId })

        allFcms.forEach(element => {
            sendNotify({ title: `Trip ended!`, body: `The ${vehicleDetails.name} trip has been successfully concluded.`, token: element.fcm_token })
        });


        res.json({ status: true, ...responceData._doc })
    } catch (error) {
        console.error("Error extended trip:", error);
        res.status(500).json({ error: "Internal server error" });
    }
})



module.exports = router