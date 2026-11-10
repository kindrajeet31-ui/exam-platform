
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Student = {
  id: number;
  name: string;
  email: string;
};

export default function Navbar() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkLogin() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
        });

        if (!active) return;

        if (response.ok) {
          const data = await response.json();
          setStudent(data.student);
        } else {
          setStudent(null);
        }
      } catch (error) {
        console.error("Login check failed:", error);
        if (active) setStudent(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkLogin();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/login";
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch {
      alert("Could not log out. Please try again.");
    }
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "25px",
        flexWrap: "wrap",
        padding: "18px 24px",
        backgroundColor: "#172033",
        borderBottom: "3px solid #2563eb",
      }}
    >
      <Link href="/" style={{ color: "white" }}>Home</Link>

      <Link href="/tests" style={{ color: "white" }}>
        Available Tests
      </Link>

      <Link href="/student" style={{ color: "white" }}>
        Student Dashboard
      </Link>

      <Link href="/results" style={{ color: "white" }}>
        Results
      </Link>

      {/* Admin Login Link */}
      <Link
        href="/admin-login"
        style={{
          color: "#facc15",
          fontWeight: "bold",
          textDecoration: "none",
        }}
      >
        Admin Login
      </Link>

      <div style={{ marginLeft: "auto", color: "white" }}>
        {loading ? (
          "Checking login..."
        ) : student ? (
          <span>
            Welcome, <strong>{student.name}</strong>
          </span>
        ) : (
          <Link href="/login" style={{ color: "white" }}>
            Student Login
          </Link>
        )}
      </div>

      {!loading && student && (
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#dc2626",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      )}
    </nav>
  );
}
