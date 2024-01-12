const express = require('express');
const router = express.Router();
const { body, checkSchema, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');

let path = require('path');
const multer = require('multer');
const BookingsModel = require('../models/BookingsModel');
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
            const createBooking = await BookingsModel.create({ vehicleId, userId, totalPrice, endDate, startDate })
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


module.exports = router