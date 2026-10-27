"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Applicant {
    _id: string;
    status: string;
    createdAt?: string;
    applicant?: {
        _id: string;
        name: string;
        email: string;
        profilePicture?: string;
    } | null;
}

const STATUSES = [
    "Applied",
    "Under Review",
    "Shortlisted",
    "Rejected",
    "Hired",
];

export default function ManageApplicantsPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [updatingId, setUpdatingId] = useState("");

    const loadApplicants = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                window.location.href = "/login";
                return;
            }

            const response = await fetch(
                `http://localhost:8080/api/jobs/${id}/applicants`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const text = await response.text();
            let data: { applications?: Applicant[]; message?: string };

            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error("Invalid response from the server.");
            }

            if (!response.ok) {
                throw new Error(data.message || "Unable to load applicants.");
            }

            setApplicants(
                Array.isArray(data.applications) ? data.applications : []
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load applicants."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            void loadApplicants();
        }
    }, [id, loadApplicants]);

    async function updateStatus(applicationId: string, status: string) {
        try {
            setUpdatingId(applicationId);
            setError("");
            setMessage("");

            const token = localStorage.getItem("token");

            if (!token) {
                window.location.href = "/login";
                return;
            }

            const response = await fetch(
                `http://localhost:8080/api/jobs/applications/${applicationId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status }),
                }
            );

            const text = await response.text();
            let data: { message?: string };

            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error("Invalid response from the server.");
            }

            if (!response.ok) {
                throw new Error(data.message || "Unable to update status.");
            }

            setApplicants((previous) =>
                previous.map((item) =>
                    item._id === applicationId ? { ...item, status } : item
                )
            );

            setMessage("Application status updated successfully.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to update status."
            );
        } finally {
            setUpdatingId("");
        }
    }

    return (
        <main className="jobs-page">
            <section className="jobs-hero">
                <p className="jobs-eyebrow">CAREERCONNECT RECRUITER</p>
                <h1>Manage Applicants</h1>
                <p>Review applications, explore candidate profiles, and update status.</p>

                <Link href="/jobs/mine" className="jobs-secondary-link">
                    Back to My Jobs
                </Link>
            </section>

            <section className="jobs-results">
                <div className="jobs-results-heading">
                    <h2>Applications received</h2>
                    <span>
                        {applicants.length}{" "}
                        {applicants.length === 1 ? "applicant" : "applicants"}
                    </span>
                </div>

                {loading && <p className="jobs-empty">Loading applicants...</p>}

                {!loading && error && (
                    <p className="jobs-error" role="alert">{error}</p>
                )}

                {message && (
                    <p className="jobs-success" role="status">{message}</p>
                )}

                {!loading && !error && applicants.length === 0 && (
                    <div className="jobs-empty">
                        <h3>No applications yet</h3>
                        <p>Applications for this job will appear here.</p>
                    </div>
                )}

                {!loading && applicants.length > 0 && (
                    <div className="jobs-grid">
                        {applicants.map((item) => (
                            <article className="job-card" key={item._id}>
                                <div className="job-card-top">
                                    <div className="job-company-icon">
                                        {item.applicant?.name?.charAt(0).toUpperCase() || "C"}
                                    </div>
                                    <span className="job-type">{item.status}</span>
                                </div>

                                <h3>{item.applicant?.name || "Unknown applicant"}</h3>

                                <p className="job-company">
                                    {item.applicant?.email || "Email unavailable"}
                                </p>

                                {item.createdAt && (
                                    <p className="job-posted-by">
                                        Applied on{" "}
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </p>
                                )}

                                {item.applicant?._id && (
                                    <div className="job-card-actions">
                                        <Link
                                            href={`/people/${item.applicant._id}`}
                                            className="job-view-button"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                )}

                                <label htmlFor={`status-${item._id}`}>
                                    Application status
                                </label>

                                <select
                                    id={`status-${item._id}`}
                                    value={item.status}
                                    disabled={updatingId === item._id}
                                    onChange={(event) =>
                                        void updateStatus(item._id, event.target.value)
                                    }
                                >
                                    {STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>

                                {updatingId === item._id && (
                                    <p>Updating status...</p>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}