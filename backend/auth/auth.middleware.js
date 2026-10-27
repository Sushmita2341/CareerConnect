const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) { return res.status(401).json({ message: "A valid authorization token is required.", }); } const token = authHeader.slice(7).trim(); if (!token) { return res.status(401).json({ message: "Authorization token is missing.", }); } if (!process.env.JWT_SECRET) { console.error("JWT_SECRET is not configured."); return res.status(500).json({ message: "Server authentication configuration error.", }); } const decoded = jwt.verify(token, process.env.JWT_SECRET); if (!decoded || typeof decoded !== "object" || typeof decoded.id !== "string" || !mongoose.isValidObjectId(decoded.id)) { return res.status(401).json({ message: "Invalid authentication token.", }); }
        // Only trust the verified user ID from the JWT. 
        req.user = { id: decoded.id }; return next();
    } catch (error) { if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError" || error.name === "NotBeforeError") { return res.status(401).json({ message: "Invalid or expired token. Please log in again.", }); } console.error("AUTHENTICATION ERROR:", error); return res.status(500).json({ message: "Authentication failed.", }); }
};
module.exports = authMiddleware;