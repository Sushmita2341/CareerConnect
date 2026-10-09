const upload = require("../config/multer.config");
const express = require("express");
const authMiddleware = require("../auth/auth.middleware");
const { createPost, getPosts, likePost, addComment, getComments, deletePost, updatePost } = require("../controllers/post.controller");

const router = express.Router();

router.post(
    "/create",
    authMiddleware,
    upload.single("image"),
    createPost
);
router.get("/all", authMiddleware, getPosts);
router.put("/:id/:like", authMiddleware, likePost);
router.post("/:id/comment", authMiddleware, addComment);
router.get("/:id/comments", authMiddleware, getComments);
router.delete("/:id", authMiddleware, deletePost);
router.put("/:id/", authMiddleware, updatePost);

module.exports = router;