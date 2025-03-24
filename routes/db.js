const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
  googleId: { type: String, unique: true, sparse: true }, // Add googleId for Google users
  email: { type: String, unique: true },
  password: { type: String }, // Optional for Google users
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, default: "user" }
});

const eventSchema = new Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  participants: [{
    _id: { type: Schema.Types.ObjectId, auto: true }, // Unique ObjectId for each participant
    name: { type: String, required: true },
    email: { type: String, required: true, match: /.+\@.+\..+/ }
  }]
});

const userModel = mongoose.model("user", userSchema);
const eventModel = mongoose.model("event", eventSchema);

module.exports = {
  userModel,
  eventModel
};