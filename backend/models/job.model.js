const mongoose = require("mongoose");
const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        company: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        jobType: {
            type: String,
            enum: ["Full-time", "Part-time", "Internship", "Contract"],
            default: "Full-time",
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        salary: {
            type: String,
            default: "Not disclosed",
        },
        skills: {
            type: [String],
            default: [],
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Job", jobSchema);