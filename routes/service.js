const express = require('express');
const router = express.Router();
const { body, checkSchema, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');
const VehicletypesModel = require('../models/VehicletypesModel');
const SubVehicleTypeModel = require('../models/SubVehicleTypeModel');
const multer = require('multer');
const VehicleModel = require('../models/VehicleModel');
const VehicleFilesModel = require('../models/VehicleFilesModel');
const BookingsModel = require('../models/BookingsModel');
const WishListModel = require('../models/WishListModel');
const BannerModel = require('../models/BannerModel');
const BookingTransactionsModel = require('../models/BookingTransactions');
const { sendNotify } = require('../controller/fcmController');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/category')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-wheelrents-" + Math.random() + file.originalname);
    }
})
const upload = multer({ storage: storage })



//  Login required
router.post('/add_vehicle_category', upload.single('image'), async (req, res) => {
    try {
        console.log(req.file)
        await VehicletypesModel.create({
            name: req.body.name,
            image: req.file.filename
        })
        return res.send({ success: true })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})

//  Login required
router.get('/get_vehicle_categories', async (req, res) => {
    try {

        const allVehicletypes = await VehicletypesModel.find({})
        return res.send(allVehicletypes)
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})

router.post('/add_vehicle_sub_categroy', async (req, res) => {
    try {
        const checkVehicle = VehicletypesModel.findById(req.body.vehicleTypeId)
        if (checkVehicle) {
            await SubVehicleTypeModel.create({
                name: req.body.name,
                vehicleTypeId: req.body.vehicleTypeId
            })

            return res.send({ success: true })
        } else {
            return res.status(404).send({ success: false, error: "Not a valid vehicle id!" })
        }
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})


router.get('/get_vehicle_sub_categroy_by_id/:vehicleCategoryId', async (req, res) => {
    try {
        const vehicleCategoryId = req.params.vehicleCategoryId
        const checkVehicle = VehicletypesModel.findById(vehicleCategoryId)
        if (checkVehicle && vehicleCategoryId) {
            const subCategories = await SubVehicleTypeModel.find({
                vehicleTypeId: vehicleCategoryId
            })

            return res.send(subCategories)
        } else {
            return res.status(404).send({ success: false, error: "Not a valid vehicle id!" })
        }
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})





function isAnyVehicleAvailable(bookings, startDate, endDate) {
    for (const booking of bookings) {
        console.log(`Checking booking: ${booking.startDate} to ${booking.endDate}`);
        console.log(`Requested period: ${startDate} to ${endDate}`);

        if (booking.bookingStatus == "pending" || booking.bookingStatus == "completed") return true;

        if (
            (startDate >= booking.startDate && startDate <= booking.endDate) ||
            (endDate >= booking.startDate && endDate <= booking.endDate)
        ) {
            console.warn('Overlapping booking found');
            return false; // Overlapping booking found
        }
        console.log('No overlapping bookings in this iteration');
    }
    return true; // No overlapping bookings found
}


// Search Api //
router.post('/search/:searchString', async (req, res) => {
    try {
        // Constructing case-insensitive regex pattern
        const regexPattern = new RegExp(req.params.searchString, 'i');

        // Parsing input date parameters
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        // Extracting filter headers from the request body
        const filterHeaders = req.body;
        delete filterHeaders.startDate;
        delete filterHeaders.endDate;


        // Fetching vehicles based on filter headers
        const vehicleList = await VehicleModel.find({
            "$or": [
                { "name": { $regex: regexPattern } },
                { "vehicleCategory": { $regex: regexPattern } },
                { "fuelType": { $regex: regexPattern } },
                { "transmission": { $regex: regexPattern } },
                { "vehicleType": { $regex: regexPattern } },
            ],
            ...filterHeaders
        });

        // Iteration for adding images and bookings for each vehicle
        let vehicleListWithImg = [];
        for (let index = 0; index < vehicleList.length; index++) {
            const element = vehicleList[index];
            const files = await VehicleFilesModel.find({ vehicleId: element._doc._id });
            const vehicleBookings = await BookingsModel.find({ vehicleId: element._doc._id });
            const vehicleWish = await WishListModel.find({ vehicleId: element._doc._id });
            vehicleListWithImg.push({ ...element._doc, files: files, bookings: vehicleBookings, isWishList: vehicleWish.length > 0 ? true : false });
        }

        // Sort vehicles based on the number of bookings (from most booked to least booked)
        vehicleListWithImg.sort((a, b) => b.bookings.length - a.bookings.length);

        // Filter vehicles based on availability for the specified date range
        let listingWithDateFilter = [];
        vehicleListWithImg.forEach(item => {
            if (isAnyVehicleAvailable(item?.bookings, startDate, endDate)) {
                listingWithDateFilter.push({
                    ...item,
                    available: isAnyVehicleAvailable(item?.bookings, startDate, endDate)
                });
            }
        });

        return res.send(listingWithDateFilter);

    } catch (error) {
        return res.send({ success: false, ...error });
    }
})


//  Banner Add Model
router.post('/add_banner_image', upload.single('image'), async (req, res) => {
    try {
        await BannerModel.create({
            data: req.body.data,
            image: req.file.filename
        })
        return res.send({ success: true })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})

//  Banner Add Model
router.get('/get_banner_images', async (req, res) => {
    try {
        const allBanners = await BannerModel.find({})
        return res.send({ success: true, allBanners })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})

//  Payment transaction 
router.get('/get_booking_transaction_by_user', fetchuser, async (req, res) => {
    try {
        const user = req.user
        const transactions = await BookingTransactionsModel.find({ hostId: user?.id })

        let tranxWithBooking = []

        for (let index = 0; index < transactions.length; index++) {
            const element = transactions[index];
            const assosiatedBookings = await BookingsModel.find({ _id: element?._doc?.bookingId })
            let obj = {
                ...element?._doc,
                withdrawableAmt: parseInt(assosiatedBookings?.[0]?.totalPrice) + parseInt(assosiatedBookings?.[0]?.extendedPrice || "0") + parseInt(assosiatedBookings?.[0]?.nonInformedExtendedPrice || "0"),
                assosiatedBooking: assosiatedBookings?.[0],
            }
            if (assosiatedBookings?.[0].bookingStatus == "completed" || assosiatedBookings?.[0].bookingStatus == "started" ) {
                if(element?.withDrawStatus == "new"){
                    tranxWithBooking = [obj, ...tranxWithBooking]
                }
            }
        }


        return res.send({ success: true, transactions: tranxWithBooking })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})

// Update Payment transaction status
router.post('/update_host_payment_status', async (req, res) => {
    try {

        const userSelectedTransactions = req.body.transactions
        const withDrawStatus = req.body.withDrawStatus
        const vpaId = req.body.vpaId

        userSelectedTransactions.forEach(async (ele) => {
            await BookingTransactionsModel.findByIdAndUpdate( ele?._id, { withDrawStatus: withDrawStatus, vpaId: vpaId})
        })

        return res.send({ success: true })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})


// Send notification by admin
router.post('/send_notification', async (req, res) => {
    try {
        const {title, message, token} = req.body;

        sendNotify({title, body: message, token})

        return res.send({ success: true })
    } catch (error) {
        console.warn(error)
        return res.send({ success: false, ...error })
    }
})




module.exports = router