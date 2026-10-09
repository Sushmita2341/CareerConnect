const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },

    active: {
        type: Boolean,
        default: true,
    },

    profilePicture: {
        type: String,
        default: "default.jpg",
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

    token: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        default: ""
    },

    skills: {
        type: [String],
        default: []
    },

    education: {
        type: String,
        default: ""
    },

    experience: {
        type: String,
        default: ""
    },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;