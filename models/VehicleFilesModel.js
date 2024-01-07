const mongoose = require('mongoose');
const { Schema } = mongoose;

const FileSchema = new Schema({
    vehicleId:{
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
  });
  const VehicleFilesModel = mongoose.model('vehiclefiles', FileSchema);
  module.exports = VehicleFilesModel;