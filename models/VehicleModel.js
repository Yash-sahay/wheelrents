const mongoose = require('mongoose');
const { Schema } = mongoose;

const VehicleSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    vehicleNo:{
        type: String,
        unique: true,
        required: true
    },
    vehicleCategory: {
        type: String,
        required: true,
    },
    transmission: {
        type: String,
        required: true,
        enum: ['manual', 'automatic']
    },
    userId: {
        type: String,
        required: true,
    },
    fuelType: {
        type: String,
        required: true,
        enum: ['petrol', 'diesel', 'electric', 'CNG']
    },
    description: {
        type: String,
    },
    cost: {
        type: String,
        required: true,
    },
    address1: {
        type: String,
        required: true,
    },
    address2: {
        type: String,
        required: true,
    },
    pinCode: {
        type: String,
        required: true,
    },
    date:{
        type: Date,
        default: Date.now
    },
  });
  const VehicleModel = mongoose.model('vehicles', VehicleSchema);
  module.exports = VehicleModel;