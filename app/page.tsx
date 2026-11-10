"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// Official Public Release: November 25, 2026 at 00:00 IST (UTC+05:30)
const LAUNCH_DATE = new Date("2026-11-25T00:00:00+05:30").getTime();

type ActiveOverlay = "none" | "contact" | "privacy";
type ContactCategory = "marketing" | "updates" | "press";
type ThemeMode = "obsidian" | "paper";

type WaitlistState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; duplicate: boolean; passId: string }
  | { status: "error"; message: string };

type ContactState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

interface CountdownTime {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  rawSeconds: number;
  istTime: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function readCountdown(): CountdownTime {
  const now = Date.now();
  const diff = Math.max(0, LAUNCH_DATE - now);

  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff / 3_600_000) % 24);
  const m = Math.floor((diff / 60_000) % 60);
  const s = Math.floor((diff / 1000) % 60);

  const istTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return {
    days: String(d).padStart(2, "0"),
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
    rawSeconds: s,
    istTime,
  };
}

/** Deterministic pass number generated from the subscriber's email */
function createPassNumber(email: string): string {
  let hash = 2166136261;
  for (let i = 0; i < email.length; i++) {
    hash ^= email.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const serial = Math.abs(hash % 90000) + 10000;
  return `NO. ${serial}`;
}

/** Downloads an .ics calendar event for the Nov 25, 2026 launch */
function downloadLaunchReminderIcs() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//down.//imdown.in//EN",
    "BEGIN:VEVENT",
    "DTSTART:20261124T183000Z",
    "DTEND:20261124T193000Z",
    "SUMMARY:down. — Official Public Launch (imdown.in)",
    "DESCRIPTION:down. is now live. Open https://imdown.in to access the release.",
    "URL:https://imdown.in",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "down-launch-2026.ics";
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Proportional vertical digit reel with soft optical vignette masks.
 */
function EditorialDigit({ char }: { char: string }) {
  const num = Number.parseInt(char, 10);
  if (Number.isNaN(num)) {
    return <span className="inline-block">{char}</span>;
  }

  return (
    <span
      className="relative inline-block h-[1.05em] w-[0.61em] overflow-hidden align-bottom select-none"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
      }}
    >
      <span
        className="flex flex-col transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        style={{ transform: `translate3d(0, -${num * 10}%, 0)` }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="flex h-[1.05em] items-center justify-center leading-none"
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function EditorialNumber({ value }: { value: string }) {
  return (
    <span
      className="inline-flex items-baseline tracking-[-0.055em]"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {value.split("").map((char, i) => (
        <EditorialDigit key={i} char={char} />
      ))}
    </span>
  );
}

/**
 * Monumental Sculptural Countdown.
 * Focused exclusively on the November 25, 2026 public launch.
 */
function SculpturalCountdown() {
  const [time, setTime] = useState<CountdownTime>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    rawSeconds: 0,
    istTime: "--:--:--",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = window.setTimeout(() => {
      setMounted(true);
      setTime(readCountdown());
    }, 40);

    const id = window.setInterval(() => {
      setTime(readCountdown());
    }, 1000);

    return () => {
      window.clearTimeout(init);
      window.clearInterval(id);
    };
  }, []);

  const columns = [
    { index: "01", label: "Days", sub: "Until release", value: time.days },
    { index: "02", label: "Hours", sub: "Remaining", value: time.hours },
    { index: "03", label: "Minutes", sub: "Remaining", value: time.minutes },
    {
      index: "04",
      label: "Seconds",
      sub: "Live sync",
      value: time.seconds,
      isSeconds: true,
    },
  ];

  // Smooth 0-100% progress sweep across each minute
  const minuteSweepPercent = mounted
    ? Math.round(((60 - time.rawSeconds) / 60) * 100)
    : 0;

  return (
    <section aria-label="Countdown to launch" className="w-full py-4 sm:py-8">
      {/* Top Status Bar + Live 60-Second Liquid Hairline */}
      <div className="relative pt-4">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ backgroundColor: "var(--border)" }}
        >
          <div
            className="h-full transition-all duration-1000 ease-out"
            style={{
              width: `${minuteSweepPercent}%`,
              backgroundColor: "var(--fg)",
              opacity: 0.7,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-block h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--fg)" }}
            />
            <span className="font-medium" style={{ color: "var(--fg)" }}>
              Countdown to Public Release
            </span>
            <span style={{ color: "var(--muted)" }}>
              · IST {mounted ? time.istTime : "--:--:--"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium"
              style={{
                borderColor: "var(--border-strong)",
                backgroundColor: "var(--surface)",
                color: "var(--fg)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--fg)" }}
              />
              Official Launch · November 25, 2026
            </span>
          </div>
        </div>
      </div>

      {/* Monumental 4-Column Timepiece */}
      <div
        className="mt-6 grid grid-cols-2 border-y lg:grid-cols-4"
        style={{ borderColor: "var(--border)" }}
      >
        {columns.map((col, idx) => (
          <div
            key={col.label}
            className={`group relative flex flex-col justify-between px-4 py-7 transition-colors duration-500 sm:px-8 sm:py-11 ${
              idx > 0 ? "lg:border-l" : ""
            } ${idx % 2 === 1 ? "border-l" : ""} ${
              idx >= 2 ? "border-t lg:border-t-0" : ""
            }`}
            style={{ borderColor: "var(--border)" }}
          >
            {/* Subtle hover illumination inside each column */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ backgroundColor: "var(--surface-hover)" }}
            />

            <div className="relative z-10 flex items-baseline justify-between">
              <div className="flex flex-col">
                <span
                  className="text-xs font-medium tracking-tight sm:text-sm"
                  style={{ color: "var(--fg)" }}
                >
                  {col.label}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--muted)" }}
                >
                  {col.sub}
                </span>
              </div>
              <span
                className="font-serif-editorial italic text-base transition-transform duration-500 group-hover:-translate-y-0.5 sm:text-lg"
                style={{ color: "var(--muted)" }}
              >
                {col.index}
              </span>
            </div>

            <div
              className={`relative z-10 mt-4 text-[clamp(4.25rem,11.5vw,10.5rem)] font-light leading-[0.92] tracking-[-0.055em] sm:mt-7 ${
                col.isSeconds
                  ? "opacity-65 transition-opacity group-hover:opacity-100"
                  : ""
              }`}
              style={{ color: "var(--fg)" }}
            >
              <EditorialNumber value={col.value} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
export default function DownPrelaunchPage() {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<ThemeMode>("obsidian");
  const [copiedLink, setCopiedLink] = useState(false);

  // Waitlist state
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [waitlist, setWaitlist] = useState<WaitlistState>({ status: "idle" });

  // Overlay & Contact state
  const [overlay, setOverlay] = useState<ActiveOverlay>("none");
  const [contactType, setContactType] = useState<ContactCategory>("marketing");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contact, setContact] = useState<ContactState>({ status: "idle" });

  // Keyboard shortcuts: "/" focuses the waitlist input, "Escape" closes overlays
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlay !== "none") {
        setOverlay("none");
      } else if (
        e.key === "/" &&
        overlay === "none" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        emailInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [overlay]);

  // Lock background scroll when an overlay is open
  useEffect(() => {
    if (overlay === "none") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlay]);

  const openContact = () => {
    setContact({ status: "idle" });
    setOverlay("contact");
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText("https://imdown.in");
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setWaitlist({
        status: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setWaitlist({ status: "submitting" });
    const passId = createPassNumber(cleanEmail);

    try {
      let { error } = await supabase.from("waitlist_subscribers").insert([
        {
          email: cleanEmail,
          marketing_opt_in: marketingOptIn,
          source: "imdown_prelaunch_2026",
        },
      ]);

      // Resilient fallback if the table only has an `email` column
      if (
        error &&
        error.code !== "23505" &&
        (error.code === "PGRST204" ||
          error.code === "42703" ||
          error.message?.toLowerCase().includes("column"))
      ) {
        const retry = await supabase
          .from("waitlist_subscribers")
          .insert([{ email: cleanEmail }]);
        error = retry.error;
      }

      if (error) {
        const isDuplicate =
          error.code === "23505" ||
          error.message?.toLowerCase().includes("duplicate") ||
          error.message?.toLowerCase().includes("unique");

        if (isDuplicate) {
          setWaitlist({ status: "success", duplicate: true, passId });
        } else {
          setWaitlist({
            status: "error",
            message: "Unable to join right now. Please try again.",
          });
        }
      } else {
        setWaitlist({ status: "success", duplicate: false, passId });
      }
    } catch {
      setWaitlist({
        status: "error",
        message: "Network error. Please check your connection.",
      });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = contactEmail.trim().toLowerCase();
    const cleanMsg = contactMessage.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !cleanMsg) {
      setContact({
        status: "error",
        message: "Please enter both your email and a message.",
      });
      return;
    }

    setContact({ status: "submitting" });

    try {
      const { error } = await supabase.from("contact_inquiries").insert([
        {
          inquiry_type: contactType,
          email: cleanEmail,
          message: cleanMsg,
        },
      ]);

      if (error) {
        setContact({
          status: "error",
          message: "Unable to send right now. Please try again.",
        });
      } else {
        setContact({ status: "success" });
        setContactEmail("");
        setContactMessage("");
      }
    } catch {
      setContact({
        status: "error",
        message: "Network error. Please try again.",
      });
    }
  };

  const isPaper = theme === "paper";

  return (
    <div
      style={
        {
          "--bg": isPaper ? "#EFECE6" : "#090908",
          "--fg": isPaper ? "#111110" : "#F4F1EA",
          "--muted": isPaper ? "#66635B" : "#9A968E",
          "--border": isPaper
            ? "rgba(17, 17, 16, 0.14)"
            : "rgba(244, 241, 234, 0.14)",
          "--border-strong": isPaper
            ? "rgba(17, 17, 16, 0.34)"
            : "rgba(244, 241, 234, 0.34)",
          "--surface": isPaper
            ? "rgba(17, 17, 16, 0.045)"
            : "rgba(244, 241, 234, 0.055)",
          "--surface-hover": isPaper
            ? "rgba(17, 17, 16, 0.03)"
            : "rgba(244, 241, 234, 0.025)",
          backgroundColor: "var(--bg)",
          color: "var(--fg)",
          fontFamily:
            "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        } as React.CSSProperties
      }
      className="relative min-h-dvh w-full transition-colors duration-700 ease-out antialiased selection:bg-[#F4F1EA] selection:text-[#090908]"
    >
      {/* Note: While Next.js supports build-time font optimization via next/font, we load these directly via CSS to keep your setup in a single self-contained file */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

        .font-serif-editorial {
          font-family: 'Instrument Serif', Georgia, serif;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill {
          -webkit-text-fill-color: var(--fg) !important;
          -webkit-box-shadow: 0 0 0px 1000px var(--bg) inset !important;
          transition: background-color 500000s ease-in-out 0s !important;
          caret-color: var(--fg) !important;
        }
      `}</style>

      {/* Subtle Warm Top Studio Wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: isPaper
            ? "radial-gradient(70% 50% at 50% 0%, rgba(255, 255, 255, 0.65) 0%, transparent 100%)"
            : "radial-gradient(70% 50% at 50% 0%, rgba(244, 241, 234, 0.055) 0%, transparent 100%)",
        }}
      />

      {/* Main Editorial Wrapper */}
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1400px] flex-col justify-between px-5 py-6 sm:px-12 sm:py-9">
        {/* =============================================================== */}
        {/* HEADER — High-Visibility Navigation Pills + Theme Switcher      */}
        {/* =============================================================== */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <a
            href="#top"
            className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl focus-visible:outline-none"
            style={{ color: "var(--fg)" }}
          >
            down
            <span className="font-serif-editorial italic font-normal">.</span>
          </a>

          <nav
            aria-label="Primary navigation"
            className="flex items-center gap-2 sm:gap-3"
          >
            <button
              type="button"
              onClick={openContact}
              style={{
                borderColor: "var(--border-strong)",
                backgroundColor: "var(--surface)",
                color: "var(--fg)",
              }}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium tracking-tight transition-all hover:opacity-80 active:scale-[0.98] sm:text-sm cursor-pointer"
            >
              <span>Inquiries & Press</span>
              <span aria-hidden="true" className="text-xs opacity-70">
                ↗
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOverlay("privacy")}
              style={{
                borderColor: "var(--border-strong)",
                backgroundColor: "var(--surface)",
                color: "var(--fg)",
              }}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium tracking-tight transition-all hover:opacity-80 active:scale-[0.98] sm:text-sm cursor-pointer"
            >
              <span>Privacy</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setTheme((t) => (t === "obsidian" ? "paper" : "obsidian"))
              }
              aria-label="Toggle editorial theme"
              title={
                isPaper ? "Switch to Obsidian theme" : "Switch to Paper theme"
              }
              style={{
                borderColor: "var(--border-strong)",
                backgroundColor: "var(--surface)",
                color: "var(--fg)",
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isPaper ? "☾" : "☀"}
            </button>
          </nav>
        </header>

        {/* =============================================================== */}
        {/* CENTERPIECE — Monumental Countdown + Editorial Split            */}
        {/* =============================================================== */}
        <main className="my-auto py-6 sm:py-8">
          <SculpturalCountdown />

          {/* Lower Asymmetric Split */}
          <div className="mt-8 grid grid-cols-1 items-end gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-10">
            {/* Left Column: High-Contrast Editorial Headline */}
            <div className="lg:col-span-7">
              <h1
                className="max-w-xl text-4xl font-light tracking-[-0.035em] sm:text-6xl leading-[1.04]"
                style={{ color: "var(--fg)" }}
              >
                A social space for real life,{" "}
                <span
                  className="font-serif-editorial italic font-normal"
                  style={{ color: "var(--muted)" }}
                >
                  off the feed.
                </span>
              </h1>
              <p
                className="mt-4 max-w-md text-sm font-normal leading-relaxed sm:text-base"
                style={{ color: "var(--muted)" }}
              >
                Spontaneous plans with the people you actually know—studying,
                sports, or late-night hangouts. No public metrics, no
                performative feeds, and no algorithmic noise.
              </p>
            </div>

            {/* Right Column: Minimalist Architectural Waitlist Form */}
            <div className="w-full lg:col-span-5">
              {waitlist.status !== "success" ? (
                <form
                  onSubmit={handleWaitlistSubmit}
                  noValidate
                  className="space-y-4"
                >
                  <div
                    className="group relative flex items-center border-b pb-3 transition-colors"
                    style={{ borderColor: "var(--border-strong)" }}
                  >
                    <label htmlFor="waitlist-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      ref={emailInputRef}
                      id="waitlist-email"
                      type="email"
                      required
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (waitlist.status === "error") {
                          setWaitlist({ status: "idle" });
                        }
                      }}
                      placeholder="Enter your email for early access…"
                      aria-invalid={waitlist.status === "error"}
                      style={{ color: "var(--fg)" }}
                      className="w-full bg-transparent pr-4 text-base font-light placeholder:opacity-50 focus:outline-none sm:text-lg"
                    />
                    <button
                      type="submit"
                      disabled={waitlist.status === "submitting"}
                      style={{
                        backgroundColor: "var(--fg)",
                        color: "var(--bg)",
                      }}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-medium tracking-tight transition-opacity hover:opacity-85 disabled:opacity-40 sm:text-sm cursor-pointer"
                    >
                      <span>
                        {waitlist.status === "submitting"
                          ? "Joining…"
                          : "Join waitlist"}
                      </span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  </div>

                  {waitlist.status === "error" && (
                    <p
                      role="alert"
                      className="text-xs font-medium text-[#E5534B]"
                    >
                      {waitlist.message}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label
                      className="inline-flex items-center gap-2.5 cursor-pointer select-none"
                      style={{ color: "var(--muted)" }}
                    >
                      <input
                        type="checkbox"
                        checked={marketingOptIn}
                        onChange={(e) => setMarketingOptIn(e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        style={{
                          borderColor: "var(--border-strong)",
                          backgroundColor: marketingOptIn
                            ? "var(--fg)"
                            : "transparent",
                          color: "var(--bg)",
                        }}
                        className="flex h-4 w-4 items-center justify-center rounded-xs border transition-colors"
                      >
                        {marketingOptIn && (
                          <svg
                            className="h-2.5 w-2.5"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="square"
                            />
                          </svg>
                        )}
                      </span>
                      <span style={{ color: "var(--fg)" }}>
                        Notify me when down. launches on November 25
                      </span>
                    </label>
                  </div>
                </form>
              ) : (
                /* Interactive Launch Pass on Successful Signup */
                <div
                  role="status"
                  className="rounded-2xl border p-5 sm:p-6"
                  style={{
                    borderColor: "var(--border-strong)",
                    backgroundColor: "var(--surface)",
                  }}
                >
                  <div className="flex items-center justify-between border-b pb-3 text-[11px] uppercase tracking-widest" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    <span>Early Access Pass · imdown.in</span>
                    <span style={{ color: "var(--fg)" }}>{waitlist.passId}</span>
                  </div>

                  <p className="mt-4 font-serif-editorial italic text-2xl sm:text-3xl">
                    {waitlist.duplicate
                      ? "You’re already on the list."
                      : "You’re on the list."}
                  </p>

                  <p
                    className="mt-1.5 text-xs leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    We’ve registered{" "}
                    <strong
                      className="font-medium"
                      style={{ color: "var(--fg)" }}
                    >
                      {email.trim()}
                    </strong>{" "}
                    for first-wave access on{" "}
                    <strong
                      className="font-medium"
                      style={{ color: "var(--fg)" }}
                    >
                      November 25, 2026
                    </strong>
                    .
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={downloadLaunchReminderIcs}
                      style={{
                        backgroundColor: "var(--fg)",
                        color: "var(--bg)",
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-opacity hover:opacity-85 cursor-pointer"
                    >
                      <span>+ Add Nov 25 to Calendar</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      style={{
                        borderColor: "var(--border-strong)",
                        color: "var(--fg)",
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-opacity hover:opacity-75 cursor-pointer"
                    >
                      <span>
                        {copiedLink ? "Copied imdown.in ✓" : "Share imdown.in"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* =============================================================== */}
        {/* FOOTER — Clear, High-Contrast Links for Press & Privacy         */}
        {/* =============================================================== */}
        <footer
          className="border-t pt-5"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex flex-col items-start justify-between gap-4 text-xs sm:flex-row sm:items-center sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: "var(--fg)" }}>
                down.
              </span>
              <span style={{ color: "var(--muted)" }}>
                © 2026 imdown.in · All rights reserved.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={openContact}
                style={{ color: "var(--fg)" }}
                className="inline-flex items-center gap-1 font-medium underline decoration-current/35 underline-offset-4 transition-opacity hover:opacity-75 cursor-pointer"
              >
                <span>Inquiries, Press & Partnerships</span>
                <span aria-hidden="true" className="text-xs">
                  ↗
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOverlay("privacy")}
                style={{ color: "var(--fg)" }}
                className="inline-flex items-center gap-1 font-medium underline decoration-current/35 underline-offset-4 transition-opacity hover:opacity-75 cursor-pointer"
              >
                <span>Privacy Policy</span>
                <span aria-hidden="true" className="text-xs">
                  ↗
                </span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ================================================================= */}
      {/* FULL-SCREEN OVERLAY 1: INQUIRIES & PRESS                          */}
      {/* ================================================================= */}
      {overlay === "contact" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="overlay-contact-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOverlay("none");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-10"
        >
          <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#F4F1EA]/20 bg-[#0D0D0C] p-6 text-[#F4F1EA] shadow-2xl sm:p-10">
            <div className="flex items-center justify-between border-b border-[#F4F1EA]/15 pb-6">
              <div>
                <h2
                  id="overlay-contact-title"
                  className="text-2xl font-light tracking-[-0.03em] sm:text-4xl"
                >
                  Inquiries{" "}
                  <span className="font-serif-editorial italic text-[#9A968E]">
                    & Press
                  </span>
                </h2>
                <p className="mt-1 text-xs text-[#9A968E]">
                  Partnerships, campus ambassadorships, or product questions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverlay("none")}
                className="rounded-full border border-[#F4F1EA]/25 bg-[#F4F1EA]/10 px-4 py-2 text-xs font-medium text-[#F4F1EA] transition-colors hover:bg-[#F4F1EA] hover:text-[#090908] cursor-pointer"
              >
                Close [Esc]
              </button>
            </div>

            {contact.status !== "success" ? (
              <form onSubmit={handleContactSubmit} className="mt-7 space-y-6">
                <div>
                  <span className="block text-xs font-medium text-[#9A968E]">
                    Select topic
                  </span>
                  <div className="mt-2.5 flex flex-wrap gap-2.5">
                    {(
                      [
                        { id: "marketing", label: "Partnerships" },
                        { id: "updates", label: "Product" },
                        { id: "press", label: "Press & Media" },
                      ] as const
                    ).map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setContactType(t.id)}
                        className={`rounded-full border px-5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                          contactType === t.id
                            ? "border-[#F4F1EA] bg-[#F4F1EA] text-[#090908]"
                            : "border-[#F4F1EA]/20 bg-white/[0.03] text-[#F4F1EA] hover:border-[#F4F1EA]/50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-medium text-[#9A968E]"
                  >
                    Your email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="mt-2 w-full rounded-xl border border-[#F4F1EA]/20 bg-white/[0.04] px-4 py-3 text-base text-[#F4F1EA] placeholder:text-[#9A968E]/60 focus:border-[#F4F1EA] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-medium text-[#9A968E]"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="How can we collaborate?"
                    className="mt-2 w-full rounded-xl border border-[#F4F1EA]/20 bg-white/[0.04] px-4 py-3 text-base text-[#F4F1EA] placeholder:text-[#9A968E]/60 focus:border-[#F4F1EA] focus:outline-none"
                  />
                </div>

                {contact.status === "error" && (
                  <p role="alert" className="text-xs text-[#E5534B]">
                    {contact.message}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#F4F1EA]/15 pt-5">
                  <span className="text-xs text-[#9A968E]">
                    Direct email:{" "}
                    <a
                      href="mailto:marketing@imdown.in"
                      className="font-medium text-[#F4F1EA] underline underline-offset-4"
                    >
                      marketing@imdown.in
                    </a>
                  </span>

                  <button
                    type="submit"
                    disabled={contact.status === "submitting"}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F4F1EA] px-7 py-3 text-xs font-semibold text-[#090908] transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    <span>
                      {contact.status === "submitting"
                        ? "Sending…"
                        : "Send message"}
                    </span>
                    <span>↗</span>
                  </button>
                </div>
              </form>
            ) : (
              <div role="status" className="my-12 space-y-3 text-center">
                <p className="font-serif-editorial italic text-4xl text-[#F4F1EA]">
                  Message received.
                </p>
                <p className="text-sm text-[#9A968E]">
                  Thank you for reaching out. Our team will respond shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setOverlay("none")}
                  className="mt-4 rounded-full border border-[#F4F1EA]/30 px-6 py-2.5 text-xs font-medium text-[#F4F1EA] hover:bg-[#F4F1EA] hover:text-[#090908] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* FULL-SCREEN OVERLAY 2: PRIVACY POLICY                             */}
      {/* ================================================================= */}
      {overlay === "privacy" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="overlay-privacy-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOverlay("none");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-10"
        >
          <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#F4F1EA]/20 bg-[#0D0D0C] p-6 text-[#F4F1EA] shadow-2xl sm:p-10">
            <div className="flex items-center justify-between border-b border-[#F4F1EA]/15 pb-6">
              <div>
                <h2
                  id="overlay-privacy-title"
                  className="text-2xl font-light tracking-[-0.03em] sm:text-4xl"
                >
                  Privacy{" "}
                  <span className="font-serif-editorial italic text-[#9A968E]">
                    Policy
                  </span>
                </h2>
                <p className="mt-1 text-xs text-[#9A968E]">
                  How we handle pre-launch waitlist and inquiry data on imdown.in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverlay("none")}
                className="rounded-full border border-[#F4F1EA]/25 bg-[#F4F1EA]/10 px-4 py-2 text-xs font-medium text-[#F4F1EA] transition-colors hover:bg-[#F4F1EA] hover:text-[#090908] cursor-pointer"
              >
                Close [Esc]
              </button>
            </div>

            <div className="mt-7 space-y-6 text-sm leading-relaxed text-[#C2BEB6]">
              <div>
                <h3 className="text-base font-medium text-[#F4F1EA]">
                  1. Minimal Data Collection
                </h3>
                <p className="mt-1.5">
                  When you join the <strong className="text-[#F4F1EA]">down.</strong>{" "}
                  waitlist or contact us, we collect only your email address and
                  notification preference.
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium text-[#F4F1EA]">
                  2. Release Communications
                </h3>
                <p className="mt-1.5">
                  Your email is used strictly to send your early-access
                  invitation and our official public launch announcement on{" "}
                  <strong className="text-[#F4F1EA]">November 25, 2026</strong>.
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium text-[#F4F1EA]">
                  3. Zero Third-Party Sharing
                </h3>
                <p className="mt-1.5">
                  We never sell, rent, or trade your personal information. Every
                  email includes a one-click unsubscribe link, and you can
                  request permanent deletion at any time by emailing{" "}
                  <a
                    href="mailto:community@imdown.in"
                    className="text-[#F4F1EA] underline underline-offset-4"
                  >
                    marketing@imdown.in
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#F4F1EA]/15 pt-5 text-xs">
              <button
                type="button"
                onClick={openContact}
                className="font-medium text-[#F4F1EA] underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                Have a privacy question? Contact us →
              </button>
              <button
                type="button"
                onClick={() => setOverlay("none")}
                className="rounded-full bg-[#F4F1EA] px-6 py-2.5 font-semibold text-[#090908] hover:opacity-90 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
