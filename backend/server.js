const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

console.log("JWT secert loaded:", process.env.JWT_SECRET);

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);
const postRoutes = require("./routes/post.routes");
app.use("/api/posts", postRoutes);
const connectionRoutes = require("./routes/connection.routes");
app.use("/api/connections", connectionRoutes);
const messageRoutes = require("./routes/message.routes");
app.use("/api/messages", messageRoutes);

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
