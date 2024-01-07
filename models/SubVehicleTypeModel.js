const mongoose = require('mongoose');
const { Schema } = mongoose;

const subVehicleTypeSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    vehicleTypeId: {
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
  });
  const SubVehicleTypeModel = mongoose.model('sub_vehicle_type', subVehicleTypeSchema);
  module.exports = SubVehicleTypeModel;