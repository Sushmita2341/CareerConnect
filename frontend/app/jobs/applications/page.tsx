"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
interface Job {
    _id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
}
interface Application {
    _id: string;
    status: string;
    createdAt?: string;
    job: Job | null;
}
export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        async function loadApplications() {
            const token = localStorage.getItem("token");
            if (!token) { window.location.href = "/login"; return; } try { setLoading(true); setError(""); const response = await fetch("http://localhost:8080/api/jobs/applications/mine", { method: "GET", headers: { Authorization: `Bearer ${token}`, }, }); const text = await response.text(); let data: { applications?: Application[]; message?: string; }; try { data = text ? JSON.parse(text) : {}; } catch { throw new Error("Invalid server response. Check the backend server and route."); } if (!response.ok) { throw new Error(data.message || "Failed to load applications."); } setApplications(Array.isArray(data.applications) ? data.applications : []); } catch (err: unknown) { setError(err instanceof Error ? err.message : "Something went wrong."); } finally { setLoading(false); }
        } loadApplications();
    }, []);
    return (
        <main className="jobs-page"> <section className="jobs-hero"> <p className="jobs-eyebrow">CAREERCONNECT CAREERS</p> <h1>My Applications</h1>
            <p>Track the jobs you have applied for.</p>
            < Link href="/jobs" className="jobs-primary-link" > Browse Jobs </Link > </section > <section className="jobs-results"> <div className="jobs-results-heading"> <h2>Application History</h2> <span>{applications.length} applications</span> </div> {loading && (<p className="jobs-empty">Loading applications...</p>)} {!loading && error && (<p className="jobs-error">{error}</p>)} {!loading && !error && applications.length === 0 && (<div className="jobs-empty"> <h3>No applications yet</h3> <p>Browse jobs and apply to see your applications here.</p> <Link href="/jobs" className="jobs-primary-link"> Find Jobs </Link> </div>)} {!loading && !error && applications.length > 0 && (<div className="jobs-grid"> {applications.map((application) => (<article className="job-card" key={application._id}> {application.job ? (<> <h3>{application.job.title}</h3> <p className="job-company"> {application.job.company} </p> <div className="job-meta"> <span>Location: {application.job.location}</span> <span> Salary: {application.job.salary || "Not disclosed"} </span> </div> <p> Application status: <strong>{application.status}</strong> </p> {application.createdAt && (<p className="job-posted-by"> Applied on{" "} {new Date(application.createdAt).toLocaleDateString()} </p>)} <Link href={`/jobs/${application.job._id}`} className="job-view-button" > View Job </Link> </>) : (<p>This job is no longer available.</p>)} </article>))} </div>)} </section> </main >
    );
}