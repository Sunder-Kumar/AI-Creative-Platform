"use client";

import { useTrialContext } from "@/context/TrialContext";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    trialInfo,
    subscriptionStatus,
    loading: trialLoading,
  } = useTrialContext();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/auth/login");
      return;
    }

    setUser(session.user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(profileData);

    if (typeof window !== "undefined") {
      const modalKey = `subscribeModalSeen:${session.user.id}`;
      const hasSeen = sessionStorage.getItem(modalKey) === "true";
      setShowSubscribeModal(!hasSeen);
    }

    setLoading(false);
  }

  function dismissSubscribeModal() {
    if (typeof window !== "undefined" && user) {
      sessionStorage.setItem(`subscribeModalSeen:${user.id}`, "true");
    }
    setShowSubscribeModal(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  if (loading || trialLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <div className="loading"></div>
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/dashboard/chat", label: "AI Chat", icon: "💬" },
    { href: "/dashboard/book-outline", label: "Book Outline", icon: "📚" },
    { href: "/dashboard/murder-mystery", label: "Murder Mystery", icon: "🔍" },
    { href: "/dashboard/game-story", label: "Game Story", icon: "🎮" },
    { href: "/dashboard/saved", label: "Saved Content", icon: "💾" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05050a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* NAVBAR */}
      <nav
        style={{
          background: "#0d0d15",
          borderBottom: "1px solid #1f1f2e",
          padding: "16px 0",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >

        {/* NEW TOP-RIGHT FIXED PROFILE ICON (redesigned) */}
        <div
          onClick={() => setShowProfileModal(true)}
          style={{
            position: "absolute",
            top: "40px",
            right: "50px",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            overflow: "hidden",
            cursor: "pointer",
            border: "2px solid #2f2f2f",
            zIndex: 200,
            display: "flex", // Added for centering SVG
            alignItems: "center", // Added for centering SVG
            justifyContent: "center", // Added for centering SVG
            backgroundColor: "#1f1f2e", // A subtle background for the icon
          }}
        >
          {/* Generic user SVG icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "60%", height: "60%", color: "#cbd5f5" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>

        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* LEFT SIDE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/dashboard"
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #6ddcff 0%, #7f60ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI Creative Platform
            </Link>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      color: active ? "#fff" : "#9ca3af",
                      textDecoration: "none",
                      padding: "8px 14px",
                      borderRadius: "999px",
                      background: active
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : "#151521",
                      border: active ? "none" : "1px solid #1f1f2e",
                      fontSize: "14px",
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE (Profile icon removed here) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {subscriptionStatus === "free" && (
              <>
                <Link
                  href="/dashboard/subscribe"
                  className="btn btn-primary"
                  onClick={dismissSubscribeModal}
                >
                  Subscribe ($10/mo)
                </Link>

                <div
                  style={{
                    background: "#0f0f0f",
                    border: "1px solid #2f2f2f",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "180px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      letterSpacing: "0.05em",
                    }}
                  >
                    TRIAL REMAINING
                  </span>

                  <span
                    style={{
                      color: "#fbbf24",
                      fontWeight: 600,
                      fontSize: "18px",
                    }}
                  >
                    {trialInfo.remaining} / {trialInfo.total}
                  </span>
                </div>
              </>
            )}

            {subscriptionStatus === "active" && (
              <span
                style={{ color: "#4ade80", fontSize: "14px", fontWeight: 600 }}
              >
                ✓ Premium active
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ padding: "40px 0", flex: 1 }}>{children}</main>

      {/* SUBSCRIBE POPUP */}
      {showSubscribeModal && subscriptionStatus !== "active" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#111",
              borderRadius: "16px",
              border: "1px solid #333",
              padding: "32px",
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              position: "relative",
            }}
          >
            <button
              onClick={dismissSubscribeModal}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "#666",
                fontSize: "20px",
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              ×
            </button>

            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚀</div>
            <h2 style={{ marginBottom: "12px" }}>Unlock Unlimited Creativity</h2>

            <p style={{ color: "#aaa", marginBottom: "24px" }}>
              Subscribe now to enjoy unlimited access to every AI tool. You
              currently have <strong>{trialInfo.remaining}</strong> of{" "}
              {trialInfo.total} trial credits remaining.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link
                href="/dashboard/subscribe"
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={dismissSubscribeModal}
              >
                Subscribe Now
              </Link>

              {trialInfo.active && (
                <button
                  className="btn btn-secondary"
                  onClick={dismissSubscribeModal}
                  style={{ width: "100%" }}
                >
                  Continue Trial
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL (unchanged) */}
      {showProfileModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#111",
              padding: "28px",
              borderRadius: "16px",
              border: "1px solid #333",
              width: "360px",
              textAlign: "center",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowProfileModal(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 14,
                background: "transparent",
                border: "none",
                fontSize: "22px",
                color: "#777",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {/* Generic user SVG icon for profile modal */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                marginBottom: "16px",
                border: "2px solid #333",
                backgroundColor: "#1f1f2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "60%", height: "60%", color: "#cbd5f5" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>

            <h3 style={{ color: "#fff", marginBottom: "6px" }}>
              {profile?.full_name || "User"}
            </h3>

            <p style={{ color: "#aaa", marginBottom: "20px" }}>
              {profile?.email || user?.email}
            </p>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
