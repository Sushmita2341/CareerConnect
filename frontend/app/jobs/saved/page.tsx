"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const API = "http://localhost:8080/api";

interface Job {
    _id: string;
    title: string;
    company: string;
    location: string;
    jobType?: string;
    description: string;
    salary?: string;
    skills?: string[];
}

interface SavedJob {
    _id: string;
    job: Job | null;
}

export default function SavedJobsPage() {
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [removingId, setRemovingId] = useState("");

    const loadSavedJobs = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API}/saved-jobs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load saved jobs.");
            }

            setSavedJobs(Array.isArray(data.savedJobs) ? data.savedJobs : []);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load saved jobs."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSavedJobs();
    }, [loadSavedJobs]);

    async function removeSavedJob(jobId: string) {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            setRemovingId(jobId);
            setError("");
            setMessage("");

            const response = await fetch(`${API}/saved-jobs/${jobId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to remove saved job.");
            }

            setSavedJobs((previous) =>
                previous.filter((item) => item.job?._id !== jobId)
            );

            setMessage("Job removed from saved jobs.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to remove saved job."
            );
        } finally {
            setRemovingId("");
        }
    }

    return (
        <main className="jobs-page">
            <section className="jobs-hero">
                <p className="jobs-eyebrow">CAREERCONNECT CAREERS</p>
                <h1>Saved Jobs</h1>
                <p>Keep track of opportunities you want to apply for.</p>
                <Link href="/jobs" className="jobs-secondary-link">
                    Back to Jobs
                </Link>
            </section>

            <section className="jobs-results">
                <div className="jobs-results-heading">
                    <h2>Your bookmarks</h2>
                    <span>{savedJobs.length} saved</span>
                </div>

                {message && <p className="jobs-success">{message}</p>}
                {error && <p className="jobs-error" role="alert">{error}</p>}

                {loading ? (
                    <p className="jobs-empty">Loading saved jobs...</p>
                ) : !error && savedJobs.length === 0 ? (
                    <div className="jobs-empty">
                        <h3>No saved jobs yet</h3>
                        <p>Browse jobs and select Save Job to bookmark an opportunity.</p>
                        <Link href="/jobs" className="jobs-primary-link">
                            Explore Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {savedJobs.filter((item) => item.job).map((item) => {
                            const job = item.job!;

                            return (
                                <article className="job-card" key={item._id}>
                                    <span className="job-type">{job.jobType || "Full-time"}</span>
                                    <h3>{job.title}</h3>
                                    <p className="job-company">{job.company}</p>

                                    <div className="job-meta">
                                        <span>📍 {job.location}</span>
                                        <span>💰 {job.salary || "Not disclosed"}</span>
                                    </div>

                                    <p className="job-description">
                                        {job.description.length > 150
                                            ? `${job.description.slice(0, 150)}...`
                                            : job.description}
                                    </p>

                                    {!!job.skills?.length && (
                                        <div className="job-skills">
                                            {job.skills.slice(0, 4).map((skill, index) => (
                                                <span key={`${skill}-${index}`}>{skill}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="job-card-actions">
                                        <Link
                                            href={`/jobs/${job._id}`}
                                            className="job-view-button"
                                        >
                                            View Details
                                        </Link>

                                        <Link
                                            href={`/jobs/${job._id}`}
                                            className="job-apply-button"
                                        >
                                            View & Apply
                                        </Link>

                                        <button
                                            type="button"
                                            className="jobs-secondary-link"
                                            disabled={removingId === job._id}
                                            onClick={() => void removeSavedJob(job._id)}
                                        >
                                            {removingId === job._id ? "Removing..." : "♥ Remove Saved"}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}