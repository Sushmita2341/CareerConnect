const mongoose = require("mongoose");
const Notification = require("../models/notification.model");

async function getNotifications(req, res) {
    try {
        const notifications = await Notification.find({
            recipient: req.user.id,
        })
            .populate("sender", "name email profilePicture")
            .sort({ createdAt: -1 })
            .limit(100);

        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false,
        });

        return res.status(200).json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("GET NOTIFICATIONS ERROR:", error);
        return res.status(500).json({
            message: "Unable to load notifications.",
        });
    }
}

async function markNotificationRead(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid notification ID.",
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user.id,
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found.",
            });
        }

        return res.status(200).json({
            message: "Notification marked as read.",
            notification,
        });
    } catch (error) {
        console.error("MARK NOTIFICATION ERROR:", error);
        return res.status(500).json({
            message: "Unable to update notification.",
        });
    }
}

async function markAllNotificationsRead(req, res) {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({
            message: "All notifications marked as read.",
        });
    } catch (error) {
        console.error("MARK ALL NOTIFICATIONS ERROR:", error);
        return res.status(500).json({
            message: "Unable to update notifications.",
        });
    }
}
async function markInterviewNotificationsRead(req, res) {
    try {
        await Notification.updateMany(
            {
                recipient: req.user.id,
                type: "interview_request",
                isRead: false,
            },
            {
                $set: { isRead: true, }
            }
        );

        return res.status(200).json({
            message: "Interview notifications marked as read.",
        });
    } catch (error) {
        console.error(
            "MARK INTERVIEW NOTIFICATIONS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Unable to update interview notifications.",
        });
    }
}

module.exports = {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    markInterviewNotificationsRead,
};