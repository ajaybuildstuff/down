"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// Milestones (IST / UTC+05:30)
const PROJECT_START_DATE = new Date("2026-10-01T00:00:00+05:30").getTime();
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

interface CountdownSnapshot {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  usernameDaysLeft: number;
  progressPercent: number;
}

function getCountdownSnapshot(): CountdownSnapshot {
  const now = Date.now();
  const diffLaunch = Math.max(0, LAUNCH_DATE - now);

  const d = Math.floor(diffLaunch / 86_400_000);
  const h = Math.floor((diffLaunch / 3_600_000) % 24);
  const m = Math.floor((diffLaunch / 60_000) % 60);
  const s = Math.floor((diffLaunch / 1000) % 60);

  const diffUsername = Math.max(0, USERNAME_OPEN_DATE - now);
  const usernameDaysLeft = Math.ceil(diffUsername / 86_400_000);

  const totalWindow = LAUNCH_DATE - PROJECT_START_DATE;
  const elapsed = Math.min(totalWindow, Math.max(0, now - PROJECT_START_DATE));
  const progressPercent = Math.min(
    100,
    Math.max(4, Math.round((elapsed / totalWindow) * 100))
  );

  return {
    days: String(d).padStart(2, "0"),
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
    usernameDaysLeft,
    progressPercent,
  };
}

/**
 * Studio-grade architectural backdrop.
 * Replaces the noisy green dot-ripple with an obsidian surface, top atmospheric
 * light cone, and a smooth cursor-tracked micro-grid illumination.
 */
function AmbientArchitectureBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let rafId = 0;
    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.35;
    let currentX = targetX;
    let currentY = targetY;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      el.style.setProperty("--spot-x", `${currentX.toFixed(1)}px`);
      el.style.setProperty("--spot-y", `${currentY.toFixed(1)}px`);
      rafId = window.requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={
        {
          "--spot-x": "50vw",
          "--spot-y": "35vh",
        } as React.CSSProperties
      }
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050506]"
    >
      {/* Top atmospheric light cone */}
      <div
        className="absolute inset-x-0 -top-48 h-[520px] opacity-70"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, rgba(212, 255, 112, 0.075) 0%, rgba(255, 255, 255, 0.025) 45%, transparent 100%)",
        }}
      />

      {/* Base architectural hairline grid (barely perceptible) */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 45%, #000 20%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 65% at 50% 45%, #000 20%, transparent 100%)",
        }}
      />

      {/* Interactive cursor-illuminated grid reveal */}
      <div
        className="absolute inset-0 opacity-[0.09] transition-opacity duration-500"
        style={{
          backgroundImage:
            "linear-gradient(to right, #d4ff70 1px, transparent 1px), linear-gradient(to bottom, #d4ff70 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(360px circle at var(--spot-x) var(--spot-y), #000 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(360px circle at var(--spot-x) var(--spot-y), #000 0%, transparent 100%)",
        }}
      />

      {/* Soft cursor ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(520px circle at var(--spot-x) var(--spot-y), rgba(255, 255, 255, 0.028), transparent 70%)",
        }}
      />
    </div>
  );
}

/**
 * Isolated monumental countdown component.
 * Re-renders independently every second without touching forms or modals.
 */
function MonumentalCountdown() {
  const [snapshot, setSnapshot] = useState<CountdownSnapshot | null>(null);

  useEffect(() => {
    const update = () => setSnapshot(getCountdownSnapshot());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const units = [
    { label: "DAYS", value: snapshot?.days ?? "--" },
    { label: "HOURS", value: snapshot?.hours ?? "--" },
    { label: "MINUTES", value: snapshot?.minutes ?? "--" },
    { label: "SECONDS", value: snapshot?.seconds ?? "--", isLive: true },
  ];

  return (
    <section
      aria-label="Global launch countdown"
      className="mt-10 w-full max-w-4xl"
    >
      <div className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0A0B0E]/90 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        {/* Top specular hairline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {/* Monumental 4-column readout */}
        <div className="grid grid-cols-2 divide-y divide-white/[0.06] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {units.map((unit, idx) => (
            <div
              key={unit.label}
              className={`relative flex flex-col items-center justify-center px-4 py-7 sm:px-8 sm:py-11 ${
                idx % 2 === 1 ? "border-l border-white/[0.06] sm:border-l-0" : ""
              }`}
            >
              <span
                className={`font-mono text-5xl font-semibold tracking-[-0.05em] leading-none tabular-nums sm:text-7xl md:text-[5.25rem] ${
                  unit.isLive
                    ? "text-[#D4FF70]"
                    : "bg-gradient-to-b from-white via-white to-white/65 bg-clip-text text-transparent"
                }`}
              >
                {unit.value}
              </span>
              <span className="mt-3.5 text-[10px] font-medium tracking-[0.24em] text-zinc-500 uppercase sm:text-[11px]">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        {/* Integrated Milestone & Progress Bar Footer */}
        <div className="border-t border-white/[0.06] bg-white/[0.015] px-5 py-3.5 sm:px-7">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-zinc-400 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4FF70] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D4FF70]" />
              </span>
              <span>
                Username claim opens{" "}
                <strong className="font-medium text-zinc-200">11 Nov</strong>
                {snapshot && snapshot.usernameDaysLeft > 0 ? (
                  <span className="ml-1.5 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-[#D4FF70]">
                    in {snapshot.usernameDaysLeft}d
                  </span>
                ) : null}
              </span>
            </div>

            <div className="flex items-center gap-2 text-zinc-500">
              <span>Full release</span>
              <span className="text-zinc-700">·</span>
              <strong className="font-mono text-[11px] font-medium tracking-tight text-zinc-200">
                25 NOV 2026
              </strong>
            </div>
          </div>

          {/* Subtle architectural timeline progress bar */}
          <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-white/40 to-[#D4FF70] transition-all duration-1000"
              style={{ width: `${snapshot?.progressPercent ?? 68}%` }}
            />
          </div>
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

  // Lock background scroll & handle Escape key for modals
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
        message: "Please enter a valid email address.",
      });
      return;
    }

    setWaitlistState({ status: "submitting" });

    try {
      // Primary insert with full metadata
      let { error } = await supabase.from("waitlist_subscribers").insert([
        {
          email: cleanEmail,
          marketing_opt_in: marketingOptIn,
          source: "down_prelaunch_2026_v2",
        },
      ]);

      // Resilient fallback: if the table schema only has an `email` column
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
          console.warn("Supabase waitlist error:", error);
          setWaitlistState({
            status: "error",
            message: "Unable to join right now. Please try again in a moment.",
          });
        }
      } else {
        setWaitlistState({ status: "success", duplicate: false });
      }
    } catch (err) {
      console.warn("Network error submitting waitlist:", err);
      setWaitlistState({
        status: "error",
        message: "Connection error. Please check your network and try again.",
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
        message: "Please enter both your email and a message.",
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
        console.warn("Supabase contact error:", error);
        setContactState({
          status: "error",
          message: "Unable to send your message right now. Please try again.",
        });
      } else {
        setContactState({ status: "success" });
        setContactEmail("");
        setContactMessage("");
      }
    } catch {
      setContactState({
        status: "error",
        message: "Connection error. Please check your network.",
      });
    }
  };

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#050506] font-sans text-[#F5F5F7] antialiased selection:bg-[#D4FF70] selection:text-black">
      {/* Prevent browser autofill from turning dark inputs white */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill {
          -webkit-text-fill-color: #F5F5F7 !important;
          -webkit-box-shadow: 0 0 0px 1000px #0B0C0F inset !important;
          transition: background-color 500000s ease-in-out 0s !important;
          caret-color: #F5F5F7 !important;
        }
      `}</style>

      {/* Subtle Studio Backdrop (No cheap dot-ripple) */}
      <AmbientArchitectureBackdrop />

      {/* Page Shell */}
      <div className="relative z-10 flex min-h-dvh flex-col justify-between">
        {/* Minimal Header */}
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-7 sm:px-10 sm:pt-9">
          <a
            href="#top"
            className="inline-flex items-center gap-0.5 text-lg font-semibold tracking-[-0.03em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF70]"
          >
            <span>down</span>
            <span className="text-[#D4FF70]">.</span>
          </a>

          <nav className="flex items-center gap-5 text-xs font-medium text-zinc-400">
            <button
              type="button"
              onClick={openContactModal}
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white cursor-pointer"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white cursor-pointer"
            >
              Privacy
            </button>
          </nav>
        </header>

        {/* Centerpiece Hero */}
        <main className="mx-auto my-auto flex w-full max-w-5xl flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-20">
          {/* Minimal Eyebrow */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4FF70]" />
            <span>Early access · November 2026</span>
          </div>

          {/* Editorial Headline */}
          <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl leading-[1.04]">
            A social space for{" "}
            <span className="text-[#D4FF70]">real life.</span>
          </h1>

          {/* Restrained Subheadline */}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
            Stay close to friends and make spontaneous plans—without feeds,
            metrics, or algorithmic noise.
          </p>

          {/* Big Architectural Countdown */}
          <MonumentalCountdown />

          {/* Minimalist Waitlist Command Bar */}
          <div className="mt-9 w-full max-w-md">
            {waitlistState.status !== "success" ? (
              <form
                onSubmit={handleEmailSubmit}
                noValidate
                className="space-y-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:rounded-2xl sm:border sm:border-white/[0.12] sm:bg-[#0B0C0F] sm:p-1.5 sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)] sm:focus-within:border-white/30 transition-colors">
                  <label htmlFor="waitlist-email" className="sr-only">
                    Email address
                  </label>
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
                    placeholder="Enter your email address"
                    aria-invalid={waitlistState.status === "error"}
                    aria-describedby={
                      waitlistState.status === "error"
                        ? "waitlist-error"
                        : undefined
                    }
                    className="min-h-12 w-full rounded-xl border border-white/[0.12] bg-[#0B0C0F] px-4 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none sm:min-h-10 sm:border-0 sm:bg-transparent sm:px-3.5 sm:py-2 sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={waitlistState.status === "submitting"}
                    className="min-h-12 shrink-0 rounded-xl bg-[#D4FF70] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[#dffb8e] active:scale-[0.99] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF70] sm:min-h-10 cursor-pointer"
                  >
                    {waitlistState.status === "submitting"
                      ? "Joining…"
                      : "Join waitlist"}
                  </button>
                </div>

                {waitlistState.status === "error" && (
                  <p
                    id="waitlist-error"
                    role="alert"
                    className="px-1 text-left text-xs font-medium text-rose-400"
                  >
                    {waitlistState.message}
                  </p>
                )}

                <div className="flex items-center justify-center pt-0.5 text-xs text-zinc-500">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none transition-colors hover:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-transparent accent-[#D4FF70]"
                    />
                    <span>Notify me when username registration opens</span>
                  </label>
                </div>
              </form>
            ) : (
              <div
                role="status"
                className="rounded-2xl border border-[#D4FF70]/25 bg-[#D4FF70]/[0.05] px-5 py-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4FF70]" />
                  <p className="text-sm font-medium text-white">
                    {waitlistState.duplicate
                      ? "You’re already on the waitlist."
                      : "You’re on the waitlist."}
                  </p>
                </div>
                <p className="mt-1.5 pl-3.5 text-xs leading-relaxed text-zinc-400">
                  We’ll send your early-access invite to{" "}
                  <span className="font-mono text-zinc-200">
                    {email.trim()}
                  </span>{" "}
                  before usernames open on{" "}
                  <strong className="font-medium text-zinc-200">
                    11 November
                  </strong>
                  .
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Whisper-Quiet Footer */}
        <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-white/[0.06] px-6 py-5 text-xs text-zinc-500 sm:px-10">
          <span>© 2026 down.</span>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={openContactModal}
              className="transition-colors hover:text-zinc-300 focus-visible:outline-none cursor-pointer"
            >
              Inquiries
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="transition-colors hover:text-zinc-300 focus-visible:outline-none cursor-pointer"
            >
              Privacy
            </button>
          </div>
        </footer>
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: CONTACT                                                  */}
      {/* ================================================================= */}
      {activeModal === "contact" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal("none");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0A0B0E] p-6 text-left shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div>
                <h2
                  id="contact-modal-title"
                  className="text-base font-semibold text-white"
                >
                  Contact us
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Partnerships, press, or product questions.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setActiveModal("none")}
                className="rounded-lg p-1 text-zinc-500 transition-colors hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {contactState.status !== "success" ? (
              <form onSubmit={handleContactSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-300">
                    Topic
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
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                          contactType === tab.id
                            ? "border-[#D4FF70]/50 bg-[#D4FF70]/10 text-[#D4FF70]"
                            : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white"
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
                    className="mb-1.5 block text-xs font-medium text-zinc-300"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    autoComplete="email"
                    spellCheck={false}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-white/12 bg-[#0B0C0F] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block text-xs font-medium text-zinc-300"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="How can we help?"
                    className="w-full rounded-xl border border-white/12 bg-[#0B0C0F] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none sm:text-sm"
                  />
                </div>

                {contactState.status === "error" && (
                  <p role="alert" className="text-xs font-medium text-rose-400">
                    {contactState.message}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <a
                    href="mailto:marketing@down.social"
                    className="text-xs text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-white"
                  >
                    marketing@down.social
                  </a>
                  <button
                    type="submit"
                    disabled={contactState.status === "submitting"}
                    className="rounded-xl bg-[#D4FF70] px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#dffb8e] disabled:opacity-50 cursor-pointer"
                  >
                    {contactState.status === "submitting"
                      ? "Sending…"
                      : "Send message"}
                  </button>
                </div>
              </form>
            ) : (
              <div role="status" className="my-6 text-center">
                <p className="text-sm font-semibold text-white">Message sent</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Thanks for reaching out. We’ll reply shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0A0B0E] p-6 text-left shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div>
                <h2
                  id="privacy-modal-title"
                  className="text-base font-semibold text-white"
                >
                  Privacy Policy
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Pre-launch waitlist & inquiry data.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setActiveModal("none")}
                className="rounded-lg p-1 text-zinc-500 transition-colors hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs leading-relaxed text-zinc-400">
              <div>
                <h3 className="font-medium text-white">1. Data we collect</h3>
                <p className="mt-1">
                  We collect only your email address and notification preference
                  when you join the waitlist or send an inquiry.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-white">2. How we use it</h3>
                <p className="mt-1">
                  Your email is used strictly to send your username claim invite
                  on <strong className="text-zinc-200">11 November 2026</strong>{" "}
                  and our release announcement on{" "}
                  <strong className="text-zinc-200">25 November 2026</strong>.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-white">3. Zero sharing</h3>
                <p className="mt-1">
                  We never sell or share your data with third parties. You can
                  unsubscribe or request deletion at any time.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
              <button
                type="button"
                onClick={openContactModal}
                className="text-xs font-medium text-[#D4FF70] hover:underline cursor-pointer"
              >
                Questions? Contact us →
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("privacy")}
                onClickCapture={() => setActiveModal("none")}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
