"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Job {
    _id: string;
    title: string;
    company: string;
    location: string;
    jobType?: string;
    description: string;
    salary?: string;
    skills?: string[];
    postedBy?: {
        _id: string;
        name: string;
    } | null;
    createdAt?: string;
}

const API = "http://localhost:8080/api";
const JOB_TYPES = ["All", "Full-time", "Part-time", "Internship", "Contract"];

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [search, setSearch] = useState("");
    const [jobType, setJobType] = useState("All");
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [applyingId, setApplyingId] = useState("");
    const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
    const [savingId, setSavingId] = useState("");

    const isRecruiter = role === "recruiter";
    const isJobseeker = role === "jobseeker";

    const loadJobs = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API}/jobs`, {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load jobs.");
            }

            setJobs(Array.isArray(data.jobs) ? data.jobs : []);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load jobs."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSavedJobs = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            setSavedJobIds([]);
            return;
        }

        try {
            const response = await fetch(`${API}/saved-jobs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            const ids = Array.isArray(data.savedJobs)
                ? data.savedJobs
                    .filter((item: { job?: Job | null }) => item.job?._id)
                    .map((item: { job: Job }) => item.job._id)
                : [];

            setSavedJobIds(ids);
        } catch (err) {
            console.error("Unable to load saved jobs:", err);
        }
    }, []);

    useEffect(() => {
        const userString = localStorage.getItem("user");

        if (userString) {
            try {
                const user = JSON.parse(userString);
                setRole(user.role || "");
            } catch {
                setRole("");
            }
        }

        void loadJobs();
        void loadSavedJobs();
    }, [loadJobs, loadSavedJobs]);

    async function applyForJob(jobId: string) {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            setApplyingId(jobId);
            setError("");
            setMessage("");
            console.log("job ID being saved:", jobId);
            const response = await fetch(`${API}/jobs/${jobId}/apply`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Application failed.");
            }

            setMessage(data.message || "Application submitted successfully.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to apply for this job."
            );
        } finally {
            setApplyingId("");
        }
    }

    async function toggleSavedJob(jobId: string) {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        const alreadySaved = savedJobIds.includes(jobId);

        try {
            setSavingId(jobId);
            setError("");
            setMessage("");

            const response = await fetch(
                `${API}/saved-jobs/${jobId}`,
                {
                    method: alreadySaved ? "DELETE" : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update saved jobs.");
            }

            if (alreadySaved) {
                setSavedJobIds((previous) =>
                    previous.filter((id) => id !== jobId)
                );
                setMessage("Job removed from your saved jobs.");
            } else {
                setSavedJobIds((previous) =>
                    previous.includes(jobId) ? previous : [...previous, jobId]
                );
                setMessage("Job saved successfully!");
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to update saved jobs."
            );
        } finally {
            setSavingId("");
        }
    }

    const filteredJobs = useMemo(() => {
        const term = search.trim().toLowerCase();

        return jobs.filter((job) => {
            const searchableText = [
                job.title,
                job.company,
                job.location,
                job.jobType || "",
                job.description,
                ...(job.skills || []),
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = !term || searchableText.includes(term);
            const matchesType = jobType === "All" || job.jobType === jobType;

            return matchesSearch && matchesType;
        });
    }, [jobs, search, jobType]);

    return (
        <main className="jobs-page">
            <section className="jobs-hero">
                <p className="jobs-eyebrow">CAREERCONNECT CAREERS</p>
                <h1>Find your next opportunity</h1>
                <p>Discover jobs and internships that match your skills.</p>

                <input
                    className="jobs-search"
                    type="search"
                    placeholder="Search jobs, companies, locations, or skills..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <label className="jobs-filter-label" htmlFor="job-type-filter">
                    Job type
                </label>

                <select
                    id="job-type-filter"
                    className="jobs-type-filter"
                    value={jobType}
                    onChange={(event) => setJobType(event.target.value)}
                >
                    {JOB_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>

                <div className="jobs-actions">
                    {isRecruiter && (
                        <>
                            <Link href="/jobs/create" className="jobs-primary-link">
                                + Post a Job
                            </Link>
                            <Link href="/jobs/mine" className="jobs-secondary-link">
                                Manage My Jobs
                            </Link>
                        </>
                    )}

                    {isJobseeker && (
                        <>
                            <Link href="/jobs/applications" className="jobs-secondary-link">
                                My Applications
                            </Link>
                            <Link href="/jobs/saved" className="jobs-secondary-link">
                                Saved Jobs ({savedJobIds.length})
                            </Link>
                        </>
                    )}
                </div>
            </section>

            <section className="jobs-results">
                <div className="jobs-results-heading">
                    <h2>Explore opportunities</h2>
                    <span>{filteredJobs.length} jobs</span>
                </div>

                {message && (
                    <p className="jobs-success" role="status">
                        {message}
                    </p>
                )}

                {error && (
                    <p className="jobs-error" role="alert">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p className="jobs-empty">Loading jobs...</p>
                ) : filteredJobs.length === 0 ? (
                    <div className="jobs-empty">
                        <h3>No jobs found</h3>
                        <p>
                            {search || jobType !== "All"
                                ? "Try changing your search or job type."
                                : "No active jobs have been posted yet."}
                        </p>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {filteredJobs.map((job) => {
                            const isSaved = savedJobIds.includes(job._id);

                            return (
                                <article className="job-card" key={job._id}>
                                    <div className="job-card-top">
                                        <div className="job-company-icon">
                                            {job.company?.charAt(0).toUpperCase() || "C"}
                                        </div>
                                        <span className="job-type">
                                            {job.jobType || "Full-time"}
                                        </span>
                                    </div>

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

                                    <p className="job-posted-by">
                                        Posted by {job.postedBy?.name || "CareerConnect member"}
                                    </p>

                                    <div className="job-card-actions">
                                        <Link
                                            href={`/jobs/${job._id}`}
                                            className="job-view-button"
                                        >
                                            View Details
                                        </Link>

                                        {isJobseeker && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="job-apply-button"
                                                    disabled={applyingId === job._id}
                                                    onClick={() => void applyForJob(job._id)}
                                                >
                                                    {applyingId === job._id
                                                        ? "Applying..."
                                                        : "Apply Now"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="jobs-secondary-link"
                                                    disabled={savingId === job._id}
                                                    onClick={() => void toggleSavedJob(job._id)}
                                                >
                                                    {savingId === job._id
                                                        ? "Updating..."
                                                        : isSaved
                                                            ? "♥ Remove Saved"
                                                            : "♡ Save Job"}
                                                </button>
                                            </>
                                        )}
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