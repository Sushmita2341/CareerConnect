const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ================= REGISTER USER =================
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "Registration successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({
            message: "Registration failed"
        });
    }
};

// ================= LOGIN USER =================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id.toString(),
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio || "",
                skills: user.skills || [],
                education: user.education || "",
                experience: user.experience || ""
            }
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({
            message: "Login failed"
        });
    }
};

// ================= GET MY PROFILE =================
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password -token");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user
        });
    } catch (error) {
        console.error("GET PROFILE ERROR:", error);
        return res.status(500).json({
            message: "Failed to fetch profile"
        });
    }
};

// ================= UPDATE MY PROFILE =================
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (typeof req.body.name === "string") {
            const newName = req.body.name.trim();

            if (!newName) {
                return res.status(400).json({
                    message: "Name cannot be empty"
                });
            }

            user.name = newName;
        }

        if (typeof req.body.bio === "string") {
            user.bio = req.body.bio.trim();
        }

        if (typeof req.body.skills === "string") {
            user.skills = req.body.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean);
        } else if (Array.isArray(req.body.skills)) {
            user.skills = req.body.skills
                .map((skill) => String(skill).trim())
                .filter(Boolean);
        }

        if (typeof req.body.education === "string") {
            user.education = req.body.education.trim();
        }

        if (typeof req.body.experience === "string") {
            user.experience = req.body.experience.trim();
        }

        // Preserve profile-picture upload functionality
        if (req.file) {
            user.profilePicture = req.file.filename;
        }

        // Persist all changes to MongoDB
        await user.save();

        // Read back the saved document
        const savedUser = await User.findById(user._id)
            .select("-password -token");

        return res.status(200).json({
            message: "Profile updated successfully!",
            user: savedUser
        });
    } catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);
        return res.status(500).json({
            message: "Failed to update profile",
            error: error.message
        });
    }
};

// ================= GET ALL USERS =================
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({
            _id: { $ne: req.user.id }
        }).select("-password -token");

        return res.status(200).json({
            users
        });
    } catch (error) {
        console.error("GET USERS ERROR:", error);
        return res.status(500).json({
            message: "Failed to fetch users"
        });
    }
};

// ================= GET USER BY ID =================
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password -token");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user
        });
    } catch (error) {
        console.error("GET USER BY ID ERROR:", error);
        return res.status(500).json({
            message: "Failed to fetch user"
        });
    }
};
const searchUsers = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();

        const filter = {
            _id: { $ne: req.user.id }
        };

        if (q) {
            const regex = new RegExp(
                q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i"
            );

            filter.$or = [
                { name: regex },
                { email: regex },
                { skills: regex }
            ];
        }

        const users = await User.find(filter)
            .select("-password -token")
            .limit(50)
            .lean();

        res.status(200).json({ users });
    } catch (error) {
        console.error("SEARCH USERS ERROR:", error);
        res.status(500).json({
            message: "Failed to search users"
        });
    }
};

// ================= EXPORT CONTROLLERS =================
module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    getAllUsers,
    getUserById,
    searchUsers
};