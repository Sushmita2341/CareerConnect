const Connection = require("../models/connection.model");

// Send connection request
const sendConnectionRequest = async (req, res) => {
    try {
        const requester = req.user.id;
        const recipient = req.params.id;

        // Cannot connect with yourself
        if (requester === recipient) {
            return res.status(400).json({
                message: "You cannot connect with yourself"
            });
        }

        // Check if connection already exists
        const existingConnection = await Connection.findOne({
            $or: [
                { requester, recipient },
                { requester: recipient, recipient: requester }
            ]
        });

        if (existingConnection) {
            return res.status(400).json({
                message: "Connection request already exists"
            });
        }

        const connection = new Connection({
            requester,
            recipient
        });

        await connection.save();

        res.status(201).json({
            message: "Connection request sent successfully",
            connection
        });

    } catch (error) {
        console.log("CONNECTION ERROR:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};


// Get pending connection requests
const getConnectionRequests = async (req, res) => {
    try {
        const requests = await Connection.find({
            recipient: req.user.id,
            status: "pending"
        })
            .populate("requester", "name email profilePicture");

        res.status(200).json({
            message: "Connection requests fetched successfully",
            requests
        });

    } catch (error) {
        console.log("REQUEST ERROR:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};


// Accept connection request
const acceptConnectionRequest = async (req, res) => {
    try {
        const connectionId = req.params.id;

        const connection = await Connection.findById(connectionId);

        if (!connection) {
            return res.status(404).json({
                message: "Connection request not found"
            });
        }

        // Only recipient can accept
        if (connection.recipient.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You cannot accept this request"
            });
        }

        // Request must be pending
        if (connection.status !== "pending") {
            return res.status(400).json({
                message: "Request is already processed"
            });
        }

        connection.status = "accepted";

        await connection.save();

        res.status(200).json({
            message: "Connection request accepted successfully",
            connection
        });

    } catch (error) {
        console.log("ACCEPT ERROR:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};


// Reject connection request
const rejectConnectionRequest = async (req, res) => {
    try {
        const connectionId = req.params.id;

        const connection = await Connection.findById(connectionId);

        if (!connection) {
            return res.status(404).json({
                message: "Connection request not found"
            });
        }

        // Only recipient can reject
        if (connection.recipient.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You cannot reject this request"
            });
        }

        // Request must be pending
        if (connection.status !== "pending") {
            return res.status(400).json({
                message: "Request is already processed"
            });
        }

        connection.status = "rejected";

        await connection.save();

        res.status(200).json({
            message: "Connection request rejected successfully",
            connection
        });

    } catch (error) {
        console.log("REJECT ERROR:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
// Get accepted connections
const getMyConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        const connections = await Connection.find({
            $or: [
                { requester: userId, status: "accepted" },
                { recipient: userId, status: "accepted" }
            ]
        })
            .populate("requester", "name email profilePicture")
            .populate("recipient", "name email profilePicture");

        res.status(200).json({
            message: "Connections fetched successfully",
            connections
        });

    } catch (error) {
        console.log("CONNECTIONS ERROR:", error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
};
const getConnectionStatuses = async (req, res) => {
    try {
        const userId = req.user.id;

        const connections = await Connection.find({
            $or: [
                { requester: userId },
                { recipient: userId }
            ]
        });

        const statuses = connections.map((connection) => ({
            userId:
                connection.requester.toString() === userId
                    ? connection.recipient.toString()
                    : connection.requester.toString(),

            status: connection.status,

            direction:
                connection.requester.toString() === userId
                    ? "sent"
                    : "received"
        }));

        res.status(200).json({
            message: "Connection statuses fetched successfully",
            statuses
        });
    } catch (error) {
        console.log("STATUS ERROR:", error);

        res.status(500).json({
            message: "Unable to fetch connection statuses"
        });
    }
};


module.exports = {
    sendConnectionRequest,
    getConnectionRequests,
    acceptConnectionRequest,
    rejectConnectionRequest,
    getMyConnections,
    getConnectionStatuses
};