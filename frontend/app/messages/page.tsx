"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const API = "http://localhost:8080";
async function readApiResponse(response: Response) {
    const text = await response.text();

    let data: any;

    try {
        data = JSON.parse(text);
    } catch {
        console.error(
            "Messages API returned non-JSON:",
            response.status,
            text.slice(0, 300)
        );

        throw new Error(
            `API returned HTML or invalid JSON (HTTP ${response.status}). Check the backend route.`
        );
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
}

interface Person {
    _id: string;
    name: string;
    email?: string;
    profilePicture?: string;
}

interface Message {
    _id: string;
    sender: string | { _id: string; name?: string };
    recipient: string | { _id: string; name?: string };
    text: string;
    createdAt: string;
}

interface Conversation {
    user: Person;
    lastMessage: {
        text: string;
        createdAt: string;
        sender: string;
    } | null;
}

function getId(value: string | { _id: string }) {
    return typeof value === "string" ? value : value._id;
}

function getCurrentUserId(token: string): string {
    try {
        const payload = token.split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        return JSON.parse(atob(payload)).id || "";
    } catch {
        return "";
    }
}

export default function MessagesPage() {
    const [token, setToken] = useState("");
    const [myId, setMyId] = useState("");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUser, setSelectedUser] = useState<Person | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem("token") || "";
        setToken(savedToken);
        setMyId(savedToken ? getCurrentUserId(savedToken) : "");

        if (!savedToken) {
            setError("Please log in to use messaging.");
            setLoading(false);
        }
    }, []);

    const authHeaders = useCallback(
        () => ({
            Authorization: `Bearer ${token}`,
        }),
        [token]
    );

    const loadConversations = useCallback(async () => {
        if (!token) return;

        const response = await fetch(`${API}/api/messages/conversations`, {
            headers: authHeaders(),
            cache: "no-store",
        });

        const data = await readApiResponse(response);

        if (!response.ok) {
            throw new Error(data.message || "Unable to load conversations.");
        }

        const list: Conversation[] = Array.isArray(data.conversations)
            ? data.conversations
            : [];

        setConversations(list);

        setSelectedUser((current) => {
            if (!current) return current;
            const refreshed = list.find(
                (item) => item.user._id === current._id
            );
            return refreshed?.user || current;
        });
    }, [token, authHeaders]);

    const loadMessages = useCallback(
        async (userId: string) => {
            if (!token || !userId) return;

            const response = await fetch(
                `${API}/api/messages/${encodeURIComponent(userId)}`,
                {
                    headers: authHeaders(),
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load messages.");
            }

            setMessages(Array.isArray(data.messages) ? data.messages : []);
            setError("");
        },
        [token, authHeaders]
    );

    useEffect(() => {
        if (!token) return;

        let cancelled = false;

        const initialLoad = async () => {
            try {
                await loadConversations();
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load conversations."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        initialLoad();

        return () => {
            cancelled = true;
        };
    }, [token, loadConversations]);

    useEffect(() => {
        if (!token || !selectedUser) {
            setMessages([]);
            return;
        }

        let cancelled = false;

        const refresh = async () => {
            try {
                await loadMessages(selectedUser._id);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to refresh messages."
                    );
                }
            }
        };

        refresh();

        const interval = window.setInterval(refresh, 3000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [token, selectedUser?._id, loadMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const openConversation = async (person: Person) => {
        setSelectedUser(person);
        setMessages([]);
        setError("");

        try {
            await loadMessages(person._id);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to open conversation."
            );
        }
    };

    const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedUser || !draft.trim() || sending) return;

        const text = draft.trim();

        if (text.length > 5000) {
            setError("Messages must be 5000 characters or fewer.");
            return;
        }

        setSending(true);
        setError("");

        try {
            const response = await fetch(
                `${API}/api/messages/${encodeURIComponent(selectedUser._id)}`,
                {
                    method: "POST",
                    headers: {
                        ...authHeaders(),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ text }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to send message.");
            }

            setDraft("");
            await Promise.all([
                loadMessages(selectedUser._id),
                loadConversations(),
            ]);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to send message."
            );
        } finally {
            setSending(false);
        }
    };

    const formatTime = (date: string) =>
        new Date(date).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    if (loading) {
        return <main className="messages-page">Loading messages...</main>;
    }

    if (!token) {
        return (
            <main className="messages-page">
                <h1>Messages</h1>
                <p>Please log in to use messaging.</p>
                <Link href="/login">Go to Login</Link>
            </main>
        );
    }

    return (
        <main className="messages-page">
            <header className="messages-heading">
                <h1>Messages</h1>
                <p>Chat privately with your accepted connections.</p>
            </header>

            {error && (
                <p className="messages-error" role="alert">
                    {error}
                </p>
            )}

            <section className="messages-layout">
                <aside className="messages-sidebar">
                    <h2>Your connections</h2>

                    {conversations.length === 0 ? (
                        <p className="messages-muted">
                            No accepted connections yet. Connect with people
                            first to start a conversation.
                        </p>
                    ) : (
                        conversations.map((conversation) => (
                            <button
                                key={conversation.user._id}
                                type="button"
                                className={`conversation-item ${selectedUser?._id === conversation.user._id
                                    ? "conversation-item-active"
                                    : ""
                                    }`}
                                onClick={() =>
                                    openConversation(conversation.user)
                                }
                            >
                                <span className="conversation-avatar">
                                    {conversation.user.name
                                        ?.charAt(0)
                                        .toUpperCase() || "U"}
                                </span>

                                <span className="conversation-details">
                                    <strong>{conversation.user.name}</strong>
                                    <span className="conversation-preview">
                                        {conversation.lastMessage?.text ||
                                            "Start a conversation"}
                                    </span>
                                </span>
                            </button>
                        ))
                    )}
                </aside>

                <section className="messages-chat">
                    {!selectedUser ? (
                        <div className="messages-welcome">
                            <span>💬</span>
                            <h2>Your conversations</h2>
                            <p>Select a connection to start chatting.</p>
                        </div>
                    ) : (
                        <>
                            <header className="messages-chat-header">
                                <div>
                                    <h2>{selectedUser.name}</h2>
                                    <Link href={`/people/${selectedUser._id}`}>
                                        View Profile
                                    </Link>
                                </div>
                            </header>

                            <div
                                className="messages-list"
                                aria-live="polite"
                            >
                                {messages.length === 0 ? (
                                    <p className="messages-muted">
                                        No messages yet. Say hello!
                                    </p>
                                ) : (
                                    messages.map((message) => {
                                        const mine =
                                            getId(message.sender) === myId;

                                        return (
                                            <div
                                                key={message._id}
                                                className={`message-row ${mine
                                                    ? "message-row-mine"
                                                    : "message-row-theirs"
                                                    }`}
                                            >
                                                <div
                                                    className={`message-bubble ${mine
                                                        ? "message-bubble-mine"
                                                        : ""
                                                        }`}
                                                >
                                                    <p>{message.text}</p>
                                                    <time>
                                                        {formatTime(
                                                            message.createdAt
                                                        )}
                                                    </time>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={bottomRef} />
                            </div>

                            <form
                                className="messages-compose"
                                onSubmit={sendMessage}
                            >
                                <textarea
                                    value={draft}
                                    onChange={(event) =>
                                        setDraft(event.target.value)
                                    }
                                    placeholder="Write a message..."
                                    rows={2}
                                    maxLength={5000}
                                    aria-label="Message text"
                                />
                                <button
                                    type="submit"
                                    disabled={!draft.trim() || sending}
                                >
                                    {sending ? "Sending..." : "Send"}
                                </button>
                            </form>
                        </>
                    )}
                </section>
            </section>
        </main>
    );
}