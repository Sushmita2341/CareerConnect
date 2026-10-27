const mongoose = require("mongoose");
const Message = require("../models/message.model");
const Connection = require("../models/connection.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

// Get the current user's accepted connections
async function getConnectedUserIds(userId) {
    const connections = await Connection.find({
        status: "accepted",
        $or: [
            { requester: userId },
            { recipient: userId },
        ],
    }).select("requester recipient");

    return connections.map((connection) => {
        const requesterId = connection.requester.toString();

        return requesterId === userId.toString()
            ? connection.recipient.toString()
            : requesterId;
    });
}

// GET /api/messages/conversations
async function getConversations(req, res) {
    try {
        const userId = req.user.id;

        const connectedUserIds = await getConnectedUserIds(userId);

        if (connectedUserIds.length === 0) {
            return res.status(200).json({ conversations: [] });
        }

        const messages = await Message.find({
            $or: [
                {
                    sender: userId,
                    recipient: { $in: connectedUserIds },
                },
                {
                    recipient: userId,
                    sender: { $in: connectedUserIds },
                },
            ],
        })
            .sort({ createdAt: -1 })
            .populate("sender", "name email profilePicture")
            .populate("recipient", "name email profilePicture")
            .lean();

        const latestByUser = new Map();

        for (const message of messages) {
            const senderId = message.sender?._id?.toString();
            const recipientId = message.recipient?._id?.toString();

            if (!senderId || !recipientId) continue;

            const otherUserId =
                senderId === userId.toString()
                    ? recipientId
                    : senderId;

            if (!latestByUser.has(otherUserId)) {
                const otherUser =
                    senderId === userId.toString()
                        ? message.recipient
                        : message.sender;

                latestByUser.set(otherUserId, {
                    user: otherUser,
                    lastMessage: message,
                });
            }
        }

        // Also show accepted connections with no messages yet.
        const users = await User.find({
            _id: { $in: connectedUserIds },
        }).select("_id name email profilePicture");

        for (const user of users) {
            const otherUserId = user._id.toString();

            if (!latestByUser.has(otherUserId)) {
                latestByUser.set(otherUserId, {
                    user,
                    lastMessage: null,
                });
            }
        }

        const conversations = Array.from(latestByUser.values()).sort(
            (a, b) =>
                new Date(b.lastMessage?.createdAt || 0).getTime() -
                new Date(a.lastMessage?.createdAt || 0).getTime()
        );

        return res.status(200).json({ conversations });
    } catch (error) {
        console.error("GET CONVERSATIONS ERROR:", error);
        return res.status(500).json({
            message: "Unable to load conversations.",
        });
    }
}

// GET /api/messages/:userId
async function getMessages(req, res) {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;
        if (!mongoose.isValidObjectId(otherUserId)) { return res.status(400).json({ message: "Invalid user ID.", }); } const connectedUserIds = await getConnectedUserIds(currentUserId); if (!connectedUserIds.includes(otherUserId)) { return res.status(403).json({ message: "You can message accepted connections only.", }); } const messages = await Message.find({ $or: [{ sender: currentUserId, recipient: otherUserId, }, { sender: otherUserId, recipient: currentUserId, },], }).sort({ createdAt: -1 }).limit(100).populate("sender", "name email profilePicture").populate("recipient", "name email profilePicture"); messages.reverse(); return res.status(200).json({ messages });
    } catch (error) { console.error("GET MESSAGES ERROR:", error); return res.status(500).json({ message: "Unable to load messages.", }); }
}

// POST /api/messages/:userId
async function sendMessage(req, res) {
    try {
        const senderId = req.user.id;
        const recipientId = req.params.userId;
        const text =
            typeof req.body.text === "string"
                ? req.body.text.trim()
                : "";
        if (!mongoose.isValidObjectId(recipientId)) { return res.status(400).json({ message: "Invalid recipient ID.", }); } if (!text) { return res.status(400).json({ message: "Message cannot be empty.", }); } if (text.length > 5000) { return res.status(400).json({ message: "Message must be 5000 characters or fewer.", }); } if (senderId.toString() === recipientId.toString()) { return res.status(400).json({ message: "You cannot message yourself.", }); } const recipient = await User.findById(recipientId).select("active"); if (!recipient || recipient.active === false) { return res.status(404).json({ message: "Recipient not found or unavailable.", }); } const connectedUserIds = await getConnectedUserIds(senderId); if (!connectedUserIds.includes(recipientId.toString())) { return res.status(403).json({ message: "You can message accepted connections only.", }); } const message = await Message.create({ sender: senderId, recipient: recipientId, text, }); const populatedMessage = await Message.findById(message._id).populate("sender", "name email profilePicture").populate("recipient", "name email profilePicture");
        // Create a notification for the recipient.
        try {
            const sender = await User.findById(senderId).select("name");

            await Notification.create({
                recipient: recipientId,
                sender: senderId,
                type: "message",
                message: `${sender?.name || "Someone"} sent you a message.`,
                link: "messages",
                relatedId: message._id,
            });
        } catch (notificationError) {
            console.error(
                "MESSAGE NOTIFICATION ERROR:",
                notificationError
            );
        }
        return res.status(201).json({ message: "Message sent successfully.", newMessage: populatedMessage, });
    } catch (error) { console.error("SEND MESSAGE ERROR:", error); return res.status(500).json({ message: "Unable to send message.", }); }
}
module.exports = {
    getConversations,
    getMessages,
    sendMessage,
};