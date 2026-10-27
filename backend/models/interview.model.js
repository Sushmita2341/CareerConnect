const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
    {
        recruiter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        scheduledAt: {
            type: Date,
            required: true,
        },
        message: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000,
        },
        status: {
            type: String,
            enum: ["Pending", "Accepted", "Declined", "Cancelled"],
            default: "Pending",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);