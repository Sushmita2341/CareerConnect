const express = require("express");
const router = express.Router();
const allowRoles = require("../auth/role.middleware");
const authMiddleware = require("../auth/auth.middleware");

const {
    sendInterviewRequest,
    getMyInterviews,
    respondToInterview,
    cancelInterview,
} = require("../controllers/interview.controller");

router.get("/", authMiddleware, getMyInterviews);
router.post("/", authMiddleware, allowRoles("recruiter"), sendInterviewRequest);
router.patch("/:id/respond", authMiddleware, respondToInterview);
router.patch("/:id/cancel", authMiddleware, cancelInterview);

module.exports = router;