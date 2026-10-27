const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");


require("dotenv").config();

console.log("JWT_SECRET configured:", Boolean(process.env.JWT_SECRET));

const app = express();

app.use(cors());
app.use(express.json());
const path = require("path");
const fs = require("fs");

const uploadsPath = path.resolve(process.cwd(), "uploads");

app.use("/uploads", (req, res, next) => {
    const filename = path.basename(req.path);

    // Only allow image files through the public uploads URL
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(filename)) {
        return res.status(403).json({
            message: "Access denied.",
        });
    }

    const imagePath = path.resolve(uploadsPath, filename);

    if (!imagePath.startsWith(uploadsPath + path.sep)) {
        return res.status(403).json({
            message: "Access denied.",
        });
    }

    if (!fs.existsSync(imagePath)) {
        return res.status(404).json({
            message: "Image not found.",
        });
    }

    return res.sendFile(imagePath);
});

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);
const postRoutes = require("./routes/post.routes");
app.use("/api/posts", postRoutes);
const connectionRoutes = require("./routes/connection.routes");
app.use("/api/connections", connectionRoutes);
const messageRoutes = require("./routes/message.routes");
app.use("/api/messages", messageRoutes);
const jobRoutes = require("./routes/job.routes");
app.use("/api/jobs", jobRoutes);
const notificationRoutes = require("./routes/notification.routes");
app.use("/api/notifications", notificationRoutes);
const interviewRoutes = require("./routes/interview.routes");
app.use("/api/interviews", interviewRoutes);
const savedJobRoutes = require("./routes/savedJob.routes");
app.use("/api/saved-jobs", savedJobRoutes);
const resumeRoutes = require("./routes/resume.routes");
app.use("/api/resume", resumeRoutes);
const mockInterviewRoutes = require("./routes/mockInterview.routes");
app.use("/api/mock-interview", mockInterviewRoutes);

app.get("/", (req, res) => {
    res.send("CareerConnect Backend is running!");
});

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error);
    });

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});
