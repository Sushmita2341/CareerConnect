const express = require("express");
const router = express.Router();
const allowRoles = require("../auth/role.middleware");
const authMiddleware = require("../auth/auth.middleware");
const {
    createJob,
    getJobs,
    getJobById,
    applyForJob,
    getMyApplications,
    getJobApplicants,
    getJobApplication,
    updateApplicationStatus,
    closeJob,
    getMyJobs,
} = require("../controllers/job.controller");
// Specific routes must come before the generic /:id route.
router.get(
    "/mine",
    authMiddleware,
    allowRoles("recruiter"),
    getMyJobs
);
router.get(
    "/applications/mine",
    authMiddleware,
    allowRoles("jobseeker"),
    getMyApplications
);
// View one application by application ID, if needed.
router.get(
    "/applications/:id",
    authMiddleware,
    getJobApplication
);
// Public job browsing.
router.get("/", getJobs);
// Create a job.
router.post(
    "/",
    authMiddleware,
    allowRoles("recruiter"),
    createJob
);
// Apply for a job.
router.post(
    "/:id/apply",
    authMiddleware,
    allowRoles("jobseeker"),
    applyForJob
);
// Recruiter: get all applicants for a specific job.
router.get(
    "/:id/applicants",
    authMiddleware,
    allowRoles("recruiter"),
    getJobApplicants
);
// Recruiter: update application status.
router.patch(
    "/applications/:id/status",
    authMiddleware,
    allowRoles("recruiter"),
    updateApplicationStatus
);
// Recruiter: close a job.
router.patch(
    "/:id/close",
    authMiddleware,
    allowRoles("recruiter"),
    closeJob
);
// Keep this generic route last.
router.get("/:id", getJobById);
module.exports = router;