"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
interface NotificationItem {
    _id: string;
    type: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
    sender?: {
        name?: string;
        profilePicture?: string;
    } | null;
}
interface NotificationResponse {
    notifications?: NotificationItem[];
    unreadCount?: number;
    message?: string;
}
async function readResponse(
    response: Response
): Promise<NotificationResponse> {
    const text = await response.text();
    if (!text) {
        return {};
    }
    try {
        return JSON.parse(text) as NotificationResponse;
    } catch {
        throw new Error("Invalid response from the server.");
    }
}
export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState("");
    const [updatingAll, setUpdatingAll] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            setError("");
            const token = localStorage.getItem("token"); if (!token) { window.location.href = "/login"; return; } const response = await fetch("http://localhost:8080/api/notifications", { headers: { Authorization: `Bearer ${token}`, }, cache: "no-store", }); const data = await readResponse(response); if (response.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login"; return; } if (!response.ok) { throw new Error(data.message || "Unable to load notifications."); } setNotifications(Array.isArray(data.notifications) ? data.notifications : []); setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to load notifications."); } finally { setLoading(false); }
    }, []);
    useEffect(() => {
        void loadNotifications();
        const intervalId = window.setInterval(() => { void loadNotifications(); }, 15000); return () => window.clearInterval(intervalId);
    }, [loadNotifications]);
    async function markRead(id: string) {
        const notification = notifications.find(
            (item: NotificationItem) => item._id === id
        );
        if (!notification || notification.isRead || updatingId) { return; } try { setUpdatingId(id); setError(""); const token = localStorage.getItem("token"); if (!token) { window.location.href = "/login"; return; } const response = await fetch(`http://localhost:8080/api/notifications/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, }, }); const data = await readResponse(response); if (!response.ok) { throw new Error(data.message || "Unable to mark notification as read."); } setNotifications((previous: NotificationItem[]) => previous.map((item: NotificationItem) => item._id === id ? { ...item, isRead: true } : item)); setUnreadCount((previous: number) => Math.max(0, previous - 1)); } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to update notification."); } finally { setUpdatingId(""); }
    }
    async function markAllRead() {
        if (updatingAll || unreadCount === 0) {
            return;
        }
        try { setUpdatingAll(true); setError(""); const token = localStorage.getItem("token"); if (!token) { window.location.href = "/login"; return; } const response = await fetch("http://localhost:8080/api/notifications/read-all", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, }, }); const data = await readResponse(response); if (!response.ok) { throw new Error(data.message || "Unable to mark all as read."); } setNotifications((previous: NotificationItem[]) => previous.map((item: NotificationItem) => ({ ...item, isRead: true, }))); setUnreadCount(0); } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to update notifications."); } finally { setUpdatingAll(false); }
    }
    return (
        <main className="jobs-page">
            <section className="jobs-hero">
                <p className="jobs-eyebrow">CAREERCONNECT</p>
                <h1>Notifications</h1>
                <p>
                    Stay updated on applications, connections, and messages.
                </p>
                <Link href="/jobs" className="jobs-secondary-link"> Back to Jobs </Link> </section > <section className="jobs-results"> <div className="jobs-results-heading"> <h2>Your notifications</h2> <span>{unreadCount} unread</span> </div> <button type="button" onClick={markAllRead} disabled={updatingAll || unreadCount === 0} > {updatingAll ? "Updating..." : "Mark all as read"} </button> {loading && (<p className="jobs-empty">Loading notifications...</p>)} {!loading && error && (<div className="jobs-error"> <p>{error}</p> <button type="button" onClick={() => void loadNotifications()} > Try again </button> </div>)} {!loading && !error && notifications.length === 0 && (<div className="jobs-empty"> <h3>No notifications yet</h3> <p>New updates will appear here.</p> </div>)} {!loading && notifications.length > 0 && (<div className="jobs-grid"> {notifications.map((item: NotificationItem) => (<article className="job-card" key={item._id} style={{ opacity: item.isRead ? 0.75 : 1, }} > <h3>{item.sender?.name || "CareerConnect"}</h3> <p className="job-company">{item.message}</p> <p className="job-posted-by"> {item.type.replace(/_/g, " ")} ·{" "} {new Date(item.createdAt).toLocaleString()} </p> {!item.isRead && (<button type="button" onClick={() => void markRead(item._id)} disabled={updatingId === item._id} > {updatingId === item._id ? "Updating..." : "Mark as read"} </button>)} {item.link && (<Link href={item.link} className="jobs-secondary-link" > View </Link>)} {item.isRead && <p>Already read</p>} </article>))} </div>)} </section> </main >
    );
}