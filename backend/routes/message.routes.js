const express = require("express");
const router = express.Router();

const authMiddleware = require("../auth/auth.middleware");
const {
    getConversations,
    getMessages,
    sendMessage,
} = require("../controllers/message.controller");

// Keep this route before /:userId.
router.get("/conversations", authMiddleware, getConversations);
router.get("/:userId", authMiddleware, getMessages);
router.post("/:userId", authMiddleware, sendMessage);


module.exports = router;