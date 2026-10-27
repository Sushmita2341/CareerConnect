const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        Lowercase: true,
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false,
    },
    //New field for Job Seeker and Recuiter
    role: {
        type: String,
        enum: ["jobseeker", "recruiter"],
        default: "jobseeker"
    },

    active: {
        type: Boolean,
        default: true,
    },

    profilePicture: {
        type: String,
        default: "default.jpg",
    },
    resume: {
        type: String,
        default: "",
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