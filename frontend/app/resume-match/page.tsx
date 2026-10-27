"use client";
import { useState } from "react";
import Link from "next/link";
interface JobMatch {
    jobId: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    matchPercentage: number;
    matchedSkills: string[];
    missingSkills: string[];
}
interface AnalysisResult {
    message: string;
    detectedSkills: string[];
    totalJobsAnalyzed: number;
    matches: JobMatch[];
}
export default function ResumeMatchPage() {
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    async function analyzeResume() { setLoading(true); setError(""); setResult(null); try { const token = localStorage.getItem("token"); if (!token) { window.location.href = "/login"; return; } const response = await fetch("http://localhost:8080/api/resume/analyze", { method: "GET", headers: { Authorization: `Bearer ${token}`, }, }); const data = await response.json(); if (!response.ok) { throw new Error(data.message || "Unable to analyze your resume."); } setResult(data); } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Please try again."); } finally { setLoading(false); } } return (<main className="jobs-page"> <section className="jobs-hero"> <p className="jobs-eyebrow">CAREERCONNECT</p> <h1>Resume Match</h1> <p> Discover jobs that match your skills and identify skills you may want to improve. </p> <button type="button" onClick={analyzeResume} disabled={loading} > {loading ? "Analyzing resume..." : "Analyze My Resume"} </button> </section> <section className="jobs-results"> {error && (<p className="jobs-error" role="alert"> {error} </p>)} {result && (<> <h2>Resume Analysis Results</h2> <p> {result.message}{" "} {result.totalJobsAnalyzed} jobs analyzed. </p> <div className="job-card"> <h3>Skills detected in your resume</h3> {result.detectedSkills.length > 0 ? (<div className="resume-skills"> {result.detectedSkills.map((skill) => (<span key={skill} className="resume-skill"> {skill} </span>))} </div>) : (<p> No recognized skills found. Try uploading a text-based PDF with a clear Skills section. </p>)} </div> <h2>Recommended Jobs</h2> {result.matches.length === 0 ? (<div className="jobs-empty"> No active jobs are available for matching yet. </div>) : (<div className="jobs-grid"> {result.matches.map((job) => (<article className="job-card" key={job.jobId}> <div className="resume-match-heading"> <div> <h3>{job.title}</h3> <p className="job-company"> {job.company} </p> </div> <span className="resume-match-score"> {job.matchPercentage}% match </span> </div> <p>{job.location} · {job.jobType}</p> <h4>Matching skills</h4> {job.matchedSkills.length > 0 ? (<div className="resume-skills"> {job.matchedSkills.map((skill) => (<span key={skill} className="resume-skill" > {skill} </span>))} </div>) : (<p>No matching skills detected.</p>)} <h4>Skills to develop</h4> {job.missingSkills.length > 0 ? (<div className="resume-skills"> {job.missingSkills.map((skill) => (<span key={skill} className="resume-missing-skill" > {skill} </span>))} </div>) : (<p> All recognized skills for this job were found in your resume. </p>)} <Link href={`/jobs/${job.jobId}`} className="jobs-secondary-link" > View Job </Link> </article>))} </div>)} </>)} </section> </main>);
}