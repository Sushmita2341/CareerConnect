const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth.middleware");
const roleMiddleware = require("../auth/role.middleware");
const mockInterviewController = require("../controllers/mockInterview.controller");
const { startInterview, submitAnswer, getInterview, } = mockInterviewController; console.log("Mock interview route checks:", { authMiddleware: typeof authMiddleware, roleMiddleware: typeof roleMiddleware, startInterview: typeof startInterview, submitAnswer: typeof submitAnswer, getInterview: typeof getInterview, }); router.post("/start", authMiddleware, roleMiddleware("jobseeker"), startInterview); router.post("/answer", authMiddleware, roleMiddleware("jobseeker"), submitAnswer); router.get("/:id", authMiddleware, roleMiddleware("jobseeker"), getInterview); module.exports = router;