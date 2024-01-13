const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  vehicleId: { type: String, required: true },
});

const WishListModel = mongoose.model('wishlist', wishlistSchema);

module.exports = WishListModel;
