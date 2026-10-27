"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) { alert("Please enter your email and password."); return; }
        setLoading(true); try {
            const response = await fetch("http://localhost:8080/api/users/login", { method: "POST", headers: { "Content-Type": "application/json", }, body: JSON.stringify({ email: email.trim(), password, }), }); const data = await response.json(); if (!response.ok) { alert(data.message || "Login failed."); return; }
            // Save the authentication token 
            localStorage.setItem("token", data.token);
            // Save user information if the backend returns it 
            if (data.user) { localStorage.setItem("user", JSON.stringify(data.user)); }
            // Redirect according to the user's registered role 
            const role = data.user?.role || "jobseeker";
            alert("Login successful!"); if (role === "recruiter") { router.push("/jobs/dashboard"); } else { router.push("/jobs"); }
        } catch (error) {
            alert("Unable to connect to server.");
        } finally { setLoading(false); }
    };

    return (
        <main className="login-page">
            <div className="login-card">
                <h1>Login to CareerConnect</h1>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <br /><br />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <br /><br />

                <button onClick={handleLogin}>{loading ? "logging in ..." : "Login"}</button>
            </div>
        </main>
    );
}