"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = "http://localhost:8080";

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    role?: string;
    profilePicture?: string;
    resume?: string;
    bio?: string;
    skills?: string[];
    education?: string;
    experience?: string;
}

interface Comment {
    _id: string;
    user?: {
        _id?: string;
        name?: string;
        profilePicture?: string;
    } | null;
    text: string;
    createdAt?: string;
}

interface Post {
    _id: string;
    user?: {
        _id?: string;
        name?: string;
        profilePicture?: string;
    } | null;
    content: string;
    image?: string;
    likes: string[];
    comments: Comment[];
    createdAt?: string;
}

export default function PublicProfilePage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState("");

    const [myRole, setMyRole] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [message, setMessage] = useState(
        "We would like to invite you for an interview."
    );
    const [sending, setSending] = useState(false);
    const [interviewMessage, setInterviewMessage] = useState("");

    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [commentLoading, setCommentLoading] = useState("");
    const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        try {
            const user = localStorage.getItem("user");
            if (user) {
                setMyRole(JSON.parse(user).role || "jobseeker");
            }
        } catch {
            setMyRole("jobseeker");
        }
    }, []);

    useEffect(() => {
        if (!id) return;

        const loadProfile = async () => {
            setLoading(true);
            setError("");

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${API}/api/users/${encodeURIComponent(String(id))}`,
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load profile.");
                }

                setProfile(data.user);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to connect to the server."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const loadPosts = async () => {
            setPostsLoading(true);
            setPostsError("");

            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    setPostsError("Log in to view posts on this profile.");
                    return;
                }

                const response = await fetch(
                    `${API}/api/posts/user/${encodeURIComponent(String(id))}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load posts.");
                }

                const fetchedPosts: Post[] = Array.isArray(data.posts)
                    ? data.posts
                    : [];

                setPosts(fetchedPosts);
            } catch (err) {
                setPostsError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load posts."
                );
            } finally {
                setPostsLoading(false);
            }
        };

        loadPosts();
    }, [id]);

    const sendInterviewRequest = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setInterviewMessage("");

        const token = localStorage.getItem("token");

        if (!token) {
            setInterviewMessage("Please log in first.");
            return;
        }

        if (!scheduledAt) {
            setInterviewMessage("Please select an interview date and time.");
            return;
        }

        setSending(true);

        try {
            const response = await fetch(`${API}/api/interviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    candidateId: id,
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    message,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setInterviewMessage(
                    data.message || "Failed to send interview request."
                );
                return;
            }

            setInterviewMessage("Interview request sent successfully!");
            setScheduledAt("");
        } catch {
            setInterviewMessage("Unable to connect to the server.");
        } finally {
            setSending(false);
        }
    };

    const submitComment = async (postId: string) => {
        const text = (commentInputs[postId] || "").trim();

        if (!text) {
            setCommentErrors((prev) => ({
                ...prev,
                [postId]: "Please enter a comment.",
            }));
            return;
        }

        const token = localStorage.getItem("token");

        if (!token) {
            setCommentErrors((prev) => ({
                ...prev,
                [postId]: "Please log in to comment.",
            }));
            return;
        }

        setCommentLoading(postId);
        setCommentErrors((prev) => ({ ...prev, [postId]: "" }));

        try {
            const response = await fetch(
                `${API}/api/posts/${postId}/comment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ text }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to add comment.");
            }

            // Reload this post's comments so the populated author details appear.
            const commentsResponse = await fetch(
                `${API}/api/posts/${postId}/comments`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const commentsData = await commentsResponse.json();

            if (!commentsResponse.ok) {
                throw new Error(
                    commentsData.message || "Comment added, but refresh failed."
                );
            }

            setPosts((prev) =>
                prev.map((post) =>
                    post._id === postId
                        ? {
                            ...post,
                            comments: Array.isArray(commentsData.comments)
                                ? commentsData.comments
                                : post.comments,
                        }
                        : post
                )
            );

            setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        } catch (err) {
            setCommentErrors((prev) => ({
                ...prev,
                [postId]:
                    err instanceof Error
                        ? err.message
                        : "Unable to add comment.",
            }));
        } finally {
            setCommentLoading("");
        }
    };

    if (loading) {
        return <main className="public-profile-page">Loading profile...</main>;
    }

    if (error || !profile) {
        return (
            <main className="public-profile-page">
                <div className="public-profile-card">
                    <h1>Profile unavailable</h1>
                    <p>{error || "This user could not be found."}</p>
                </div>
            </main>
        );
    }

    const imageUrl = profile.profilePicture
        ? `${API}/uploads/${encodeURIComponent(profile.profilePicture)}`
        : "";

    return (
        <main className="public-profile-page">
            <section className="public-profile-card">
                <header className="public-profile-banner">
                    <h1>Professional Profile</h1>
                    <p>Get to know this member of CareerConnect.</p>
                </header>

                <div className="public-profile-intro">
                    {imageUrl ? (
                        <img
                            className="public-profile-avatar"
                            src={imageUrl}
                            alt={`${profile.name}'s profile`}
                        />
                    ) : (
                        <div className="public-profile-avatar public-profile-placeholder">
                            {profile.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                    )}

                    <div className="public-profile-identity">
                        <h2>{profile.name}</h2>
                        <p>{profile.email}</p>
                    </div>
                </div>

                <div className="public-profile-content">
                    <section className="public-profile-section">
                        <h2>About</h2>
                        <p className="public-profile-text">
                            {profile.bio?.trim() || "No bio added yet."}
                        </p>
                    </section>

                    <section className="public-profile-section">
                        <h2>Skills</h2>
                        {profile.skills?.length ? (
                            <div className="public-profile-skills">
                                {profile.skills.map((skill, index) => (
                                    <span key={`${skill}-${index}`}>{skill}</span>
                                ))}
                            </div>
                        ) : (
                            <p className="public-profile-muted">
                                No skills added yet.
                            </p>
                        )}
                    </section>

                    <section className="public-profile-section">
                        <h2>Education</h2>
                        <p className="public-profile-text">
                            {profile.education?.trim() ||
                                "No education details added yet."}
                        </p>
                    </section>

                    <section className="public-profile-section">
                        <h2>Experience &amp; Projects</h2>
                        <p className="public-profile-text">
                            {profile.experience?.trim() ||
                                "No experience details added yet."}
                        </p>
                    </section>

                    {profile.resume && (
                        <section className="public-profile-section">
                            <h2>Resume</h2>
                            <button
                                type="button"
                                className="resume-download-button"
                                onClick={async () => {
                                    const token = localStorage.getItem("token");

                                    if (!token) {
                                        alert("Please log in first.");
                                        return;
                                    }

                                    try {
                                        const response = await fetch(
                                            `${API}/api/users/${profile._id}/resume`,
                                            {
                                                headers: {
                                                    Authorization: `Bearer ${token}`,
                                                },
                                            }
                                        );

                                        if (!response.ok) {
                                            const data = await response
                                                .json()
                                                .catch(() => ({}));
                                            throw new Error(
                                                data.message ||
                                                "Unable to open resume."
                                            );
                                        }

                                        const blob = await response.blob();
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, "_blank");
                                        setTimeout(
                                            () => URL.revokeObjectURL(url),
                                            60000
                                        );
                                    } catch (err) {
                                        alert(
                                            err instanceof Error
                                                ? err.message
                                                : "Unable to open resume."
                                        );
                                    }
                                }}
                            >
                                View / Download Resume
                            </button>
                        </section>
                    )}
                </div>

                {myRole === "recruiter" && profile.role === "jobseeker" && (
                    <section className="public-profile-section interview-form">
                        <h2>Invite for an Interview</h2>
                        <p>Send {profile.name} an interview invitation.</p>

                        <form onSubmit={sendInterviewRequest}>
                            <label htmlFor="scheduledAt">
                                Interview date and time
                            </label>
                            <input
                                id="scheduledAt"
                                type="datetime-local"
                                value={scheduledAt}
                                min={new Date(
                                    Date.now() -
                                    new Date().getTimezoneOffset() * 60000
                                )
                                    .toISOString()
                                    .slice(0, 16)}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                required
                            />

                            <label htmlFor="interviewMessage">
                                Invitation message
                            </label>
                            <textarea
                                id="interviewMessage"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                maxLength={1000}
                                rows={4}
                            />

                            <button type="submit" disabled={sending}>
                                {sending
                                    ? "Sending..."
                                    : "Send Interview Request"}
                            </button>
                        </form>

                        {interviewMessage && (
                            <p role="status">{interviewMessage}</p>
                        )}
                    </section>
                )}

                {/* Posts by this profile's owner */}
                <section className="public-profile-section public-profile-posts">
                    <h2>{profile.name}&apos;s Posts</h2>

                    {postsLoading && <p>Loading posts...</p>}

                    {!postsLoading && postsError && (
                        <p role="alert">{postsError}</p>
                    )}

                    {!postsLoading && !postsError && posts.length === 0 && (
                        <p className="public-profile-muted">
                            This user hasn&apos;t shared any posts yet.
                        </p>
                    )}

                    {!postsLoading &&
                        !postsError &&
                        posts.map((post) => (
                            <article className="public-profile-post" key={post._id}>
                                <div className="public-profile-post-author">
                                    {post.user?.profilePicture ? (
                                        <img
                                            src={`${API}/uploads/${encodeURIComponent(
                                                post.user.profilePicture
                                            )}`}
                                            alt=""
                                        />
                                    ) : (
                                        <div className="public-profile-comment-avatar">
                                            {post.user?.name?.charAt(0).toUpperCase() ||
                                                "U"}
                                        </div>
                                    )}

                                    <div>
                                        <strong>
                                            {post.user?.name || profile.name}
                                        </strong>
                                        {post.createdAt && (
                                            <p>
                                                {new Date(
                                                    post.createdAt
                                                ).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {post.content?.trim() && (
                                    <p className="public-profile-post-content">
                                        {post.content}
                                    </p>
                                )}

                                {post.image?.trim() && (
                                    <img
                                        className="public-profile-post-image"
                                        src={`${API}/uploads/${encodeURIComponent(
                                            post.image.trim()
                                        )}`}
                                        alt="Post attachment"
                                    />
                                )}

                                <p className="public-profile-post-stats">
                                    ❤️ {post.likes?.length || 0} likes
                                    {" · "}
                                    💬 {post.comments?.length || 0} comments
                                </p>

                                <div className="public-profile-comments">
                                    <h3>Comments</h3>

                                    {post.comments?.length ? (
                                        post.comments.map((comment, index) => (
                                            <div
                                                className="public-profile-comment"
                                                key={comment._id || `${post._id}-${index}`}
                                            >
                                                {comment.user?.profilePicture ? (
                                                    <img
                                                        src={`${API}/uploads/${encodeURIComponent(
                                                            comment.user.profilePicture
                                                        )}`}
                                                        alt=""
                                                    />
                                                ) : (
                                                    <div className="public-profile-comment-avatar">
                                                        {comment.user?.name
                                                            ?.charAt(0)
                                                            .toUpperCase() || "U"}
                                                    </div>
                                                )}

                                                <div>
                                                    <strong>
                                                        {comment.user?.name ||
                                                            "CareerConnect member"}
                                                    </strong>
                                                    <p>{comment.text}</p>
                                                    {comment.createdAt && (
                                                        <small>
                                                            {new Date(
                                                                comment.createdAt
                                                            ).toLocaleString()}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="public-profile-muted">
                                            No comments yet.
                                        </p>
                                    )}

                                    <form
                                        className="public-profile-comment-form"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            submitComment(post._id);
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={commentInputs[post._id] || ""}
                                            onChange={(event) =>
                                                setCommentInputs((prev) => ({
                                                    ...prev,
                                                    [post._id]: event.target.value,
                                                }))
                                            }
                                            placeholder="Write a comment..."
                                            maxLength={1000}
                                            aria-label={`Comment on post by ${post.user?.name || profile.name
                                                }`}
                                        />

                                        <button
                                            type="submit"
                                            disabled={commentLoading === post._id}
                                        >
                                            {commentLoading === post._id
                                                ? "Posting..."
                                                : "Comment"}
                                        </button>
                                    </form>

                                    {commentErrors[post._id] && (
                                        <p role="alert">
                                            {commentErrors[post._id]}
                                        </p>
                                    )}
                                </div>
                            </article>
                        ))}
                </section>
            </section>
        </main>
    );
}