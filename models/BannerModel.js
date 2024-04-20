const mongoose = require('mongoose');
const { Schema } = mongoose;

const BannerSchema = new Schema({
    data:{
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
  const BannerModel = mongoose.model('banner_model', BannerSchema);
  module.exports = BannerModel;