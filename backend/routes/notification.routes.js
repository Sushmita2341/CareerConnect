const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth.middleware");
const { getNotifications, markNotificationRead, markAllNotificationsRead, markInterviewNotificationsRead, } = require("../controllers/notification.controller");

router.get("/", authMiddleware, getNotifications);
router.patch("/read-all", authMiddleware, markAllNotificationsRead);
// Keep this specific route before "/:id/read" 
router.patch("/interviews/read", authMiddleware, markInterviewNotificationsRead);
router.patch("/:id/read", authMiddleware, markNotificationRead);

module.exports = router;