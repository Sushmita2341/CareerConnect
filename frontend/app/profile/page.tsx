"use client";

import { useEffect, useRef, useState } from "react";

const API = "http://localhost:8080";

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    resume?: string;
    bio?: string;
    skills?: string[];
    education?: string;
    experience?: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [skills, setSkills] = useState("");
    const [education, setEducation] = useState("");
    const [experience, setExperience] = useState("");

    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedResume, setSelectedResume] = useState<File | null>(null);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [resumeMessage, setResumeMessage] = useState("");
    const resumeInputRef = useRef<HTMLInputElement>(null);

    const imageInputRef = useRef<HTMLInputElement>(null);

    const getToken = () => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem("token");
    };

    const loadProfile = async () => {
        const token = getToken();

        if (!token) {
            setMessage("Please log in to view your profile.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API}/api/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Unable to load profile.");
                return;
            }

            const user: UserProfile = data.user;

            setProfile(user);
            setName(user.name || "");
            setBio(user.bio || "");
            setSkills((user.skills || []).join(", "));
            setEducation(user.education || "");
            setExperience(user.experience || "");
            setMessage("");
        } catch (error) {
            console.error("LOAD PROFILE ERROR:", error);
            setMessage("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();

    }, []);

    const handleImageChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0] || null;

        if (!file) {
            setSelectedImage(null);
            return;
        }

        if (!file.type.startsWith("image/")) {
            setMessage("Please select a valid image.");
            event.target.value = "";
            setSelectedImage(null);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage("Please select an image smaller than 5 MB.");
            event.target.value = "";
            setSelectedImage(null);
            return;
        }

        setSelectedImage(file);
        setMessage("");
    };

    const handleSave = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            setMessage("Please log in first.");
            return;
        }

        if (!name.trim()) {
            setMessage("Name cannot be empty.");
            return;
        }

        setSaving(true);
        setMessage("");

        const formData = new FormData();

        formData.append("name", name.trim());
        formData.append("bio", bio);
        formData.append("skills", skills);
        formData.append("education", education);
        formData.append("experience", experience);

        if (selectedImage) {
            formData.append("profilePicture", selectedImage);
        }

        try {
            const response = await fetch(
                `${API}/api/users/profile/update`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Unable to update profile.");
                return;
            }

            if (data.user) {
                setProfile(data.user);
                setName(data.user.name || "");
                setBio(data.user.bio || "");
                setSkills((data.user.skills || []).join(", "));
                setEducation(data.user.education || "");
                setExperience(data.user.experience || "");
            } else {
                await loadProfile();
            }

            setSelectedImage(null);

            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }

            setMessage("Profile updated successfully!");
        } catch (error) {
            console.error("UPDATE PROFILE ERROR:", error);
            setMessage("Unable to connect to the server.");
        } finally {
            setSaving(false);
        }
    };
    const handleResumeUpload = async () => {

        const token = getToken();

        if (!token) {
            setResumeMessage("Please log in first.");
            return;
        }

        if (!selectedResume) {
            setResumeMessage("Please select a PDF resume.");
            return;
        }

        if (selectedResume.type !== "application/pdf") {
            setResumeMessage("Please select a PDF file.");
            return;
        }

        if (selectedResume.size > 5 * 1024 * 1024) {
            setResumeMessage("Resume must be smaller than 5 MB.");
            return;
        }

        const formData = new FormData();
        formData.append("resume", selectedResume);

        try {
            setUploadingResume(true);
            setResumeMessage("");

            const response = await fetch(`${API}/api/users/resume`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Resume upload failed.");
            }

            setProfile((previous) =>
                previous ? { ...previous, resume: data.resume } : previous
            );

            setSelectedResume(null);

            if (resumeInputRef.current) {
                resumeInputRef.current.value = "";
            }

            setResumeMessage("Resume uploaded successfully!");
        } catch (error) {
            console.error("RESUME UPLOAD ERROR:", error);
            setResumeMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to upload resume."
            );
        } finally {
            setUploadingResume(false);
        }
    };

    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-card">
                    <p>Loading your profile...</p>
                </div>
            </main>
        );
    }

    if (!profile) {
        return (
            <main className="profile-page">
                <div className="profile-card">
                    <h1>My Profile</h1>
                    <p>{message || "Profile not available."}</p>
                </div>
            </main>
        );
    }

    const currentImage = selectedImage
        ? URL.createObjectURL(selectedImage)
        : profile.profilePicture
            ? `${API}/uploads/${profile.profilePicture}`
            : "";

    return (
        <main className="profile-page">
            <section className="profile-card">
                <div className="profile-banner">
                    <h1>My Professional Profile</h1>
                    <p>
                        Tell your story, showcase your skills, and grow
                        your professional network.
                    </p>
                </div>

                <form onSubmit={handleSave}>
                    <div className="profile-picture-section">
                        {currentImage ? (
                            <img
                                className="profile-page-avatar"
                                src={currentImage}
                                alt="Profile"
                            />
                        ) : (
                            <div className="profile-page-avatar profile-avatar-placeholder">
                                {name.charAt(0).toUpperCase() || "U"}
                            </div>
                        )}

                        <div className="profile-picture-controls">
                            <h2>{profile.name}</h2>
                            <p>{profile.email}</p>

                            <label
                                className="profile-image-label"
                                htmlFor="profile-picture"
                            >
                                Change profile picture
                            </label>

                            <input
                                ref={imageInputRef}
                                id="profile-picture"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                            />

                            {selectedImage && (
                                <button
                                    type="button"
                                    className="profile-cancel-image"
                                    onClick={() => {
                                        setSelectedImage(null);

                                        if (imageInputRef.current) {
                                            imageInputRef.current.value = "";
                                        }
                                    }}
                                >
                                    Remove selected image
                                </button>
                            )}

                            <small>
                                Choose an image smaller than 5 MB.
                            </small>
                        </div>
                    </div>

                    <div className="profile-form-content">
                        <h2>Basic Information</h2>

                        <div className="profile-field">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Enter your full name"
                                required
                                maxLength={100}
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={profile.email}
                                readOnly
                            />
                            <small>
                                Your registered email address cannot be
                                changed here.
                            </small>
                        </div>

                        <div className="profile-section-divider" />

                        <h2>About Me</h2>

                        <div className="profile-field">
                            <label htmlFor="bio">Professional Bio</label>
                            <textarea
                                id="bio"
                                value={bio}
                                onChange={(event) =>
                                    setBio(event.target.value)
                                }
                                placeholder="Introduce yourself and your career goals..."
                                rows={4}
                                maxLength={1000}
                            />
                            <small>{bio.length}/1000 characters</small>
                        </div>

                        <div className="profile-section-divider" />

                        <h2>Skills</h2>

                        <div className="profile-field">
                            <label htmlFor="skills">Technical Skills</label>
                            <input
                                id="skills"
                                type="text"
                                value={skills}
                                onChange={(event) =>
                                    setSkills(event.target.value)
                                }
                                placeholder="Java, Python, SQL, React"
                            />
                            <small>
                                Separate skills with commas.
                            </small>
                        </div>

                        {skills.trim() && (
                            <div className="profile-skill-list">
                                {skills
                                    .split(",")
                                    .map((skill) => skill.trim())
                                    .filter(Boolean)
                                    .map((skill, index) => (
                                        <span key={`${skill}-${index}`}>
                                            {skill}
                                        </span>
                                    ))}
                            </div>
                        )}

                        <div className="profile-section-divider" />

                        <h2>Education</h2>

                        <div className="profile-field">
                            <label htmlFor="education">
                                Education Details
                            </label>
                            <textarea
                                id="education"
                                value={education}
                                onChange={(event) =>
                                    setEducation(event.target.value)
                                }
                                placeholder="Degree, college, university, graduation year..."
                                rows={4}
                                maxLength={2000}
                            />
                        </div>
                        <div className="profile-section-divider" />

                        <h2>Resume</h2>

                        <div className="profile-field">
                            <label htmlFor="resume">Upload Resume (PDF)</label>

                            <div>
                                <input
                                    ref={resumeInputRef}
                                    id="resume"
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={(event) => {
                                        setSelectedResume(event.target.files?.[0] || null);
                                        setResumeMessage("");
                                    }}
                                />

                                <small>PDF only, maximum 5 MB.</small>

                                {profile.resume && (
                                    <p>
                                        A resume has been uploaded to your profile.
                                    </p>
                                )}

                                {resumeMessage && (
                                    <p className="profile-message" role="status">
                                        {resumeMessage}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    className="profile-save-button"
                                    disabled={uploadingResume || !selectedResume}
                                    onClick={handleResumeUpload}
                                >
                                    {uploadingResume ? "Uploading..." : "Upload Resume"}
                                </button>
                            </div>
                        </div>

                        <div className="profile-section-divider" />

                        <h2>Experience</h2>

                        <div className="profile-field">
                            <label htmlFor="experience">
                                Work Experience and Projects
                            </label>
                            <textarea
                                id="experience"
                                value={experience}
                                onChange={(event) =>
                                    setExperience(event.target.value)
                                }
                                placeholder="Describe your internships, projects, responsibilities, or work experience..."
                                rows={5}
                                maxLength={3000}
                            />
                        </div>

                        {message && (
                            <p
                                className={
                                    message === "Profile updated successfully!"
                                        ? "profile-message success"
                                        : "profile-message"
                                }
                                role="status"
                            >
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="profile-save-button"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}