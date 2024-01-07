const express = require('express');
const router = express.Router();
const { body, checkSchema, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');
const VehicleModel = require('../models/VehicleModel');

let path = require('path');
const multer = require('multer');
const VehicleFilesModel = require('../models/VehicleFilesModel');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/vehicle')
    },
    filename: function (req, file, cb) {
        cb(null,  Date.now() + "-wheelrents-" + Math.random() + file.originalname);
    }
})
const upload = multer({ storage: storage })


//  To Get all vehicle by host 
router.get('/getbyuser', fetchuser, async (req, res) => {
    try {
        const vehicleList = await VehicleModel.find({ userId: req.user.id })
        let vehicleListWithImg = []
        for (let index = 0; index < vehicleList.length; index++) {
            const element = vehicleList[index];
            const files =  await VehicleFilesModel.find({vehicleId: element._doc._id})
            console.warn(element._doc._id)
            vehicleListWithImg.push({...element._doc, files: files})
        }
        return res.send(vehicleListWithImg)
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})


//  To Get all vehicle for Home Screen 
router.get('/get', async (req, res) => {
    try {
        const vehicleList = await VehicleModel.find({})
        let vehicleListWithImg = []
        for (let index = 0; index < vehicleList.length; index++) {
            const element = vehicleList[index];
            const files =  await VehicleFilesModel.find({vehicleId: element._doc._id})
            console.warn(element._doc._id)
            vehicleListWithImg.push({...element._doc, files: files})
        }
        return res.send(vehicleListWithImg)
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})


//  To add vehicle by host
router.post('/add', upload.array('files', 6), fetchuser, async (req, res) => {
    try {
        let files = []
        const data = req.body
        const newVehicle = await VehicleModel.create({ ...data, userId: req.user.id })


        for (let index = 0; index < req.files.length; index++) {
            files.push({ vehicleId: newVehicle._doc._id, fileName: req.files[index].filename })
            
        }
        await VehicleFilesModel.insertMany(files)

        return res.send({ success: true, ...data, userId: req.user.id, files })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})

//  To update vehicle by host and vehicle id
router.put('/update', fetchuser, async (req, res) => {
    try {
        const data = req.body
        const payload = {
            "name": data.name,
            "vehicleCategory": data.vehicleCategory,
            "transmission": data.transmission,
            "fuelType": data.fuelType
        }
        await VehicleModel.findByIdAndUpdate({ _id: data.id }, payload)
        return res.send({ success: true, ...payload })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})

// For Deleting Vehicle by Id
router.delete('/delete', fetchuser, async (req, res) => {
    try {
        const vehicleId = req.body.vehicleId
        if (!vehicleId) {
            return res.status(404).send({ success: false, error: "please provide vehicle id" })
        }
        const deletedVehicle = await VehicleModel.findOneAndDelete({ _id: vehicleId, userId: req.user.id })
        return res.send({ success: true, ...deletedVehicle._doc })
    } catch (error) {
        return res.send({ success: false, ...error })
    }
})


module.exports = router