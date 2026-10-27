const express = require("express");
const router = express.Router();

const authMiddleware = require("../auth/auth.middleware");
const allowRoles = require("../auth/role.middleware");
const { analyzeResume } = require("../controllers/resume.controller");

router.get(
    "/analyze",
    authMiddleware,
    allowRoles("jobseeker"),
    analyzeResume
);

module.exports = router;