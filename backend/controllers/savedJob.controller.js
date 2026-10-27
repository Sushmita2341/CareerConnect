const mongoose = require("mongoose");
const SavedJob = require("../models/savedJob.model");
const Job = require("../models/job.model");
const User = require("../models/user.model");

// View saved jobs
async function getSavedJobs(req, res) {
    try {
        const user = await User.findById(req.user.id).select("role");

        if (!user || user.role !== "jobseeker") {
            return res.status(403).json({
                message: "Only jobseekers can view saved jobs.",
            });
        }

        const savedJobs = await SavedJob.find({ user: user._id })
            .populate({
                path: "job",
                populate: {
                    path: "postedBy",
                    select: "name email profilePicture",
                },
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            savedJobs: savedJobs.filter((item) => item.job),
        });
    } catch (error) {
        console.error("GET SAVED JOBS ERROR:", error);
        return res.status(500).json({
            message: "Unable to load saved jobs.",
        });
    }
}

// Save a job
async function saveJob(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.jobId)) {
            return res.status(400).json({ message: "Invalid job ID." });
        }

        const user = await User.findById(req.user.id).select("role");

        if (!user || user.role !== "jobseeker") {
            return res.status(403).json({
                message: "Only jobseekers can save jobs.",
            });
        }

        const job = await Job.findOne({
            _id: req.params.jobId,
            isActive: true,
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found or closed.",
            });
        }

        const existing = await SavedJob.findOne({
            user: user._id,
            job: job._id,
        });

        if (existing) {
            return res.status(409).json({
                message: "You have already saved this job.",
            });
        }

        const savedJob = await SavedJob.create({
            user: user._id,
            job: job._id,
        });

        return res.status(201).json({
            message: "Job saved successfully.",
            savedJob,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already saved this job.",
            });
        }

        console.error("SAVE JOB ERROR:", error);
        return res.status(500).json({
            message: "Unable to save job.",
        });
    }
}

// Remove a saved job
async function removeSavedJob(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.jobId)) {
            return res.status(400).json({ message: "Invalid job ID." });
        }

        const user = await User.findById(req.user.id).select("role");

        if (!user || user.role !== "jobseeker") {
            return res.status(403).json({
                message: "Only jobseekers can remove saved jobs.",
            });
        }

        const result = await SavedJob.findOneAndDelete({
            user: user._id,
            job: req.params.jobId,
        });

        if (!result) {
            return res.status(404).json({
                message: "Saved job not found.",
            });
        }

        return res.status(200).json({
            message: "Job removed from saved jobs.",
        });
    } catch (error) {
        console.error("REMOVE SAVED JOB ERROR:", error);
        return res.status(500).json({
            message: "Unable to remove saved job.",
        });
    }
}

module.exports = {
    getSavedJobs,
    saveJob,
    removeSavedJob,
};