const express = require('express');
const router = express.Router();
const { body, checkSchema, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');

let path = require('path');
const multer = require('multer');
const BookingsModel = require('../models/BookingsModel');
const VehicleModel = require('../models/VehicleModel');
const VehicleFilesModel = require('../models/VehicleFilesModel');
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
            let hostIdgetting = await VehicleModel.find({ _id : vehicleId })
            hostIdgetting = hostIdgetting?.[0]?.userId

            const createBooking = await BookingsModel.create({ vehicleId, clientId: userId, hostId: hostIdgetting, totalPrice, endDate, startDate })
            return res.send({ success: true, ...createBooking, startDate })
        }

        return res.send({ success: false, error: "please provide vehicle id" })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})

// For get all booking Vehicle by vehicleId
// router.post('/add', fetchuser, async (req, res) => {
//     try {
//         const vehicleId = req.body.vehicleId;
//         const userId = req.user.id;
//         const totalPrice = req.body.totalPrice;
//         const startDate = new Date(req.body.startDate);
//         const endtDate = new Date(req.body.endtDate);

//         if(vehicleId && userId){
//             const createBooking = await BookingsModel.create({ vehicleId, userId, totalPrice, endtDate, startDate })
//             return res.send({success: true, ...createBooking, startDate})
//         }

//         return res.send({ success: false, error: "please provide vehicle id" })
//     } catch (error) {
//         return res.send({ success: false, ...error })
//     }
// })

router.post('/get_host_bookings', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        console.warn(userId)
        const getAllBooking = await BookingsModel.find({ hostId: userId });
        
        let array = [];
        for (let index = 0; index < getAllBooking.length; index++) {
            const currObj = getAllBooking[index]?._doc;

            if (currObj && currObj.vehicleId) {
                const getLinkedVehicle = await VehicleModel.find({userId: currObj.hostId, _id: currObj.vehicleId});
                const vehicle_image = await VehicleFilesModel.find({vehicleId: currObj.vehicleId});
                if (getLinkedVehicle) {
                    const veh  = getLinkedVehicle?.[0]?._doc
                    delete veh._id
                    array.push({ ...currObj, ...veh, images: vehicle_image });
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


module.exports = router