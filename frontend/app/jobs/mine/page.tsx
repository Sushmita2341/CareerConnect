"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
interface Job {
    _id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    isActive: boolean;
}
export default function MyJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [closingId, setClosingId] = useState("");
    const [message, setMessage] = useState("");
    useEffect(() => {
        async function loadMyJobs() {
            try {
                const token = localStorage.getItem("token");
                if (!token) { window.location.href = "/login"; return; } const response = await fetch("http://localhost:8080/api/jobs/mine", { headers: { Authorization: `Bearer ${token}`, }, }); const data = await response.json(); if (!response.ok) { throw new Error(data.message || "Could not load your jobs."); } setJobs(Array.isArray(data.jobs) ? data.jobs : []);
            } catch (err) { setError(err instanceof Error ? err.message : "Could not load your jobs."); } finally { setLoading(false); }
        } loadMyJobs();
    }, []);
    async function closeJob(jobId: string) {
        const confirmed = window.confirm(
            "Are you sure you want to close this job? Applicants will no longer be able to apply."
        );
        if (!confirmed) return;
        try {
            setClosingId(jobId);
            setMessage("");
            const token = localStorage.getItem("token"); if (!token) { router.push("/login"); return; } const response = await fetch(`http://localhost:8080/api/jobs/${jobId}/close`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, }, }); const data = await response.json(); if (!response.ok) { throw new Error(data.message || "Could not close job."); } setJobs((previous) => previous.map((job) => job._id === jobId ? { ...job, isActive: false } : job)); setMessage("Job closed successfully.");
        } catch (err) {
            setMessage(
                err instanceof Error ? err.message : "Could not close job."
            );
        } finally {
            setClosingId("");
        }
    }
    return (
        <main className="jobs-page">
            <section className="jobs-hero">
                <p className="jobs-eyebrow">CAREERCONNECT RECRUITER</p>
                <h1>My Posted Jobs</h1>
                <p>View your job listings and manage their applicants.</p>
                <Link href="/jobs/create" className="jobs-primary-link"> + Post a Job </Link> </section> <section className="jobs-results"> <div className="jobs-results-heading"> <h2>Your listings</h2> <span>{jobs.length} jobs</span> </div> {loading && <p>Loading your jobs...</p>} {!loading && error && (<p className="jobs-error">{error}</p>)}
                {!loading && !error && jobs.length === 0 && (<div className="jobs-empty"> <h3>You haven't posted any jobs yet</h3> <p>Create a job listing to start receiving applications.</p> </div>)} {!loading && !error && jobs.length > 0 && (<div className="jobs-grid"> {jobs.map((job) => (<article className="job-card" key={job._id}> <span className="job-type">{job.jobType}</span> <h3>{job.title}</h3> <p className="job-company">{job.company}</p> <p className="job-location">{job.location}</p> <p> Status: {job.isActive ? "Active" : "Closed"} </p> <div className="job-card-actions"> <Link href={`/jobs/${job._id}`}> View Job </Link>
                    <Link href={`/jobs/manage/${job._id}`}> Manage Applicants </Link> {!job.isActive ? (
                        <p className="job-closed-label">This job is closed</p>) : (<button type="button" onClick={() => closeJob(job._id)} disabled={closingId === job._id} > {closingId === job._id ? "Closing..." : "Close Job"} </button>)} </div> </article>))}
                </div>)} </section> </main>
    );
}