const mongoose = require('mongoose');
const { Schema } = mongoose;

const FCMSchema = new Schema({
    userId:{
        type: String,
        required: true
    },
    fcm_token: {
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
  });
  const FCMModel = mongoose.model('fcm_tokens', FCMSchema);
  module.exports = FCMModel;