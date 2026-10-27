"use client";

import { useEffect, useState } from "react";

type Candidate = {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    resume?: string;
    bio?: string;
    skills?: string[];
    education?: string;
    experience?: string;
};

export default function CandidatesPage() {
    const [query, setQuery] = useState("");
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadCandidates();
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const loadCandidates = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Please log in first.");
                setCandidates([]);
                return;
            }

            const response = await fetch(
                `http://localhost:8080/api/users/search?q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load candidates.");
            }

            setCandidates(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to server."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="candidates-page">
            <h1>Find Candidates</h1>
            <p>Discover job seekers by name, skills, or education.</p>

            <input
                type="search"
                placeholder="Search Java, Python, React, or a name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            {loading && <p>Loading candidates...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && candidates.length === 0 && (
                <p>No candidates found. Try another search.</p>
            )}

            <section className="candidate-list">
                {candidates.map((candidate) => (
                    <article
                        key={candidate._id}
                        className="candidate-card"
                    >
                        <h2>{candidate.name}</h2>

                        {candidate.bio && <p>{candidate.bio}</p>}

                        {candidate.education && (
                            <p>
                                <strong>Education:</strong>{" "}
                                {candidate.education}
                            </p>
                        )}

                        {candidate.experience && (
                            <p>
                                <strong>Experience:</strong>{" "}
                                {candidate.experience}
                            </p>
                        )}

                        <p>
                            <strong>Skills:</strong>{" "}
                            {candidate.skills?.length
                                ? candidate.skills.join(", ")
                                : "Not added"}
                        </p>

                        <a href={`/people/${candidate._id}`}>
                            View Profile
                        </a>
                        {candidate.resume && (
                            <button
                                type="button"
                                onClick={async () => {
                                    const token = localStorage.getItem("token");

                                    if (!token) {
                                        alert("Please log in first.");
                                        return;
                                    }

                                    try {
                                        const response = await fetch(
                                            `http://localhost:8080/api/users/${candidate._id}/resume`,
                                            {
                                                headers: {
                                                    Authorization: `Bearer ${token}`,
                                                },
                                            }
                                        );

                                        if (!response.ok) {
                                            const data = await response.json();
                                            throw new Error(
                                                data.message || "Unable to open resume."
                                            );
                                        }

                                        const blob = await response.blob();
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, "_blank");

                                        setTimeout(() => URL.revokeObjectURL(url), 60000);
                                    } catch (error) {
                                        alert(
                                            error instanceof Error
                                                ? error.message
                                                : "Unable to open resume."
                                        );
                                    }
                                }}
                            >
                                View Resume
                            </button>
                        )}
                    </article>
                ))}
            </section>
        </main>
    );
}