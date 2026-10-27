"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
        _id?: string;
        name?: string;
        email?: string;
    } | null;
    createdAt?: string;
}
export default function JobDetailsPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [job, setJob] = useState<Job | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [applying, setApplying] = useState(false); useEffect(() => { if (!id) return; async function loadJob() { try { setLoading(true); setError(""); const response = await fetch(`http://localhost:8080/api/jobs/${id}`); const text = await response.text(); let data: { job?: Job; message?: string }; try { data = text ? JSON.parse(text) : {}; } catch { console.error("Job details API returned non-JSON:", text); throw new Error("Invalid response from the server."); } if (!response.ok) { throw new Error(data.message || "Unable to load job details."); } const loadedJob = data.job || (data as unknown as Job); if (!loadedJob?._id) { throw new Error("Job details were not found in the response."); } setJob(loadedJob); } catch (err) { setError(err instanceof Error ? err.message : "Unable to load job details."); } finally { setLoading(false); } } loadJob(); }, [id]); async function handleApply() { const token = localStorage.getItem("token"); if (!token) { window.location.href = "/login"; return; } try { setApplying(true); setError(""); setMessage(""); const response = await fetch(`http://localhost:8080/api/jobs/${id}/apply`, { method: "POST", headers: { Authorization: `Bearer ${token}`, }, }); const text = await response.text(); let data: { message?: string }; try { data = text ? JSON.parse(text) : {}; } catch { console.error("Apply API returned non-JSON:", text); throw new Error("Invalid response from the application server. Check the backend terminal."); } if (!response.ok) { throw new Error(data.message || "Unable to apply for this job."); } setMessage(data.message || "Application submitted successfully!"); } catch (err) { setError(err instanceof Error ? err.message : "Unable to apply for this job."); } finally { setApplying(false); } } if (loading) { return (<main className="jobs-page"> <section className="jobs-results"> <p className="jobs-empty">Loading job details...</p> </section> </main>); } if (error && !job) { return (<main className="jobs-page"> <section className="jobs-results"> <p className="jobs-error">{error}</p> <Link href="/jobs" className="jobs-primary-link"> Back to Jobs </Link> </section> </main>); } if (!job) { return (<main className="jobs-page"> <section className="jobs-results"> <h2>Job not found</h2> <Link href="/jobs" className="jobs-primary-link"> Back to Jobs </Link> </section> </main>); } return (<main className="jobs-page"> <section className="jobs-hero"> <p className="jobs-eyebrow">CAREERCONNECT OPPORTUNITY</p> <h1>{job.title}</h1> <p>{job.company}</p> <p> {job.location} · {job.jobType || "Full-time"} </p> <p>Salary: {job.salary || "Not disclosed"}</p> <button type="button" className="job-apply-button" onClick={handleApply} disabled={applying} > {applying ? "Applying..." : "Apply for this Job"} </button> </section> <section className="jobs-results"> {message && <p className="jobs-success">{message}</p>} {error && <p className="jobs-error">{error}</p>} <article className="job-card"> <h2>Job Description</h2> <p className="job-description">{job.description}</p> <h2>Required Skills</h2> {job.skills && job.skills.length > 0 ? (<div className="job-skills"> {job.skills.map((skill, index) => (<span key={`${skill}-${index}`}> {skill} </span>))} </div>) : (<p>Skills not specified.</p>)} <h2>About the Employer</h2> <p>{job.company}</p> {job.postedBy?.name && (<p>Posted by {job.postedBy.name}</p>)} <Link href="/jobs" className="jobs-secondary-link"> Back to All Jobs </Link> </article> </section> </main>);
}