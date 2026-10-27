const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// ================= REGISTER USER =================
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }
        //Public registration creates jobseeker accounts only.
        const selectedRole = "jobseeker";


        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: selectedRole,
        });

        return res.status(201).json({
            message: "Registration successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            message: "Registration failed. Please try again",
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
        }).select("+password");

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
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                message: "Server authentication configuration error.",
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
                role: user.role || "jobseeker",
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
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid user ID.",
            });
        }
        const user = await User.findById(req.params.id).select("name email profilePicture bio skills education experience role createdAt"); if (!user) { return res.status(404).json({ message: "User not found.", }); } return res.status(200).json({ user });
    } catch (error) { console.error("GET USER BY ID ERROR:", error); return res.status(500).json({ message: "Failed to fetch user.", }); }
};

const searchUsers = async (req, res) => {
    try {
        const { q = "" } = req.query;

        const searchTerm = q.trim();

        const filter = {
            role: "jobseeker",
        };

        if (searchTerm) {
            filter.$or = [
                { name: { $regex: searchTerm, $options: "i" } },
                { skills: { $regex: searchTerm, $options: "i" } },
                { education: { $regex: searchTerm, $options: "i" } },
            ];
        }

        const users = await User.find(filter)
            .select("name email profilePicture bio skills education experience")
            .limit(50)
            .sort({ createdAt: -1 });

        return res.status(200).json(users);
    } catch (error) {
        console.error("SEARCH USERS ERROR:", error);
        return res.status(500).json({
            message: "Failed to search candidates",
        });
    }
};
const searchCandidates = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id)
            .select("role active");

        if (
            !currentUser ||
            currentUser.active === false ||
            currentUser.role !== "recruiter"
        ) {
            return res.status(403).json({
                message: "Only active recruiters can search candidates.",
            });
        }

        if (!currentUser || currentUser.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can search candidates",
            });
        }

        const { q = "" } = req.query;
        const searchTerm = q.trim();

        const filter = {
            role: "jobseeker",
        };

        if (searchTerm) {
            filter.$or = [
                { name: { $regex: searchTerm, $options: "i" } },
                { skills: { $regex: searchTerm, $options: "i" } },
                { education: { $regex: searchTerm, $options: "i" } },
            ];
        }

        const candidates = await User.find(filter)
            .select("name email profilePicture resume bio skills education experience")
            .limit(50)
            .sort({ createdAt: -1 });

        return res.status(200).json(candidates);
    } catch (error) {
        console.error("SEARCH CANDIDATES ERROR:", error);
        return res.status(500).json({
            message: "Failed to search candidates",
        });
    }
};
const uploadResume = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.role !== "jobseeker") {
            return res.status(403).json({
                message: "Only jobseekers can upload resumes.",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Please select a PDF resume.",
            });
        }

        user.resume = req.file.filename;
        await user.save();

        return res.status(200).json({
            message: "Resume uploaded successfully!",
            resume: user.resume,
        });
    } catch (error) {
        console.error("RESUME UPLOAD ERROR:", error);
        return res.status(500).json({
            message: "Unable to upload resume.",
        });
    }
};
const viewCandidateResume = async (req, res) => {
    try {
        // Validate candidate ID before querying MongoDB
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid candidate ID.",
            });
        }
        // Confirm the requester is a recruiter
        const requester = await User.findById(req.user.id).select("role"); if (!requester || requester.role !== "recruiter") { return res.status(403).json({ message: "Only recruiters can view candidate resumes.", }); } // Only allow viewing jobseeker resumes 
        const candidate = await User.findById(req.params.id).select("role resume"); if (!candidate || candidate.role !== "jobseeker") { return res.status(404).json({ message: "Candidate not found.", }); } if (!candidate.resume) { return res.status(404).json({ message: "This candidate has not uploaded a resume.", }); } const path = require("path"); const fs = require("fs"); const uploadsDirectory = path.resolve(process.cwd(), "uploads"); const resumePath = path.resolve(uploadsDirectory, candidate.resume);
        // Ensure the requested file remains inside the uploads directory
        if (!resumePath.startsWith(uploadsDirectory + path.sep)) { return res.status(400).json({ message: "Invalid resume file path.", }); } if (!fs.existsSync(resumePath) || !fs.statSync(resumePath).isFile()) { return res.status(404).json({ message: "Resume file not found on the server.", }); } res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `inline; filename="${path.basename(resumePath)}"`); return res.sendFile(resumePath);
    } catch (error) { console.error("VIEW RESUME ERROR:", error); return res.status(500).json({ message: "Unable to retrieve resume.", }); }
};
// ================= EXPORT CONTROLLERS =================
module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    getAllUsers,
    getUserById,
    searchUsers,
    searchCandidates,
    uploadResume,
    viewCandidateResume,
};