const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth.middleware");

const {
    getSavedJobs,
    saveJob,
    removeSavedJob,
} = require("../controllers/savedJob.controller");

router.get("/", authMiddleware, getSavedJobs);
router.post("/:jobId", authMiddleware, saveJob);
router.delete("/:jobId", authMiddleware, removeSavedJob);

module.exports = router;