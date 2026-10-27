"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const API = "http://localhost:8080";

interface Person {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    bio?: string;
    skills?: string[];
    education?: string;
    experience?: string;
}

export default function SearchPeoplePage() {
    const [query, setQuery] = useState("");
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(false);
    const requestNumber = useRef(0);

    useEffect(() => {
        const trimmedQuery = query.trim();
        const currentRequest = ++requestNumber.current;

        if (!trimmedQuery) {
            setPeople([]);
            setError("");
            setLoading(false);
            setSearched(false);
            return;
        }

        const timer = setTimeout(async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Please log in to search for people.");
                setLoading(false);
                setPeople([]);
                return;
            }

            setLoading(true);
            setError("");
            setSearched(true);

            try {
                const response = await fetch(
                    `${API}/api/users/search?q=${encodeURIComponent(trimmedQuery)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (currentRequest !== requestNumber.current) return;

                if (!response.ok) {
                    setError(data.message || "Search failed.");
                    setPeople([]);
                    return;
                }

                setPeople(Array.isArray(data.users) ? data.users : []);
            } catch (err) {
                if (currentRequest !== requestNumber.current) return;

                console.error("SEARCH PEOPLE ERROR:", err);
                setError("Unable to connect to the server.");
                setPeople([]);
            } finally {
                if (currentRequest === requestNumber.current) {
                    setLoading(false);
                }
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <main className="people-search-page">
            <header className="people-search-header">
                <h1>Find People</h1>
                <p>
                    Discover professionals by name or skills and explore
                    their profiles.
                </p>

                <label htmlFor="people-search-input">
                    Search by name or skill
                </label>

                <input
                    id="people-search-input"
                    className="people-search-input"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Try Aman, Java, Python, React..."
                    autoComplete="off"
                />

                <p className="people-search-hint">
                    Search updates as you type.
                </p>
            </header>

            <section className="people-search-results">
                {loading && <p>Searching people...</p>}

                {!loading && error && (
                    <p className="people-search-error" role="alert">
                        {error}
                    </p>
                )}

                {!loading && !error && !searched && (
                    <p className="people-search-empty">
                        Enter a name or skill to get started.
                    </p>
                )}

                {!loading && !error && searched && people.length === 0 && (
                    <p className="people-search-empty">
                        No matching people found. Try another name or skill.
                    </p>
                )}

                <div className="people-search-grid">
                    {people.map((person) => (
                        <article
                            className="people-search-card"
                            key={person._id}
                        >
                            {person.profilePicture ? (
                                <img
                                    className="people-search-avatar"
                                    src={`${API}/uploads/${encodeURIComponent(
                                        person.profilePicture
                                    )}`}
                                    alt={`${person.name}'s profile`}
                                />
                            ) : (
                                <div className="people-search-avatar people-search-placeholder">
                                    {person.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}

                            <h2>{person.name}</h2>
                            <p className="people-search-email">
                                {person.email}
                            </p>

                            <p className="people-search-bio">
                                {person.bio?.trim() || "No bio added yet."}
                            </p>

                            {person.skills && person.skills.length > 0 ? (
                                <div className="people-search-skills">
                                    {person.skills.slice(0, 5).map((skill, index) => (
                                        <span key={`${skill}-${index}`}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="people-search-hint">
                                    No skills listed
                                </p>
                            )}

                            <Link
                                className="people-search-profile-link"
                                href={`/people/${person._id}`}
                            >
                                View Profile
                            </Link>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}