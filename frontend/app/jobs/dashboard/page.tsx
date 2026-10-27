"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Job {
    _id: string;
    title: string;
    company: string;
    isActive: boolean;
}

interface Applicant {
    _id: string;
    name?: string;
    email?: string;
}

interface Application {
    _id: string;
    status: string;
    createdAt?: string;
    applicant?: Applicant | null;
    job: {
        _id: string;
        title: string;
        company: string;
    };
}

export default function JobsDashboardPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                const token = localStorage.getItem("token");
                const userText = localStorage.getItem("user");

                if (!token) {
                    window.location.href = "/login";
                    return;
                }

                if (userText) {
                    const user = JSON.parse(userText);

                    if (user.role !== "recruiter") {
                        setError("This dashboard is only available to recruiters.");
                        return;
                    }
                }

                const headers = {
                    Authorization: `Bearer ${token}`,
                };

                // 1. Load jobs posted by this recruiter
                const jobsResponse = await fetch(
                    "http://localhost:8080/api/jobs/mine",
                    { headers }
                );

                const jobsData = await jobsResponse.json();

                if (!jobsResponse.ok) {
                    throw new Error(
                        jobsData.message || "Unable to load your jobs."
                    );
                }

                const ownJobs: Job[] = Array.isArray(jobsData.jobs)
                    ? jobsData.jobs
                    : [];

                setJobs(ownJobs);

                // 2. Load applicants for each of this recruiter's jobs
                const validJobs = ownJobs.filter(
                    (job) =>
                        typeof job._id === "string" &&
                        /^[a-f\d]{24}$/i.test(job._id)
                );

                const applicationGroups = await Promise.all(
                    validJobs.map(async (job) => {
                        const response = await fetch(
                            `http://localhost:8080/api/jobs/${job._id}/applicants`,
                            { headers }
                        );

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(
                                data.message ||
                                `Unable to load applicants for ${job.title}.`
                            );
                        }

                        const jobApplications: Application[] = Array.isArray(
                            data.applications
                        )
                            ? data.applications.map((application: Application) => ({
                                ...application,
                                job: {
                                    _id: job._id,
                                    title: job.title,
                                    company: job.company,
                                },
                            }))
                            : [];

                        return jobApplications;
                    })
                );

                setApplications(applicationGroups.flat());
                setError("");
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong loading the dashboard."
                );
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);
    const activeJobs = jobs.filter((job) => job.isActive).length;
    const closedJobs = jobs.length - activeJobs;
    const shortlisted = applications.filter(
        (application) => application.status === "Shortlisted"
    ).length;
    const underReview = applications.filter(
        (application) => application.status === "Under Review"
    ).length;
    const hired = applications.filter(
        (application) => application.status === "Hired"
    ).length;

    const recentJobs = jobs.slice(0, 5);
    const recentApplications = applications.slice(0, 5);

    if (loading) {
        return <main className="jobs-dashboard"><p>Loading dashboard...</p></main>;
    }

    return (
        <main className="jobs-dashboard">
            <div className="jobs-dashboard-header">
                <div>
                    <h1>Recruiter Dashboard</h1>
                    <p>Manage your job listings and track candidates.</p>
                </div>

                <Link href="/jobs/create" className="job-primary-btn">
                    + Post a Job
                </Link>
            </div>

            {error && <p className="job-error">{error}</p>}

            {!error && (
                <>
                    <section className="dashboard-stats">
                        <div className="dashboard-stat">
                            <span>Total Jobs</span>
                            <strong>{jobs.length}</strong>
                        </div>

                        <div className="dashboard-stat">
                            <span>Active Jobs</span>
                            <strong>{activeJobs}</strong>
                        </div>

                        <div className="dashboard-stat">
                            <span>Total Applications</span>
                            <strong>{applications.length}</strong>
                        </div>

                        <div className="dashboard-stat">
                            <span>Shortlisted</span>
                            <strong>{shortlisted}</strong>
                        </div>

                        <div className="dashboard-stat">
                            <span>Hired</span>
                            <strong>{hired}</strong>
                        </div>

                        <div className="dashboard-stat">
                            <span>Under Review</span>
                            <strong>{underReview}</strong>
                        </div>
                    </section>

                    <section className="dashboard-panel">
                        <div className="dashboard-panel-header">
                            <h2>Recently Posted Jobs</h2>
                            <Link href="/jobs/mine">Manage all jobs →</Link>
                        </div>

                        {recentJobs.length === 0 ? (
                            <p>You have not posted any jobs yet.</p>
                        ) : (
                            <div className="dashboard-list">
                                {recentJobs.map((job) => (
                                    <div className="dashboard-list-item" key={job._id}>
                                        <div>
                                            <h3>{job.title}</h3>
                                            <p>{job.company}</p>
                                            <span className={job.isActive ? "status-active" : "status-closed"}>
                                                {job.isActive ? "Active" : "Closed"}
                                            </span>
                                        </div>

                                        <Link href={`/jobs/manage/${job._id}`}>
                                            View Applicants →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="dashboard-panel">
                        <div className="dashboard-panel-header">
                            <h2>Recent Applications</h2>
                            <Link href="/jobs/mine">View jobs →</Link>
                        </div>

                        {recentApplications.length === 0 ? (
                            <p>No applications received yet.</p>
                        ) : (
                            <div className="dashboard-list">
                                {recentApplications.map((application) => (
                                    <div className="dashboard-list-item" key={application._id}>
                                        <div>
                                            <h3>
                                                {application.applicant?.name || "Candidate"}
                                            </h3>
                                            <p>
                                                {application.job.title} · {application.job.company}
                                            </p>
                                            <p>{application.applicant?.email || ""}</p>
                                            <span className="application-status">
                                                {application.status}
                                            </span>
                                        </div>

                                        <Link href={`/jobs/manage/${application.job._id}`}>
                                            Review →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="dashboard-panel">
                        <h2>Job Summary</h2>
                        <p>Active listings: {activeJobs}</p>
                        <p>Closed listings: {closedJobs}</p>
                        <p>Total candidates: {applications.length}</p>
                    </section>
                </>
            )}
        </main>
    );
}

