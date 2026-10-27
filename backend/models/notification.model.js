const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true,
        },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, },
        type: { type: String, enum: ["connection_request", "job_application", "interview_request", "message",], required: true, },
        message: { type: String, required: true, trim: true, }, link: { type: String, default: "/notifications", },
        relatedId: { type: mongoose.Schema.Types.ObjectId, default: null, },
        isRead: { type: Boolean, default: false, },
    }, { timestamps: true }); notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1, });
module.exports = mongoose.model("Notification", notificationSchema);