const Post = require("../models/post.model");
const createPost = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content?.trim() && !req.file) {
            return res.status(400).json({
                message: "Write something or select an image"
            });
        }

        const post = new Post({
            user: req.user.id,
            content: content?.trim() || "",
            image: req.file ? req.file.filename : ""
        });

        await post.save();

        res.status(201).json({
            message: "Post created successfully",
            post
        });

    } catch (error) {
        console.log("CREATE POST ERROR:", error);

        res.status(500).json({
            message: "Unable to create post"
        });
    }
};

const getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("user", "name email profilePicture")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Posts fetched successfully",
            posts: posts
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
const likePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (post.likes.includes(req.user.id)) {
            return res.status(400).json({
                message: "Post already liked"
            });
        }

        post.likes.push(req.user.id);

        await post.save();

        res.status(200).json({
            message: "Post liked successfully",
            likes: post.likes
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const text = req.body.text;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Comment text is required"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        post.comments.push({
            user: req.user.id,
            text: text.trim()
        });

        await post.save();

        res.status(201).json({
            message: "Comment added successfully",
            comment: post.comments[post.comments.length - 1]
        });

    } catch (error) {
        console.log("COMMENT ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
};
const getComments = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id)
            .populate("comments.user", "name profilePicture");

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        res.status(200).json({
            message: "Comments fetched successfully",
            comments: post.comments
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Only the post owner can delete it
        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only delete your own post"
            });
        }

        await Post.findByIdAndDelete(id);

        res.status(200).json({
            message: "Post deleted successfully"
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                message: "Post content is required"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        // Only the post owner can update it
        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only update your own post"
            });
        }

        post.content = content;

        await post.save();

        res.status(200).json({
            message: "Post updated successfully",
            post: post
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
module.exports = {
    createPost,
    getPosts,
    likePost,
    addComment,
    getComments,
    deletePost,
    updatePost
};