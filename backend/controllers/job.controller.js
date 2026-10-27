const mongoose = require("mongoose");
const Job = require("../models/job.model");
const Application = require("../models/application.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

// Check the logged-in user's role from MongoDB
async function getUserWithRole(userId) {
    return User.findById(userId).select("role name active");
}

// 1. Recruiter creates a job
async function createJob(req, res) {
    try {
        const user = await getUserWithRole(req.user.id);

        if (!user || user.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can post jobs.",
            });
        }

        const {
            title,
            company,
            location,
            jobType,
            description,
            salary,
            skills,
        } = req.body;

        if (
            !title?.trim() ||
            !company?.trim() ||
            !location?.trim() ||
            !description?.trim()
        ) {
            return res.status(400).json({
                message: "Title, company, location, and description are required.",
            });
        }

        const allowedTypes = [
            "Full-time",
            "Part-time",
            "Internship",
            "Contract",
        ];

        if (jobType && !allowedTypes.includes(jobType)) {
            return res.status(400).json({
                message: "Invalid job type.",
            });
        }

        const job = await Job.create({
            title: title.trim(),
            company: company.trim(),
            location: location.trim(),
            jobType: jobType || "Full-time",
            description: description.trim(),
            salary: typeof salary === "string" && salary.trim()
                ? salary.trim()
                : "Not disclosed",
            skills: Array.isArray(skills)
                ? skills
                    .filter((skill) => typeof skill === "string")
                    .map((skill) => skill.trim())
                    .filter(Boolean)
                : typeof skills === "string"
                    ? skills.split(",").map((skill) => skill.trim()).filter(Boolean)
                    : [],
            postedBy: user._id,
        });

        return res.status(201).json({
            message: "Job posted successfully.",
            job,
        });
    } catch (error) {
        console.error("CREATE JOB ERROR:", error);
        return res.status(500).json({
            message: "Unable to create job.",
        });
    }
}

// 2. Browse and search active jobs
async function getJobs(req, res) {
    try {
        const { search, location, jobType } = req.query;
        const filter = { isActive: true };

        if (search && typeof search === "string" && search.trim()) {
            const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(term, "i");

            filter.$or = [
                { title: regex },
                { company: regex },
                { description: regex },
                { skills: regex },
            ];
        }

        if (location && typeof location === "string" && location.trim()) {
            filter.location = {
                $regex: location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                $options: "i",
            };
        }

        if (jobType && typeof jobType === "string") {
            const allowedTypes = [
                "Full-time",
                "Part-time",
                "Internship",
                "Contract",
            ];

            if (!allowedTypes.includes(jobType)) {
                return res.status(400).json({
                    message: "Invalid job type.",
                });
            }

            filter.jobType = jobType;
        }

        const jobs = await Job.find(filter)
            .populate("postedBy", "name email profilePicture")
            .sort({ createdAt: -1 });

        return res.status(200).json({ jobs });
    } catch (error) {
        console.error("GET JOBS ERROR:", error);
        return res.status(500).json({
            message: "Unable to load jobs.",
        });
    }
}

// 3. Get one active job
async function getJobById(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid job ID." });
        }

        const job = await Job.findOne({
            _id: req.params.id,
            isActive: true,
        }).populate("postedBy", "name email profilePicture");

        if (!job) {
            return res.status(404).json({ message: "Job not found." });
        }

        return res.status(200).json({ job });
    } catch (error) {
        console.error("GET JOB ERROR:", error);
        return res.status(500).json({
            message: "Unable to load job.",
        });
    }
}

// 4. Jobseeker applies for a job
async function applyForJob(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid job ID.",
            });
        }

        const user = await getUserWithRole(req.user.id);

        if (!user || user.role !== "jobseeker") {
            return res.status(403).json({
                message: "Only jobseekers can apply for jobs.",
            });
        }

        const job = await Job.findOne({
            _id: req.params.id,
            isActive: true,
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found or closed.",
            });
        }

        if (job.postedBy.toString() === user._id.toString()) {
            return res.status(400).json({
                message: "You cannot apply for your own job.",
            });
        }

        const application = await Application.create({
            job: job._id,
            applicant: user._id,
        });

        // Notify the recruiter after the application is saved.
        try {
            await Notification.create({
                recipient: job.postedBy,
                sender: user._id,
                type: "job_application",
                message: `${user.name || "A candidate"} applied for your job: ${job.title}.`,
                link: `/jobs/manage/${job._id}`,
                relatedId: application._id,
            });
        } catch (notificationError) {
            // The application remains successful if notification creation fails.
            console.error(
                "Job application notification error:",
                notificationError
            );
        }

        return res.status(201).json({
            message: "Application submitted successfully.",
            application,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already applied for this job.",
            });
        }

        console.error("APPLY JOB ERROR:", error);

        return res.status(500).json({
            message: "Unable to apply for job.",
        });
    }
}

