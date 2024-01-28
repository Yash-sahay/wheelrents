const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    userType:{
        type: String,
        required: true,
        enum: ['host', 'client']
    },
    date:{
        type: Date,
        default: Date.now
    },
    userType:{
        type: String,
        required: true,
        enum: ['host', 'client']
    },
    otp:{
        type: String,
        required: true
    },
  });
  const UserModel = mongoose.model('user', UserSchema);
  module.exports = UserModel;