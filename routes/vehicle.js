const express = require('express');
const router = express.Router();
const { body, checkSchema, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');
const VehicleModel = require('../models/VehicleModel');

let path = require('path');
const multer = require('multer');
const VehicleFilesModel = require('../models/VehicleFilesModel');
const BookingsModel = require('../models/BookingsModel');
const WishListModel = require('../models/WishListModel');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/vehicle');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-wheelrents-" + Math.random() + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Function to check if any vehicle is available for booking in a given time range
function isAnyVehicleAvailable(bookings, startDate, endDate) {
    for (const booking of bookings) {
        console.log(`Checking booking: ${booking.startDate} to ${booking.endDate}`);
        console.log(`Requested period: ${startDate} to ${endDate}`);

        if(booking.bookingStatus == "pending" || booking.bookingStatus == "completed" ) return true;

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

// API endpoint to get vehicles by user with availability filter
router.post('/getbyuser', fetchuser, async (req, res) => {
    try {
        // Parsing input date parameters
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        // Fetching vehicles for the user
        const vehicleList = await VehicleModel.find({ userId: req.user.id });

        // Iteration for adding images and bookings for each vehicle
        let vehicleListWithImg = [];
        for (let index = 0; index < vehicleList.length; index++) {
            const element = vehicleList[index];
            const files = await VehicleFilesModel.find({ vehicleId: element._doc._id });
            const vehicleBookings = await BookingsModel.find({ vehicleId: element._doc._id });
            vehicleListWithImg.push({ ...element._doc, files: files, bookings: vehicleBookings });
        }

        // Filter vehicles based on availability for the specified date range
        let listingWithDateFilter = [];
        vehicleListWithImg.forEach(item => {
            listingWithDateFilter.push({
                ...item,
                available: isAnyVehicleAvailable(item?.bookings, startDate, endDate)
            });
        });

        return res.send(listingWithDateFilter);
    } catch (error) {
        return res.send({ success: false, ...error });
    }
});

// API endpoint to get all vehicles for Home Screen with availability filter
router.post('/get', async (req, res) => {
    try {
        // Parsing input date parameters
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);

        // Extracting filter headers from the request body
        const filterHeaders = req.body;
        delete filterHeaders.startDate;
        delete filterHeaders.endDate;

        // Fetching vehicles based on filter headers
        const vehicleList = await VehicleModel.find({ ...filterHeaders });

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
            listingWithDateFilter.push({
                ...item,
                available: isAnyVehicleAvailable(item?.bookings, startDate, endDate)
            });
        });

        return res.send(listingWithDateFilter);
    } catch (error) {
        return res.send({ success: false, ...error });
    }
});


// API endpoint to add a new vehicle by the host
router.post('/add', upload.array('files', 6), fetchuser, async (req, res) => {
    try {
        // Initialize empty array to store file information
        let files = [];
        // Extracting data from the request body
        const data = req.body;
        // Creating a new vehicle with the user ID
        const newVehicle = await VehicleModel.create({ ...data, userId: req.user.id });

        // Iteration to add file information for each uploaded file
        for (let index = 0; index < req.files.length; index++) {
            files.push({ vehicleId: newVehicle._doc._id, fileName: req.files[index].filename });
        }

        // Inserting file information into the VehicleFilesModel
        await VehicleFilesModel.insertMany(files);

        // Returning success response with data, user ID, and file information
        return res.send({ success: true, ...data, userId: req.user.id, files });
    } catch (error) {
        // Returning error response
        return res.send({ success: false, ...error });
    }
});

// API endpoint to update a vehicle by the host and vehicle ID
router.put('/update', fetchuser, async (req, res) => {
    try {
        // Extracting data from the request body
        const data = req.body;
        // Creating a payload for updating the vehicle
        const payload = { ...data };
        // Updating the vehicle based on the vehicle ID
        await VehicleModel.findByIdAndUpdate({ _id: data.id }, payload);
        // Returning success response with updated payload
        return res.send({ success: true, ...payload });
    } catch (error) {
        // Returning error response
        return res.send({ success: false, ...error });
    }
});

// API endpoint to delete a vehicle by ID
router.delete('/delete/:vehicleId', fetchuser, async (req, res) => {
    try {
        // Extracting vehicle ID from the request body
        const { vehicleId } = req.params;
        // Validating the presence of the vehicle ID
        if (!vehicleId) {
            return res.status(404).send({ success: false, error: "please provide vehicle id" });
        }
        // Finding and deleting the vehicle by ID and user ID
        const deletedVehicle = await VehicleModel.findByIdAndDelete({ _id: vehicleId, userId: req.user.id });
        // Returning success response with deleted vehicle information
        console.log(deletedVehicle)
        return res.send({ success: true, ...deletedVehicle });
    } catch (error) {
        // Returning error response
        return res.send({ success: false, ...error });
    }
});




// API endpoint to add or remove an item from the wishlist
router.post('/wishlist', fetchuser, async (req, res) => {
    try {
        const { vehicleId } = req.body;
        const userId = req.user.id;

        // Check if the item is already in the wishlist
        const existingItem = await WishListModel.findOne({ userId, vehicleId });

        if (existingItem) {
            // If the item exists, delete it
            await WishListModel.deleteOne({ userId, vehicleId });
            return res.status(200).json({ message: 'Item removed from the wishlist' });
        }

        // Create a new wishlist item
        const newItem = new WishListModel({
            userId,
            vehicleId,
        });

        // Save the new item to the database
        await newItem.save();

        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// API endpoint to get all wishlist items for a specific user
router.get('/wishlist', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all wishlist items for the specified user
        const wishlistItems = await WishListModel.find({ userId });

        res.status(200).json(wishlistItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API endpoint to delete wishlist items for a specific user
router.delete('/wishlistDelete/:vehicleId', fetchuser, async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const userId = req.user.id;
        console.log("vec---->", vehicleId)
        await WishListModel.deleteOne({ userId, vehicleId });
        return res.status(200).json({ message: 'Item removed from the wishlist' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Exporting the router
module.exports = router;
