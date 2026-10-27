"use client";

import { useCallback, useEffect, useState } from "react";

const API = "http://localhost:8080/api";

type Person = {
    _id?: string;
    name?: string;
    email?: string;
    profilePicture?: string;
};

type Interview = {
    _id: string;
    recruiter: Person | string;
    candidate: Person | string;
    scheduledAt: string;
    message?: string;
    status: "Pending" | "Accepted" | "Declined" | "Cancelled";
};

function getPerson(value: Person | string): Person {
    if (typeof value === "string") {
        return { name: "User", _id: value };
    }
    return value || { name: "User" };
}

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const isRecruiter = role === "recruiter";

    const loadInterviews = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please log in to view your interviews.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API}/interviews`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Could not load interviews.");
            }

            setInterviews(
                Array.isArray(data) ? data : data.interviews || []
            );
            setError("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not connect to the server."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const userString = localStorage.getItem("user"); const token = localStorage.getItem("token"); if (userString) { try { const user = JSON.parse(userString); setRole(user.role || ""); } catch { setError("User information is invalid. Please log in again."); } } async function markInterviewNotificationsRead() {
            if (!token) return; try {
                const response = await fetch(`${API}/notifications/interviews/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, }, });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(
                        "Interview notification error:",
                        response.status,
                        errorText
                    );
                }
            } catch (error) { console.error("Failed to mark interview notifications as read:", error); }
        } void markInterviewNotificationsRead(); void loadInterviews();
    }, [loadInterviews]);

    async function updateInterview(
        id: string,
        action: "respond" | "cancel",
        status?: "Accepted" | "Declined"
    ) {
        const token = localStorage.getItem("token");

        if (!token) {
            setError("Please log in again.");
            return;
        }

        const confirmation =
            action === "cancel"
                ? window.confirm("Are you sure you want to cancel this invitation?")
                : true;

        if (!confirmation) return;

        setBusyId(id);
        setError("");
        setNotice("");

        try {
            const response = await fetch(
                `${API}/interviews/${id}/${action}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    ...(status ? { body: JSON.stringify({ status }) } : {}),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || `Request failed (${response.status}).`
                );
            }

            setNotice(
                data.message ||
                (action === "cancel"
                    ? "Invitation cancelled successfully."
                    : `Interview ${status?.toLowerCase()} successfully.`)
            );

            await loadInterviews();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not update the interview."
            );
        } finally {
            setBusyId("");
        }
    }

    return (
        <main className="interviews-page">
            <header className="interviews-header">
                <div>
                    <h1>My Interviews</h1>
                    <p>
                        {isRecruiter
                            ? "Manage the interview invitations you have sent."
                            : "View and respond to your interview invitations."}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadInterviews()}
                    disabled={loading}
                    className="interview-refresh"
                >
                    Refresh
                </button>
            </header>

            {error && (
                <div className="interview-alert interview-error" role="alert">
                    {error}
                </div>
            )}

            {notice && (
                <div className="interview-alert interview-success" role="status">
                    {notice}
                </div>
            )}

            {loading ? (
                <p className="interview-empty">Loading interviews...</p>
            ) : interviews.length === 0 ? (
                <section className="interview-empty">
                    <h2>No interviews yet</h2>
                    <p>
                        {isRecruiter
                            ? "Interview invitations you send will appear here."
                            : "Interview invitations you receive will appear here."}
                    </p>
                </section>
            ) : (
                <section className="interview-list">
                    {interviews.map((interview) => {
                        const recruiter = getPerson(interview.recruiter);
                        const candidate = getPerson(interview.candidate);
                        const pending = interview.status === "Pending";

                        return (
                            <article
                                className="interview-card"
                                key={interview._id}
                            >
                                <div className="interview-card-top">
                                    <div>
                                        <h2>
                                            {isRecruiter
                                                ? candidate.name || "Candidate"
                                                : recruiter.name || "Recruiter"}
                                        </h2>

                                        <p className="interview-subtitle">
                                            {isRecruiter
                                                ? candidate.email || ""
                                                : recruiter.email || ""}
                                        </p>
                                    </div>

                                    <span
                                        className={`interview-status status-${interview.status.toLowerCase()}`}
                                    >
                                        {interview.status}
                                    </span>
                                </div>

                                <div className="interview-details">
                                    <p>
                                        <strong>Interview date:</strong>{" "}
                                        {new Date(interview.scheduledAt).toLocaleString(
                                            undefined,
                                            {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            }
                                        )}
                                    </p>

                                    {interview.message && (
                                        <p>
                                            <strong>Message:</strong> {interview.message}
                                        </p>
                                    )}
                                </div>

                                {pending && (
                                    <div className="interview-actions">
                                        {isRecruiter ? (
                                            <button
                                                type="button"
                                                className="interview-button cancel-button"
                                                onClick={() =>
                                                    void updateInterview(
                                                        interview._id,
                                                        "cancel"
                                                    )
                                                }
                                                disabled={busyId === interview._id}
                                            >
                                                {busyId === interview._id
                                                    ? "Cancelling..."
                                                    : "Cancel Invitation"}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    className="interview-button accept-button"
                                                    onClick={() =>
                                                        void updateInterview(
                                                            interview._id,
                                                            "respond",
                                                            "Accepted"
                                                        )
                                                    }
                                                    disabled={busyId === interview._id}
                                                >
                                                    {busyId === interview._id
                                                        ? "Please wait..."
                                                        : "Accept"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="interview-button decline-button"
                                                    onClick={() =>
                                                        void updateInterview(
                                                            interview._id,
                                                            "respond",
                                                            "Declined"
                                                        )
                                                    }
                                                    disabled={busyId === interview._id}
                                                >
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}