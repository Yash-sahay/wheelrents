const express = require('express');
const router = express.Router();
const { body, checkSchema, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');
const VehicleModel = require('../models/VehicleModel');

let path = require('path');
const multer = require('multer');
const VehicleFilesModel = require('../models/VehicleFilesModel');
const BookingsModel = require('../models/BookingsModel');

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
            vehicleListWithImg.push({ ...element._doc, files: files, bookings: vehicleBookings });
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
router.delete('/delete', fetchuser, async (req, res) => {
    try {
        // Extracting vehicle ID from the request body
        const vehicleId = req.body.vehicleId;
        // Validating the presence of the vehicle ID
        if (!vehicleId) {
            return res.status(404).send({ success: false, error: "please provide vehicle id" });
        }
        // Finding and deleting the vehicle by ID and user ID
        const deletedVehicle = await VehicleModel.findOneAndDelete({ _id: vehicleId, userId: req.user.id });
        // Returning success response with deleted vehicle information
        return res.send({ success: true, ...deletedVehicle._doc });
    } catch (error) {
        // Returning error response
        return res.send({ success: false, ...error });
    }
});

// Exporting the router
module.exports = router;
