"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8080/api";

const INITIAL_FORM = {
    title: "",
    company: "",
    location: "",
    jobType: "Full-time",
    description: "",
    salary: "",
    skills: "",
};

export default function CreateJobPage() {
    const router = useRouter();

    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function handleChange(
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        const token = localStorage.getItem("token");
        const userString = localStorage.getItem("user");

        if (!token) {
            router.push("/login");
            return;
        }

        let user: { role?: string };

        try {
            user = JSON.parse(userString || "{}");
        } catch {
            setError("Your login information is invalid. Please log in again.");
            return;
        }

        if (user.role !== "recruiter") {
            setError("Only recruiters can post jobs. Please log in with a recruiter account.");
            return;
        }

        if (
            !form.title.trim() ||
            !form.company.trim() ||
            !form.location.trim() ||
            !form.description.trim()
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API}/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: form.title.trim(),
                    company: form.company.trim(),
                    location: form.location.trim(),
                    jobType: form.jobType,
                    description: form.description.trim(),
                    salary: form.salary.trim() || "Not disclosed",
                    skills: form.skills
                        .split(",")
                        .map((skill) => skill.trim())
                        .filter(Boolean),
                }),
            });

            const text = await response.text();
            let data: { message?: string } = {};

            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error(
                    "The server returned an invalid response. Check that your backend is running."
                );
            }

            if (!response.ok) {
                throw new Error(data.message || "Unable to post the job.");
            }

            setSuccess("Job posted successfully!");

            setTimeout(() => {
                router.push("/jobs/mine");
            }, 1000);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="jobs-page">
            <section className="jobs-hero">
                <p className="jobs-eyebrow">CAREERCONNECT RECRUITER</p>
                <h1>Post a Job</h1>
                <p>Share an opportunity with the CareerConnect community.</p>
            </section>

            <section className="jobs-results">
                <form onSubmit={handleSubmit} className="create-job-form">
                    <label htmlFor="title">Job title *</label>
                    <input
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="e.g. Frontend Developer"
                        required
                    />

                    <label htmlFor="company">Company *</label>
                    <input
                        id="company"
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        placeholder="Company name"
                        required
                    />

                    <label htmlFor="location">Location *</label>
                    <input
                        id="location"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        placeholder="e.g. Indore or Remote"
                        required
                    />

                    <label htmlFor="jobType">Job type *</label>
                    <select
                        id="jobType"
                        name="jobType"
                        value={form.jobType}
                        onChange={handleChange}
                    >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                    </select>

                    <label htmlFor="description">Job description *</label>
                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Describe the role and responsibilities"
                        rows={5}
                        required
                    />

                    <label htmlFor="salary">Salary</label>
                    <input
                        id="salary"
                        name="salary"
                        value={form.salary}
                        onChange={handleChange}
                        placeholder="e.g. ₹10,000 per month"
                    />

                    <label htmlFor="skills">Skills (comma-separated)</label>
                    <input
                        id="skills"
                        name="skills"
                        value={form.skills}
                        onChange={handleChange}
                        placeholder="React, JavaScript, HTML, CSS"
                    />

                    {error && (
                        <p className="jobs-error" role="alert">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="jobs-success" role="status">
                            {success}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? "Posting..." : "Post Job"}
                    </button>
                </form>
            </section>
        </main>
    );
}