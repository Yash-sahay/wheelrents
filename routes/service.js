const express = require('express');
const router = express.Router();
const { body, checkSchema, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');
const VehicletypesModel = require('../models/VehicletypesModel');
const SubVehicleTypeModel = require('../models/SubVehicleTypeModel');
const multer = require('multer');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/category')
    },
    filename: function (req, file, cb) {
        cb(null,  Date.now() + "-wheelrents-" + Math.random() + file.originalname);
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
        return res.send({success: true})
    } catch (error) {
        return res.send({success: false, ...error})
    }
})

//  Login required
router.get('/get_vehicle_categories',  async (req, res) => {
    try {
        
       const allVehicletypes = await VehicletypesModel.find({})
        return res.send(allVehicletypes)
    } catch (error) {
        return res.send({success: false, ...error})
    }
})

router.post('/add_vehicle_sub_categroy',  async (req, res) => {
    try {
        const checkVehicle = VehicletypesModel.findById(req.body.vehicleTypeId)
        if(checkVehicle){
            await SubVehicleTypeModel.create({
                name: req.body.name,
                vehicleTypeId: req.body.vehicleTypeId
            })
            
            return res.send({success: true})
        }else {
            return res.status(404).send({success: false, error: "Not a valid vehicle id!"})
        }
    } catch (error) {
        return res.send({success: false, ...error})
    }
})


router.get('/get_vehicle_sub_categroy_by_id',  async (req, res) => {
    try {
        const vehicleTypeId = req.body.vehicleTypeId
        const checkVehicle = VehicletypesModel.findById(vehicleTypeId)
        if(checkVehicle && vehicleTypeId){
            const subCategories = await SubVehicleTypeModel.find({
                vehicleTypeId: vehicleTypeId
            })
            
            return res.send(subCategories)
        }else {
            return res.status(404).send({success: false, error: "Not a valid vehicle id!"})
        }
    } catch (error) {
        return res.send({success: false, ...error})
    }
})
module.exports = router