// 5. Jobseeker views their applications
async function getMyApplications(req, res) {
    try {
        const user = await getUserWithRole(req.user.id);

        if (!user || user.role !== "jobseeker") {
            return res.status(403).json({
                message: "Only jobseekers can view their applications.",
            });
        }

        const applications = await Application.find({
            applicant: user._id,
        })
            .populate({
                path: "job",
                populate: {
                    path: "postedBy",
                    select: "name email profilePicture",
                },
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ applications });
    } catch (error) {
        console.error("MY APPLICATIONS ERROR:", error);
        return res.status(500).json({
            message: "Unable to load your applications.",
        });
    }
}
//5. getjobapplication
async function getJobApplication(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid application ID.",
            });
        }

        const user = await getUserWithRole(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        const application = await Application.findById(id)
            .populate("job")
            .populate("applicant", "name email profilePicture");

        if (!application || !application.job) {
            return res.status(404).json({
                message: "Job application not found.",
            });
        }

        const isApplicant =
            application.applicant &&
            application.applicant._id.toString() === user._id.toString();

        const isRecruiter =
            application.job.postedBy.toString() === user._id.toString();

        if (!isApplicant && !isRecruiter) {
            return res.status(403).json({
                message: "You do not have permission to view this application.",
            });
        }

        return res.status(200).json({
            message: "Job application retrieved successfully.",
            application,
        });
    } catch (error) {
        console.error("GET JOB APPLICATION ERROR:", error);

        return res.status(500).json({
            message: "Unable to retrieve job application.",
        });
    }
}
//jobApplicants
async function getJobApplicants(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid job ID.",
            });
        }

        const user = await getUserWithRole(req.user.id);

        if (!user || user.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can view applicants.",
            });
        }

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
            });
        }

        if (job.postedBy.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "You can only view applicants for your own jobs.",
            });
        }

        const applications = await Application.find({ job: job._id })
            .populate("applicant", "name email profilePicture")
            .sort({ createdAt: -1 });

        return res.status(200).json({ applications });
    } catch (error) {
        console.error("GET JOB APPLICANTS ERROR:", error);

        return res.status(500).json({
            message: "Unable to load applicants.",
        });
    }
}

// 6. Recruiter views applicants for their own job
async function updateApplicationStatus(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid application ID.",
            });
        }

        const user = await getUserWithRole(req.user.id);

        if (!user || user.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can update application status.",
            });
        }

        const { status } = req.body;

        const allowedStatuses = [
            "Applied",
            "Under Review",
            "Shortlisted",
            "Rejected",
            "Hired",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid application status.",
            });
        }

        const application = await Application.findById(req.params.id)
            .populate("job");

        if (!application || !application.job) {
            return res.status(404).json({
                message: "Application or associated job not found.",
            });
        }

        if (
            application.job.postedBy.toString() !== user._id.toString()
        ) {
            return res.status(403).json({
                message: "Only the job owner can update application status.",
            });
        }

        const previousStatus = application.status;

        application.status = status;
        await application.save();

        if (previousStatus !== status) {
            const messages = {
                "Under Review": `Your application for ${application.job.title} is under review.`,
                "Shortlisted": `Congratulations! You have been shortlisted for ${application.job.title}.`,
                "Rejected": `Your application for ${application.job.title} has been rejected.`,
                "Hired": `Congratulations! You have been hired for ${application.job.title}.`,
                "Applied": `Your application for ${application.job.title} has been marked as applied.`,
            };

            try {
                await Notification.create({
                    recipient: application.applicant,
                    sender: user._id,
                    type: "job_application",
                    message: messages[status],
                    link: "/notifications",
                    relatedId: application._id,
                    isRead: false,
                });
            } catch (notificationError) {
                console.error(
                    "APPLICATION STATUS NOTIFICATION ERROR:",
                    notificationError
                );
            }
        }

        return res.status(200).json({
            message: "Application status updated.",
            application,
        });
    } catch (error) {
        console.error("UPDATE APPLICATION ERROR:", error);

        return res.status(500).json({
            message: "Unable to update application status.",
        });
    }
}
// 8. Recruiter closes their own job
async function closeJob(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid job ID." });
        }

        const user = await getUserWithRole(req.user.id);

        if (!user || user.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can close jobs.",
            });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: "Job not found." });
        }

        if (job.postedBy.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "Only the job owner can close this job.",
            });
        }

        job.isActive = false;
        await job.save();

        return res.status(200).json({
            message: "Job closed successfully.",
        });
    } catch (error) {
        console.error("CLOSE JOB ERROR:", error);
        return res.status(500).json({
            message: "Unable to close job.",
        });
    }
}

// 9. Recruiter views their own jobs
async function getMyJobs(req, res) {
    try {
        const user = await getUserWithRole(req.user.id);

        if (!user || user.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can view their posted jobs.",
            });
        }

        const jobs = await Job.find({ postedBy: user._id })
            .sort({ createdAt: -1 });

        return res.status(200).json({ jobs });
    } catch (error) {
        console.error("GET MY JOBS ERROR:", error);
        return res.status(500).json({
            message: "Unable to load your jobs.",
        });
    }
}

module.exports = {
    createJob,
    getJobs,
    getJobById,
    applyForJob,
    getMyApplications,
    getJobApplication,
    getJobApplicants,
    updateApplicationStatus,
    closeJob,
    getMyJobs,
};