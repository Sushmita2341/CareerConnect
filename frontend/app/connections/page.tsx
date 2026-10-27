"use client";

import { useEffect, useState } from "react";

export default function Connections() {
    const [connections, setConnections] = useState<any[]>([]);

    useEffect(() => {
        const fetchConnections = async () => {
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(
                    "http://localhost:8080/api/connections/my",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    setConnections(data.connections);
                } else {
                    alert(data.message);
                }
            } catch (error) {
                alert("Unable to fetch connections");
            }
        };

        fetchConnections();
    }, []);

    return (
        <main className="connections-page">
            <header className="connections-header">
                <h1>My Connections</h1>
                <p>People you're connected with on CareerConnect.</p>
            </header>
            {
                connections.length === 0 ? (
                    <p className="connections-empty">No connections yet.</p>
                ) : (
                    connections.map((connection) => {
                        const token = localStorage.getItem("token");

                        const myId = JSON.parse(
                            atob(token!.split(".")[1])
                        ).id;

                        const person =
                            connection.requester._id === myId
                                ? connection.recipient
                                : connection.requester;

                        return (
                            <article className="connection-card" key={connection._id}>
                                <img
                                    src={`http://localhost:8080/uploads/${person.profilePicture}`}
                                    alt="Profile"
                                    width="100"
                                    height="100"
                                />

                                <h2>{person.name}</h2>

                                <p>{person.email}</p>

                                <p className="connection-status">🟢 Connected</p>

                                <hr />
                            </article>
                        );
                    })
                )
            }
        </main >
    );
}