const User = require("../models/user.model");
const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    message: "Please log in first.",
                });
            }
            const user = await User.findById(req.user.id).select("role active"); if (!user || user.active === false) { return res.status(401).json({ message: "User account not found or inactive.", }); } if (!allowedRoles.includes(user.role)) { return res.status(403).json({ message: "You do not have permission to perform this action.", }); } req.currentUser = user; next();
        } catch (error) { console.error("ROLE CHECK ERROR:", error); return res.status(500).json({ message: "Unable to verify user permissions.", }); }
    };
};
module.exports = requireRole;