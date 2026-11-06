"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Target timestamps (IST / UTC+05:30)
const USERNAME_OPEN_DATE = new Date("2026-11-11T00:00:00+05:30").getTime();
const LAUNCH_DATE = new Date("2026-11-25T00:00:00+05:30").getTime();

type ActiveModal = "none" | "contact" | "privacy";
type ContactCategory = "marketing" | "updates" | "press";

type WaitlistSubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; duplicate: boolean }
  | { status: "error"; message: string };

type ContactSubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

interface TimeState {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  usernameDaysLeft: number;
  istClock: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function computeTimeState(): TimeState {
  const now = Date.now();
  const diffLaunch = Math.max(0, LAUNCH_DATE - now);

  const d = Math.floor(diffLaunch / 86_400_000);
  const h = Math.floor((diffLaunch / 3_600_000) % 24);
  const m = Math.floor((diffLaunch / 60_000) % 60);
  const s = Math.floor((diffLaunch / 1000) % 60);

  const diffUsername = Math.max(0, USERNAME_OPEN_DATE - now);
  const usernameDaysLeft = Math.ceil(diffUsername / 86_400_000);

  const istClock = new Intl.DateTimeFormat("en-GB", {
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
    usernameDaysLeft,
    istClock,
  };
}

/**
 * Single mechanical vertical reel digit (0-9).
 * Uses percentage-based vertical translation so it scales cleanly at any clamp() font size.
 */
function RollingDigit({ char }: { char: string }) {
  const numeric = Number.parseInt(char, 10);
  const isDigit = !Number.isNaN(numeric) && numeric >= 0 && numeric <= 9;

  if (!isDigit) {
    return (
      <span className="inline-flex h-[1em] items-center justify-center">
        {char}
      </span>
    );
  }

  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-bottom select-none">
      <span
        className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none will-change-transform"
        style={{
          transform: `translate3d(0, -${numeric * 10}%, 0)`,
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="flex h-[1em] items-center justify-center leading-none"
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function RollingPair({ value }: { value: string }) {
  const chars = value.split("");
  return (
    <span className="inline-flex items-center tracking-[-0.04em] tabular-nums">
      {chars.map((char, index) => (
        <RollingDigit key={index} char={char} />
      ))}
    </span>
  );
}

/**
 * Architectural Horology Centerpiece.
 * Isolates the 1-second timer so the rest of the page never re-renders.
 */
function ArchitecturalClock() {
  const [time, setTime] = useState<TimeState>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    usernameDaysLeft: 5,
    istClock: "--:--:--",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger initial roll-in animation shortly after mount
    const initialTimer = window.setTimeout(() => {
      setMounted(true);
      setTime(computeTimeState());
    }, 40);

    const interval = window.setInterval(() => {
      setTime(computeTimeState());
    }, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

  const cells = [
    { index: "01", label: "DAYS", value: time.days },
    { index: "02", label: "HOURS", value: time.hours },
    { index: "03", label: "MINUTES", value: time.minutes },
    { index: "04", label: "SECONDS", value: time.seconds, highlight: true },
  ];

  return (
    <section aria-label="Launch countdown" className="w-full">
      {/* Sub-header telemetry bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-5 py-2.5 font-mono text-[11px] tracking-[0.08em] text-[#7A7A75] uppercase sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D9FF54] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D9FF54]" />
          </span>
          <span className="text-[#EDEDEA]">Countdown to Public Release</span>
        </div>
        <div className="flex items-center gap-4">
          <span>IST {mounted ? time.istClock : "--:--:--"}</span>
          <span className="hidden text-white/20 sm:inline">/</span>
          <span className="hidden sm:inline">25.11.2026</span>
        </div>
      </div>

      {/* Monumental 4-Column Timepiece */}
      <div className="grid grid-cols-2 divide-y divide-white/[0.08] border-b border-white/[0.08] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {cells.map((cell, i) => (
          <div
            key={cell.label}
            className={`group relative flex flex-col justify-between px-5 py-7 sm:px-10 sm:py-12 ${
              i % 2 === 1 ? "border-l border-white/[0.08] lg:border-l-0" : ""
            }`}
          >
            {/* Top cell metadata */}
            <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.14em] text-[#7A7A75]">
              <span>[{cell.index}]</span>
              <span
                className={
                  cell.highlight ? "text-[#D9FF54]" : "text-[#7A7A75]"
                }
              >
                {cell.label}
              </span>
            </div>

            {/* Giant Rolling Numerals */}
            <div
              className={`my-6 flex items-baseline justify-start font-mono text-[clamp(4.25rem,12vw,9.25rem)] font-medium leading-none tracking-[-0.05em] sm:my-8 ${
                cell.highlight ? "text-[#D9FF54]" : "text-[#EDEDEA]"
              }`}
            >
              <RollingPair value={cell.value} />
            </div>

            {/* Bottom tick rule */}
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-[10px] tracking-[0.12em] text-[#565652] uppercase">
              <span>UNIT // {cell.label.slice(0, 3)}</span>
              <span>{cell.highlight ? "LIVE TICK" : "SYNCED"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two-Phase Schedule Ledger */}
      <div className="grid grid-cols-1 divide-y divide-white/[0.08] border-b border-white/[0.08] bg-white/[0.01] font-mono text-xs sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 bg-[#D9FF54]" />
            <span className="text-[#7A7A75]">PHASE 01</span>
            <span className="text-[#EDEDEA]">Username Reservation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#EDEDEA]">11 NOV</span>
            {mounted && time.usernameDaysLeft > 0 && (
              <span className="border border-[#D9FF54]/30 bg-[#D9FF54]/10 px-1.5 py-0.5 text-[10px] text-[#D9FF54]">
                T-{time.usernameDaysLeft}D
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 bg-white/30" />
            <span className="text-[#7A7A75]">PHASE 02</span>
            <span className="text-[#EDEDEA]">Global App Launch</span>
          </div>
          <span className="text-[#7A7A75]">25 NOV 2026</span>
        </div>
      </div>
    </section>
  );
}

export default function DownPrelaunchPage() {
  // Waitlist state
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [waitlistState, setWaitlistState] = useState<WaitlistSubmissionState>({
    status: "idle",
  });

  // Modal & Contact state
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const [contactType, setContactType] = useState<ContactCategory>("marketing");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactState, setContactState] = useState<ContactSubmissionState>({
    status: "idle",
  });

  // Lock background scroll & bind Escape key when a modal is open
  useEffect(() => {
    if (activeModal === "none") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal("none");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModal]);

  const openContactModal = () => {
    setContactState({ status: "idle" });
    setActiveModal("contact");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setWaitlistState({
        status: "error",
        message: "Enter a valid email address.",
      });
      return;
    }

    setWaitlistState({ status: "submitting" });

    try {
      let { error } = await supabase.from("waitlist_subscribers").insert([
        {
          email: cleanEmail,
          marketing_opt_in: marketingOptIn,
          source: "down_prelaunch_2026_v3",
        },
      ]);

      // Fallback if table only has `email` column
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
          setWaitlistState({ status: "success", duplicate: true });
        } else {
          setWaitlistState({
            status: "error",
            message: "Request failed. Please try again shortly.",
          });
        }
      } else {
        setWaitlistState({ status: "success", duplicate: false });
      }
    } catch {
      setWaitlistState({
        status: "error",
        message: "Network error. Check your connection.",
      });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = contactEmail.trim().toLowerCase();
    const cleanMessage = contactMessage.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !cleanMessage) {
      setContactState({
        status: "error",
        message: "Provide both a valid email and message.",
      });
      return;
    }

    setContactState({ status: "submitting" });

    try {
      const { error } = await supabase.from("contact_inquiries").insert([
        {
          inquiry_type: contactType,
          email: cleanEmail,
          message: cleanMessage,
        },
      ]);

      if (error) {
        setContactState({
          status: "error",
          message: "Could not send message. Try again.",
        });
      } else {
        setContactState({ status: "success" });
        setContactEmail("");
        setContactMessage("");
      }
    } catch {
      setContactState({
        status: "error",
        message: "Network error. Check your connection.",
      });
    }
  };

  return (
    <div className="relative min-h-dvh w-full bg-[#080808] font-sans text-[#EDEDEA] antialiased selection:bg-[#D9FF54] selection:text-black">
      {/* Keep browser autofill strictly dark */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill {
          -webkit-text-fill-color: #EDEDEA !important;
          -webkit-box-shadow: 0 0 0px 1000px #0C0C0C inset !important;
          transition: background-color 500000s ease-in-out 0s !important;
          caret-color: #D9FF54 !important;
        }
      `}</style>

      {/* Subtle static anodized film grain (zero cheap moving shaders) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Full-Viewport Architectural Frame */}
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1440px] flex-col justify-between border-x border-white/[0.08]">
        {/* Top Structural Bar */}
        <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5 sm:px-10">
          <a
            href="#top"
            className="text-xl font-semibold tracking-[-0.04em] text-[#EDEDEA] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D9FF54]"
          >
            down<span className="text-[#D9FF54]">.</span>
          </a>

          <div className="hidden items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-[#7A7A75] uppercase md:flex">
            <span>SOCIAL UTILITY</span>
            <span className="text-white/20">//</span>
            <span>PRE-RELEASE BUILD</span>
          </div>

          <nav className="flex items-center gap-6 font-mono text-xs tracking-[0.06em] text-[#7A7A75] uppercase">
            <button
              type="button"
              onClick={openContactModal}
              className="transition-colors hover:text-[#EDEDEA] focus-visible:text-[#EDEDEA] focus-visible:outline-none cursor-pointer"
            >
              Inquiries
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="transition-colors hover:text-[#EDEDEA] focus-visible:text-[#EDEDEA] focus-visible:outline-none cursor-pointer"
            >
              Privacy
            </button>
          </nav>
        </header>

        {/* Center Stage: Monumental Horology + Editorial Split */}
        <main className="my-auto flex flex-col">
          {/* 1. Giant Kinetic Countdown */}
          <ArchitecturalClock />

          {/* 2. Asymmetric Editorial Split: Manifesto (Left) + Waitlist Terminal (Right) */}
          <div className="grid grid-cols-1 divide-y divide-white/[0.08] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            {/* Left Column: Minimalist Positioning */}
            <div className="flex flex-col justify-between px-5 py-10 sm:px-10 sm:py-14 lg:col-span-7">
              <div className="font-mono text-[11px] tracking-[0.14em] text-[#7A7A75] uppercase">
                [00] MANIFESTO
              </div>

              <div className="mt-6 max-w-xl">
                <h1 className="text-3xl font-medium tracking-[-0.035em] text-[#EDEDEA] sm:text-5xl leading-[1.08]">
                  Real life, off the feed.
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-[#8E8E88] sm:text-base">
                  A private social utility for spontaneous plans with your
                  actual friends. No public follower counts, no algorithmic
                  performative feeds, and no noise.
                </p>
              </div>
            </div>

            {/* Right Column: Waitlist Access Terminal */}
            <div className="flex flex-col justify-between bg-white/[0.01] px-5 py-10 sm:px-10 sm:py-14 lg:col-span-5">
              <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.14em] text-[#7A7A75] uppercase">
                <span>[05] EARLY ACCESS QUEUE</span>
                <span className="text-[#EDEDEA]">OPEN</span>
              </div>

              <div className="mt-6">
                {waitlistState.status !== "success" ? (
                  <form
                    onSubmit={handleEmailSubmit}
                    noValidate
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="waitlist-email" className="sr-only">
                        Email address
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <input
                          id="waitlist-email"
                          type="email"
                          required
                          autoComplete="email"
                          spellCheck={false}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (waitlistState.status === "error") {
                              setWaitlistState({ status: "idle" });
                            }
                          }}
                          placeholder="name@domain.com"
                          aria-invalid={waitlistState.status === "error"}
                          aria-describedby={
                            waitlistState.status === "error"
                              ? "waitlist-error"
                              : undefined
                          }
                          className="min-h-12 flex-1 border border-white/[0.14] bg-[#0C0C0C] px-4 py-3 font-mono text-base text-[#EDEDEA] placeholder:text-[#565652] focus:border-[#D9FF54] focus:outline-none sm:text-sm"
                        />
                        <button
                          type="submit"
                          disabled={waitlistState.status === "submitting"}
                          className="min-h-12 shrink-0 bg-[#EDEDEA] px-6 py-3 font-mono text-xs font-semibold tracking-[0.1em] text-[#080808] uppercase transition-colors hover:bg-[#D9FF54] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9FF54] cursor-pointer"
                        >
                          {waitlistState.status === "submitting"
                            ? "Wait…"
                            : "Reserve →"}
                        </button>
                      </div>
                    </div>

                    {waitlistState.status === "error" && (
                      <p
                        id="waitlist-error"
                        role="alert"
                        className="font-mono text-xs text-[#FF5A36]"
                      >
                        ! {waitlistState.message}
                      </p>
                    )}

                    <label className="inline-flex items-center gap-2.5 text-xs text-[#7A7A75] cursor-pointer select-none hover:text-[#EDEDEA] transition-colors">
                      <input
                        type="checkbox"
                        checked={marketingOptIn}
                        onChange={(e) => setMarketingOptIn(e.target.checked)}
                        className="h-3.5 w-3.5 rounded-none border border-white/25 bg-transparent accent-[#D9FF54]"
                      />
                      <span>
                        Send me an invite when username claims open on 11 Nov
                      </span>
                    </label>
                  </form>
                ) : (
                  <div
                    role="status"
                    className="border border-[#D9FF54]/30 bg-[#D9FF54]/[0.04] p-5"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.12em] text-[#D9FF54] uppercase">
                      <span>
                        {waitlistState.duplicate
                          ? "STATUS // ALREADY REGISTERED"
                          : "STATUS // CONFIRMED"}
                      </span>
                      <span>[OK]</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#A0A09A]">
                      Dispatched reservation for{" "}
                      <span className="font-mono text-[#EDEDEA]">
                        {email.trim()}
                      </span>
                      . You will receive your claim key prior to{" "}
                      <strong className="font-normal text-[#EDEDEA]">
                        11 November 2026
                      </strong>
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Minimalist Structural Footer */}
        <footer className="flex flex-col items-start justify-between gap-3 border-t border-white/[0.08] px-5 py-4 font-mono text-[11px] tracking-[0.08em] text-[#565652] uppercase sm:flex-row sm:items-center sm:px-10">
          <div>© 2026 DOWN INC. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={openContactModal}
              className="transition-colors hover:text-[#EDEDEA] cursor-pointer"
            >
              PARTNERSHIPS & PRESS
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="transition-colors hover:text-[#EDEDEA] cursor-pointer"
            >
              PRIVACY
            </button>
          </div>
        </footer>
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: INQUIRIES                                                */}
      {/* ================================================================= */}
      {activeModal === "contact" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal("none");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto border border-white/15 bg-[#0A0A0A] p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#7A7A75] uppercase">
                  DIRECT CHANNEL
                </span>
                <h2
                  id="contact-modal-title"
                  className="mt-0.5 text-lg font-medium text-[#EDEDEA]"
                >
                  Inquiries & Press
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setActiveModal("none")}
                className="border border-white/10 px-2.5 py-1 font-mono text-[11px] text-[#7A7A75] transition-colors hover:border-white/30 hover:text-[#EDEDEA] cursor-pointer"
              >
                ESC
              </button>
            </div>

            {contactState.status !== "success" ? (
              <form onSubmit={handleContactSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block font-mono text-[11px] tracking-[0.1em] text-[#7A7A75] uppercase">
                    Department
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "marketing", label: "Partnerships" },
                        { id: "updates", label: "Product" },
                        { id: "press", label: "Press" },
                      ] as const
                    ).map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setContactType(tab.id)}
                        className={`border py-2.5 font-mono text-xs uppercase transition-colors cursor-pointer ${
                          contactType === tab.id
                            ? "border-[#D9FF54] bg-[#D9FF54]/10 text-[#D9FF54]"
                            : "border-white/10 bg-[#0E0E0E] text-[#7A7A75] hover:text-[#EDEDEA]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-2 block font-mono text-[11px] tracking-[0.1em] text-[#7A7A75] uppercase"
                  >
                    Return Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    autoComplete="email"
                    spellCheck={false}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full border border-white/15 bg-[#0C0C0C] px-3.5 py-2.5 font-mono text-base text-[#EDEDEA] placeholder:text-[#565652] focus:border-[#D9FF54] focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block font-mono text-[11px] tracking-[0.1em] text-[#7A7A75] uppercase"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Write your message..."
                    className="w-full border border-white/15 bg-[#0C0C0C] px-3.5 py-2.5 text-base text-[#EDEDEA] placeholder:text-[#565652] focus:border-[#D9FF54] focus:outline-none sm:text-sm"
                  />
                </div>

                {contactState.status === "error" && (
                  <p role="alert" className="font-mono text-xs text-[#FF5A36]">
                    ! {contactState.message}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                  <a
                    href="mailto:marketing@down.social"
                    className="font-mono text-xs text-[#7A7A75] underline underline-offset-4 hover:text-[#EDEDEA]"
                  >
                    marketing@down.social
                  </a>
                  <button
                    type="submit"
                    disabled={contactState.status === "submitting"}
                    className="bg-[#EDEDEA] px-6 py-2.5 font-mono text-xs font-semibold tracking-[0.08em] text-[#080808] uppercase transition-colors hover:bg-[#D9FF54] disabled:opacity-50 cursor-pointer"
                  >
                    {contactState.status === "submitting"
                      ? "Sending…"
                      : "Transmit →"}
                  </button>
                </div>
              </form>
            ) : (
              <div role="status" className="my-8 space-y-3">
                <div className="font-mono text-xs text-[#D9FF54] uppercase">
                  [TRANSMISSION RECEIVED]
                </div>
                <p className="text-sm text-[#A0A09A]">
                  Thank you. Our team has logged your inquiry and will respond
                  directly via email.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="mt-4 border border-white/15 px-5 py-2 font-mono text-xs text-[#EDEDEA] uppercase hover:border-white/40 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: PRIVACY                                                  */}
      {/* ================================================================= */}
      {activeModal === "privacy" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal("none");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[85dvh] w-full max-w-lg overflow-y-auto border border-white/15 bg-[#0A0A0A] p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#7A7A75] uppercase">
                  DATA GOVERNANCE
                </span>
                <h2
                  id="privacy-modal-title"
                  className="mt-0.5 text-lg font-medium text-[#EDEDEA]"
                >
                  Privacy Policy
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setActiveModal("none")}
                className="border border-white/10 px-2.5 py-1 font-mono text-[11px] text-[#7A7A75] transition-colors hover:border-white/30 hover:text-[#EDEDEA] cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="mt-6 space-y-5 text-xs leading-relaxed text-[#A0A09A]">
              <div>
                <div className="font-mono text-[11px] text-[#EDEDEA] uppercase">
                  01 // Collection Scope
                </div>
                <p className="mt-1.5">
                  During pre-release, <strong className="text-[#EDEDEA]">down.</strong>{" "}
                  collects only your email address and notification preference
                  when you reserve access or submit an inquiry.
                </p>
              </div>

              <div>
                <div className="font-mono text-[11px] text-[#EDEDEA] uppercase">
                  02 // Usage Schedule
                </div>
                <p className="mt-1.5">
                  Your email is used strictly to dispatch your username claim
                  invitation on{" "}
                  <strong className="text-[#EDEDEA]">11 November 2026</strong>{" "}
                  and the release notice on{" "}
                  <strong className="text-[#EDEDEA]">25 November 2026</strong>.
                </p>
              </div>

              <div>
                <div className="font-mono text-[11px] text-[#EDEDEA] uppercase">
                  03 // Zero Brokerage
                </div>
                <p className="mt-1.5">
                  We do not sell, rent, or share waitlist records with third
                  parties. You may revoke access or request permanent deletion
                  at any time.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={openContactModal}
                className="font-mono text-xs text-[#D9FF54] uppercase hover:underline cursor-pointer"
              >
                Contact DPO →
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("none")}
                className="border border-white/15 px-5 py-2 font-mono text-xs text-[#EDEDEA] uppercase hover:border-white/40 cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
