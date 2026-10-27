"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API = "http://localhost:8080";

interface User {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    bio?: string;
    skills?: string[];
}

interface ConnectionStatus {
    userId: string;
    status: string;
    direction?: string;
}

export default function People() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [statuses, setStatuses] = useState<ConnectionStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please log in to find people.");
            setLoading(false);
            return;
        }

        try {
            setError("");

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            const [usersResponse, statusResponse] = await Promise.all([
                fetch(`${API}/api/users/all`, { headers }),
                fetch(`${API}/api/connections/statuses`, { headers }),
            ]);

            const usersData = await usersResponse.json();
            const statusData = await statusResponse.json();

            if (!usersResponse.ok) {
                throw new Error(usersData.message || "Unable to load people.");
            }

            if (!statusResponse.ok) {
                throw new Error(
                    statusData.message || "Unable to load connection statuses."
                );
            }

            setUsers(Array.isArray(usersData.users) ? usersData.users : []);
            setStatuses(
                Array.isArray(statusData.statuses)
                    ? statusData.statuses.map((item: ConnectionStatus & {
                        user?: string | { _id: string };
                    }) => ({
                        ...item,
                        userId:
                            item.userId ||
                            (typeof item.user === "string"
                                ? item.user
                                : item.user?._id) ||
                            "",
                    }))
                    : []
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load people."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const sendRequest = async (userId: string) => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Please log in first.");
            return;
        }

        try {
            const response = await fetch(
                `${API}/api/connections/send/${encodeURIComponent(userId)}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Unable to send connection request.");
            } else {
                alert("Connection request sent!");
            }

            await fetchData();
        } catch {
            alert("Unable to send connection request.");
        }
    };

    const query = search.trim().toLowerCase();

    const filteredUsers = users.filter((user) => {
        const searchableText = [
            user.name || "",
            user.email || "",
            ...(Array.isArray(user.skills) ? user.skills : []),
        ]
            .join(" ")
            .toLowerCase();

        return searchableText.includes(query);
    });

    return (
        <main
            style={{
                maxWidth: "1000px",
                margin: "30px auto",
                padding: "0 20px",
                color: "#1f2937",
            }}
        >
            <h1>Find People</h1>

            <p>Discover people and grow your professional network.</p>

            <input
                type="search"
                aria-label="Search by name, email, or skill"
                placeholder="🔎 Search by name, email, or skill (Java, Python...)"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{
                    width: "100%",
                    maxWidth: "600px",
                    boxSizing: "border-box",
                    marginBottom: "20px",
                    padding: "13px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    fontSize: "15px",
                }}
            />

            {loading ? (
                <p>Loading people...</p>
            ) : error ? (
                <p style={{ color: "crimson" }}>{error}</p>
            ) : filteredUsers.length === 0 ? (
                <p>
                    {users.length === 0
                        ? "No other users are registered yet."
                        : `No people found for "${search}". Try another name or skill.`}
                </p>
            ) : (
                <>
                    <p>
                        {filteredUsers.length}{" "}
                        {filteredUsers.length === 1 ? "person" : "people"} found
                    </p>

                    {filteredUsers.map((user) => {
                        const connection = statuses.find(
                            (item) => item.userId === user._id
                        );

                        let statusLabel = "🤝 Connect";

                        if (connection?.status === "accepted") {
                            statusLabel = "✅ Connected";
                        } else if (
                            connection?.status === "pending" &&
                            connection.direction === "sent"
                        ) {
                            statusLabel = "⏳ Request Sent";
                        } else if (
                            connection?.status === "pending" &&
                            connection.direction === "received"
                        ) {
                            statusLabel = "📩 Accept in Requests";
                        } else if (connection?.status === "rejected") {
                            statusLabel = "Request Rejected";
                        }

                        const imageUrl =
                            user.profilePicture &&
                                user.profilePicture !== "default.jpg"
                                ? `${API}/uploads/${encodeURIComponent(user.profilePicture)}`
                                : "";

                        return (
                            <article
                                key={user._id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "20px",
                                    background: "#fff",
                                    padding: "20px",
                                    margin: "15px 0",
                                    borderRadius: "12px",
                                    border: "1px solid #ddd",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                }}
                            >
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={`${user.name}'s profile`}
                                        width={75}
                                        height={75}
                                        style={{
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "75px",
                                            height: "75px",
                                            flexShrink: 0,
                                            borderRadius: "50%",
                                            background: "#e8f2fb",
                                            color: "#0a66c2",
                                            display: "grid",
                                            placeItems: "center",
                                            fontSize: "28px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {user.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}

                                <div style={{ flex: 1, minWidth: "150px" }}>
                                    <h2>{user.name}</h2>
                                    <p>{user.email}</p>

                                    {user.skills && user.skills.length > 0 && (
                                        <p>
                                            <strong>Skills:</strong>{" "}
                                            {user.skills.join(", ")}
                                        </p>
                                    )}

                                    <Link href={`/people/${user._id}`}>
                                        View Profile
                                    </Link>
                                </div>

                                {!connection ? (
                                    <button
                                        type="button"
                                        onClick={() => sendRequest(user._id)}
                                    >
                                        🤝 Connect
                                    </button>
                                ) : (
                                    <div>
                                        <p style={{ fontWeight: "bold" }}>
                                            {statusLabel}
                                        </p>

                                        {connection.status === "pending" &&
                                            connection.direction === "received" && (
                                                <Link href="/requests">
                                                    View Request
                                                </Link>
                                            )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </>
            )}
        </main>
    );
}