const mongoose = require('mongoose');
const { Schema } = mongoose;

const VehicleSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    image:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
  });
  const VehicletypesModel = mongoose.model('vehicletypes', VehicleSchema);
  module.exports = VehicletypesModel;