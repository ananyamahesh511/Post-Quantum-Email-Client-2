const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    default: "Anonymous",
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  chatRooms: {
    type: [String],
    default: [],
  },
  online: {
    type: Boolean,
    default: false,
  },
  isExports: {
    type: Boolean,
    default: true,
  },
  isScreenshots: {
    type: Boolean,
    default: true,
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;