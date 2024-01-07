const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');

const mongoURI = "mongodb+srv://ravikarsahay55:projectxpass@project-x-cluster.7dmaeje.mongodb.net/wheelrents"

const connectToMongo = async()=>{
  await mongoose.connect(mongoURI)
}

module.exports = connectToMongo;

