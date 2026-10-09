const express = require("express");
const authMiddleware = require("../auth/auth.middleware");

const {
    sendConnectionRequest,
    getConnectionRequests,
    acceptConnectionRequest,
    rejectConnectionRequest,
    getMyConnections,
    getConnectionStatuses
} = require("../controllers/connection.controller");

const router = express.Router();


// Send connection request
router.post(
    "/send/:id",
    authMiddleware,
    sendConnectionRequest
);


// Get pending requests
router.get(
    "/requests",
    authMiddleware,
    getConnectionRequests
);


// Accept request
router.put(
    "/accept/:id",
    authMiddleware,
    acceptConnectionRequest
);


// Reject request
router.put(
    "/reject/:id",
    authMiddleware,
    rejectConnectionRequest
);
router.get(
    "/my",
    authMiddleware,
    getMyConnections
);
router.get(
    "/statuses",
    authMiddleware,
    getConnectionStatuses
);

module.exports = router;