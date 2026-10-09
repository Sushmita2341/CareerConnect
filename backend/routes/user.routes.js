const express = require("express");
const { registerUser, loginUser, getProfile, updateProfile, getAllUsers, searchUsers, getUserById } = require("../controllers/user.controller");
const authMiddleware = require("../auth/auth.middleware");
const upload = require("../config/multer.config");
const router = express.Router();

router.get("/test", (req, res) => {
    res.json({
        message: "User route is working!"
    });
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);
router.put(
    "/profile/update",
    authMiddleware,
    upload.single("profilePicture"),
    updateProfile);
router.get("/all", authMiddleware, getAllUsers);
router.get("/search", authMiddleware, searchUsers);
router.get("/:id", authMiddleware, getUserById);


module.exports = router;