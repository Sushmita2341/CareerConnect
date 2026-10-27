const Interview = require("../models/interview.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const mongoose = require("mongoose");

const sendInterviewRequest = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { candidateId, scheduledAt, message } = req.body;

        const recruiter = await User.findById(recruiterId);

        if (!recruiter || recruiter.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can send interview requests",
            });
        }

        if (!candidateId || !scheduledAt) {
            return res.status(400).json({
                message: "Candidate and interview date are required",
            });
        }

        const interviewDate = new Date(scheduledAt);

        if (
            Number.isNaN(interviewDate.getTime()) ||
            interviewDate <= new Date()
        ) {
            return res.status(400).json({
                message: "Choose a valid future interview date and time",
            });
        }

        const candidate = await User.findById(candidateId);

        if (!candidate || candidate.role !== "jobseeker") {
            return res.status(404).json({
                message: "Job seeker not found",
            });
        }

        const interview = await Interview.create({
            recruiter: recruiterId,
            candidate: candidateId,
            scheduledAt: interviewDate,
            message: message || "",
        });

        // Notify the candidate after successfully creating the interview.
        try {
            await Notification.create({
                recipient: candidateId,
                sender: recruiterId,
                type: "interview_request",
                message: `${recruiter.name} sent you an interview invitation.`,
                link: "/interviews",
                relatedId: interview._id,
            });
        } catch (notificationError) {
            // Keep the interview request successful if notification fails.
            console.error(
                "Interview notification error:",
                notificationError
            );
        }

        return res.status(201).json({
            message: "Interview request sent successfully",
            interview,
        });
    } catch (error) {
        console.error("SEND INTERVIEW REQUEST ERROR:", error);

        return res.status(500).json({
            message: "Failed to send interview request",
        });
    }
};

const getMyInterviews = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const filter =
            user.role === "recruiter"
                ? { recruiter: user._id }
                : { candidate: user._id };

        const interviews = await Interview.find(filter)
            .populate("recruiter", "name email profilePicture")
            .populate(
                "candidate",
                "name email profilePicture bio skills education experience"
            )
            .sort({ scheduledAt: 1 });

        return res.status(200).json(interviews);
    } catch (error) {
        console.error("GET INTERVIEWS ERROR:", error);
        return res.status(500).json({
            message: "Failed to load interviews",
        });
    }
};

const respondToInterview = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["Accepted", "Declined"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Accepted or Declined",
            });
        }

        const interview = await Interview.findOne({
            _id: req.params.id,
            candidate: req.user.id,
            status: "Pending",
        });

        if (!interview) {
            return res.status(404).json({
                message: "Pending interview request not found",
            });
        }
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid interview ID.",
            });
        }

        interview.status = status;
        await interview.save();

        return res.status(200).json({
            message: `Interview request ${status.toLowerCase()}`,
            interview,
        });
    } catch (error) {
        console.error("RESPOND TO INTERVIEW ERROR:", error);
        return res.status(500).json({
            message: "Failed to update interview request",
        });
    }
};
const cancelInterview = async (req, res) => {
    try {
        const recruiter = await User.findById(req.user.id);

        if (!recruiter) {
            return res.status(404).json({
                message: "Recruiter account not found",
            });
        }

        if (recruiter.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can cancel interview invitations",
            });
        }
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid interview ID.",
            });
        }
        const interview = await Interview.findOne({
            _id: req.params.id,
            recruiter: recruiter._id,
            status: "Pending",
        });

        if (!interview) {
            return res.status(404).json({
                message:
                    "Pending invitation not found. It may already be declined, accepted, or cancelled.",
            });
        }

        interview.status = "Cancelled";
        await interview.save();

        return res.status(200).json({
            message: "Interview invitation cancelled successfully",
            interview,
        });
    } catch (error) {
        console.error("Cancel interview error:", error);

        return res.status(500).json({
            message: "Failed to cancel interview invitation",
        });
    }
};

module.exports = {
    sendInterviewRequest,
    getMyInterviews,
    respondToInterview,
    cancelInterview,
};