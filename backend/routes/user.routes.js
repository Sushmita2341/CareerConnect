const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    getAllUsers,
    searchCandidates,
    getUserById,
    uploadResume,
    viewCandidateResume,
} = require("../controllers/user.controller");
const authMiddleware = require("../auth/auth.middleware");
const allowRoles = require("../auth/role.middleware");
const upload = require("../config/multer.config");
const path = require("path");
const fs = require("fs");
router.get("/test", (req, res) => {
    res.json({ message: "User route is working!" });
});
// Public authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);
// Logged-in user's profile
router.get("/profile", authMiddleware, getProfile);
router.put(
    "/profile/update",
    authMiddleware,
    upload.single("profilePicture"),
    updateProfile
);
// Authenticated people and candidate search
router.get("/all", authMiddleware, getAllUsers);
router.get("/search", authMiddleware, searchCandidates);
// Jobseekers can upload their own resume
router.post(
    "/resume",
    authMiddleware,
    allowRoles("jobseeker"),
    (req, res, next) => {
        upload.single("resume")(req, res, (error) => {
            if (error) {
                return res.status(400).json({
                    message: "Unable to upload file. Please select a valid PDF.",
                });
            }
            if (!req.file) { return res.status(400).json({ message: "Please select a PDF resume.", }); } if (path.extname(req.file.originalname).toLowerCase() !== ".pdf") { fs.unlink(req.file.path, () => { }); return res.status(400).json({ message: "Only PDF resumes are allowed.", }); } next();
        });
    }, uploadResume
);
// Only recruiters can view a candidate's resume
router.get(
    "/:id/resume",
    authMiddleware,
    allowRoles("recruiter"),
    viewCandidateResume
);
// Public profile route must come after the more specific resume route
router.get("/:id", authMiddleware, getUserById);
module.exports = router;