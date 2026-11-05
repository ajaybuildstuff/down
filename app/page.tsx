"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DotDistortionShader } from "@/components/DotDistortionShader";

const USERNAME_OPEN_DATE = new Date("2026-11-11T00:00:00+05:30").getTime();
const LAUNCH_DATE = new Date("2026-11-25T00:00:00+05:30").getTime();

type ActiveModal = "none" | "contact" | "privacy";

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export default function DownPrelaunchPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Countdown states
  const [launchTimeLeft, setLaunchTimeLeft] = useState<TimeLeft>({
    days: "19",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [usernameDaysLeft, setUsernameDaysLeft] = useState<number>(5);

  // Supabase Email Waitlist states
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Supabase Contact Modal states
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const [contactType, setContactType] = useState<"marketing" | "updates" | "press">("marketing");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Smooth preloader reveal
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 450);
    return () => clearTimeout(timer);
  }, []);

  // Live Countdown Timer (11 Nov 2026 & 25 Nov 2026)
  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now();

      const diffLaunch = Math.max(0, LAUNCH_DATE - now);
      const d = Math.floor(diffLaunch / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffLaunch / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diffLaunch / 1000 / 60) % 60);
      const s = Math.floor((diffLaunch / 1000) % 60);

      setLaunchTimeLeft({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });

      const diffUsername = Math.max(0, USERNAME_OPEN_DATE - now);
      setUsernameDaysLeft(Math.ceil(diffUsername / (1000 * 60 * 60 * 24)));
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = activeModal !== "none" ? "hidden" : "";
  }, [activeModal]);

  // Live Supabase Insert for Email Collection
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    setIsSubmitting(true);
    setEmailError(null);
    setAlreadyRegistered(false);

    try {
      const { error } = await supabase.from("waitlist_subscribers").insert([
        {
          email: cleanEmail,
          marketing_opt_in: marketingOptIn,
          source: "down_prelaunch_2026",
        },
      ]);

      if (error) {
        // Postgres unique violation code (email already exists)
        if (error.code === "23505") {
          setAlreadyRegistered(true);
          setIsSubscribed(true);
        } else {
          setEmailError("Could not save your email right now. Please try again.");
        }
      } else {
        setIsSubscribed(true);
      }
    } catch {
      setEmailError("Network error occurred. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live Supabase Insert for Marketing / Contact Inquiries
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = contactEmail.trim().toLowerCase();
    const cleanMessage = contactMessage.trim();
    if (!cleanEmail || !cleanMessage) return;

    setIsSendingContact(true);
    setContactError(null);

    try {
      const { error } = await supabase.from("contact_inquiries").insert([
        {
          inquiry_type: contactType,
          email: cleanEmail,
          message: cleanMessage,
        },
      ]);

      if (error) {
        setContactError("Unable to send message. Please try again shortly.");
      } else {
        setContactSent(true);
        setContactEmail("");
        setContactMessage("");
      }
    } catch {
      setContactError("Network error. Please check your connection.");
    } finally {
      setIsSendingContact(false);
    }
  };

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#050609] text-white selection:bg-[#d9f99d] selection:text-slate-950 font-sans antialiased">
      {/* Smooth Preloader */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050609] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isLoaded
            ? "pointer-events-none opacity-0 scale-105"
            : "opacity-100 scale-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-tr from-[#d9f99d] via-[#38bdf8] to-[#f97316] animate-ping" />
          <span className="text-3xl font-bold tracking-tighter text-white">
            down<span className="text-[#d9f99d]">.</span>
          </span>
        </div>
        <div className="mt-4 h-0.5 w-28 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full origin-left animate-pulse bg-gradient-to-r from-[#d9f99d] via-[#38bdf8] to-[#3b82f6]" />
        </div>
      </div>

      {/* Interactive Shader & Colir Gradients (Chunk 1) */}
      <DotDistortionShader />

      {/* Main Responsive Layout */}
      <div
        className={`relative z-10 flex min-h-dvh flex-col justify-between transition-all duration-1000 delay-150 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        {/* Top Header */}
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 sm:px-8 sm:pt-8">
          <a href="#top" className="group flex items-center gap-2.5 focus:outline-none">
            <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-tr from-[#d9f99d] via-[#38bdf8] to-[#2563eb] transition-transform duration-300 group-hover:scale-125 shadow-[0_0_18px_rgba(56,189,248,0.75)]" />
            <span className="text-2xl font-bold tracking-tighter text-white sm:text-3xl">
              down<span className="text-[#d9f99d]">.</span>
            </span>
          </a>

          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setContactSent(false);
                setContactError(null);
                setActiveModal("contact");
              }}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/[0.09] hover:text-white active:scale-95 cursor-pointer"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/[0.09] hover:text-white active:scale-95 cursor-pointer"
            >
              Privacy
            </button>
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#d9f99d]/25 bg-[#d9f99d]/10 px-3.5 py-1.5 text-xs font-medium text-[#d9f99d] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d9f99d] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d9f99d]" />
              </span>
              <span>Live 25 Nov 2026</span>
            </div>
          </nav>
        </header>

        {/* Centerpiece Hero */}
        <main className="mx-auto my-auto flex w-full max-w-4xl flex-col items-center px-5 py-10 text-center sm:px-8 sm:py-14">
          {/* 11 November 2026 Milestone Badge */}
          <div className="mb-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[11px] sm:text-xs font-medium text-neutral-200 backdrop-blur-xl shadow-sm">
            <span className="rounded-full bg-gradient-to-r from-[#d9f99d] to-[#38bdf8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
              Phase 01
            </span>
            <span>
              Initial username collection opens{" "}
              <strong className="text-white font-semibold">11 November 2026</strong>
            </span>
            {usernameDaysLeft > 0 && (
              <span className="font-mono text-[#38bdf8]">({usernameDaysLeft}d left)</span>
            )}
          </div>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl leading-[1.06]">
            A new social space,{" "}
            <span className="bg-gradient-to-r from-[#d9f99d] via-[#38bdf8] to-[#fb923c] bg-clip-text text-transparent">
              built for real life.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-400 sm:mt-5 sm:text-base md:text-lg">
            Unfiltered connection without algorithmic clutter. Subscribe for
            official launch updates, marketing announcements, and your early
            access alert when username registration opens on{" "}
            <span className="text-neutral-200 font-medium">11 November</span>{" "}
            ahead of our global release on{" "}
            <span className="text-neutral-200 font-medium">25 November 2026</span>.
          </p>

          {/* 25 November 2026 Countdown Grid */}
          <div className="mt-8 w-full max-w-2xl sm:mt-10">
            <div className="mb-2.5 flex items-center justify-between px-1 text-[11px] font-medium tracking-widest text-neutral-400 uppercase">
              <span>Global Launch Countdown</span>
              <span className="font-mono text-[#d9f99d]">25 · 11 · 2026</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
              {[
                { label: "DAYS", value: launchTimeLeft.days },
                { label: "HOURS", value: launchTimeLeft.hours },
                { label: "MINUTES", value: launchTimeLeft.minutes },
                { label: "SECONDS", value: launchTimeLeft.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-4 sm:px-6 sm:py-6 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-[#38bdf8]/40 hover:bg-white/[0.06]"
                >
                  <div className="pointer-events-none absolute -top-10 h-16 w-16 rounded-full bg-[#38bdf8]/15 blur-xl transition-opacity opacity-0 group-hover:opacity-100" />
                  <span className="font-mono text-2xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl tabular-nums">
                    {unit.value}
                  </span>
                  <span className="mt-1.5 text-[9px] sm:text-[10px] font-semibold tracking-[0.22em] text-neutral-400">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Phase Schedule Cards */}
          <div className="mt-5 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-left backdrop-blur-md">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#d9f99d]">
                  Step 01 · Username Window
                </p>
                <p className="text-xs font-medium text-neutral-200">
                  Initial Username Collection
                </p>
              </div>
              <span className="rounded-md bg-white/[0.06] px-2.5 py-1 font-mono text-xs font-semibold text-white">
                11 Nov 2026
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-left backdrop-blur-md">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#38bdf8]">
                  Step 02 · Platform Goes Live
                </p>
                <p className="text-xs font-medium text-neutral-200">
                  Official Public Launch
                </p>
              </div>
              <span className="rounded-md bg-white/[0.06] px-2.5 py-1 font-mono text-xs font-semibold text-white">
                25 Nov 2026
              </span>
            </div>
          </div>

          {/* Live Supabase Email Collection Form */}
          <div className="mt-8 w-full max-w-lg sm:mt-10">
            {!isSubscribed ? (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 rounded-2xl sm:rounded-full border border-white/15 bg-white/[0.05] p-1.5 backdrop-blur-2xl transition-all duration-300 focus-within:border-[#38bdf8]/70 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_35px_-5px_rgba(56,189,248,0.35)]">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for launch & marketing updates..."
                    className="w-full bg-transparent px-4 py-3 sm:py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="shrink-0 rounded-xl sm:rounded-full bg-gradient-to-r from-[#d9f99d] via-[#38bdf8] to-[#3b82f6] px-6 py-3 sm:py-2.5 text-xs font-bold tracking-wide text-slate-950 shadow-sm transition-all duration-200 hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Saving..." : "Notify Me →"}
                  </button>
                </div>

                {emailError && (
                  <p className="text-xs font-medium text-rose-400">{emailError}</p>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-[11px] text-neutral-400">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/10 accent-[#38bdf8]"
                    />
                    <span>
                      Receive marketing emails, news & the 11 Nov username alert
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveModal("privacy")}
                    className="underline decoration-white/30 underline-offset-4 hover:text-white cursor-pointer"
                  >
                    Privacy & Email Policy
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-[#d9f99d]/40 bg-[#d9f99d]/10 px-6 py-4 text-center backdrop-blur-xl">
                <p className="text-sm font-semibold text-[#d9f99d]">
                  {alreadyRegistered
                    ? "You're already on the official dispatch list!"
                    : "You're on the official dispatch list."}
                </p>
                <p className="mt-1 text-xs text-neutral-300">
                  We&apos;ve saved <span className="font-mono text-white">{email}</span> for
                  product updates and marketing alerts. Watch your inbox on{" "}
                  <strong className="text-white">11 November 2026</strong> when
                  initial username collection opens.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mx-auto flex w-full max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 px-5 py-6 text-xs text-neutral-400 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">down.</span>
            <span>© 2026 All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => {
                setContactSent(false);
                setContactError(null);
                setActiveModal("contact");
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Marketing & Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="font-mono text-[11px] text-neutral-500">
              Touch or move cursor to ripple
            </span>
          </div>
        </footer>
      </div>

      {/* ================================================================== */}
      {/* MODAL 1: CONTACT FOR MARKETING, PRESS & UPDATES (SUPABASE LIVE)    */}
      {/* ================================================================== */}
      {activeModal === "contact" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0b0d13]/95 p-6 sm:p-8 text-left shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#38bdf8]">
                  Direct Channel
                </span>
                <h2 className="text-xl font-bold text-white">
                  Contact & Marketing Inquiries
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal("none")}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 hover:bg-white/15 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {!contactSent ? (
              <form onSubmit={handleContactSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2">
                    Inquiry Topic
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "marketing", label: "Marketing & Collabs" },
                      { id: "updates", label: "Email Updates" },
                      { id: "press", label: "Press & Media" },
                    ].map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() =>
                          setContactType(tab.id as "marketing" | "updates" | "press")
                        }
                        className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                          contactType === tab.id
                            ? "border-[#d9f99d]/60 bg-[#d9f99d]/15 text-[#d9f99d]"
                            : "border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Tell us about your marketing partnership, campaign idea, or question regarding our email updates..."
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>

                {contactError && (
                  <p className="text-xs font-medium text-rose-400">{contactError}</p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-neutral-400">
                    Direct: <strong className="text-neutral-200">marketing@down.social</strong>
                  </span>
                  <button
                    type="submit"
                    disabled={isSendingContact}
                    className="rounded-full bg-gradient-to-r from-[#d9f99d] via-[#38bdf8] to-[#3b82f6] px-6 py-2.5 text-xs font-bold text-slate-950 hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingContact ? "Sending..." : "Send Message →"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="my-6 rounded-2xl border border-[#d9f99d]/30 bg-[#d9f99d]/10 p-6 text-center">
                <p className="text-base font-bold text-[#d9f99d]">Message Saved</p>
                <p className="mt-1.5 text-xs text-neutral-300">
                  Your inquiry has been logged in our system. Our marketing and
                  communications team will reply shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="mt-4 rounded-full bg-white/10 px-5 py-2 text-xs font-medium text-white hover:bg-white/20 cursor-pointer"
                >
                  Back to Countdown
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 2: PRIVACY & MARKETING EMAIL POLICY                          */}
      {/* ================================================================== */}
      {activeModal === "privacy" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0b0d13]/95 p-6 sm:p-8 text-left shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d9f99d]">
                  Data & Email Transparency
                </span>
                <h2 className="text-xl font-bold text-white">
                  Privacy & Communications Policy
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal("none")}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300 hover:bg-white/15 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs sm:text-sm leading-relaxed text-neutral-300">
              <div>
                <h3 className="font-semibold text-white">
                  1. What We Collect During Pre-Launch
                </h3>
                <p className="mt-1 text-neutral-400">
                  Prior to our public launch on <strong>25 November 2026</strong>,{" "}
                  <strong>down.</strong> collects only your email address,
                  timestamp, and communication preferences when you voluntarily
                  subscribe or submit a message via our Contact form.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  2. Marketing & Milestone Update Emails
                </h3>
                <p className="mt-1 text-neutral-400">
                  Your email address is securely stored with Row-Level Security
                  and used strictly to send you:
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-neutral-400">
                  <li>
                    An immediate alert when initial username collection opens on{" "}
                    <strong className="text-white">11 November 2026</strong>.
                  </li>
                  <li>
                    Official launch access on{" "}
                    <strong className="text-white">25 November 2026</strong>.
                  </li>
                  <li>
                    Curated marketing announcements, feature previews, and
                    community updates (when opted in).
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  3. Zero Third-Party Selling & Instant Removal
                </h3>
                <p className="mt-1 text-neutral-400">
                  We never sell or trade your email address. Every marketing or
                  update email includes a one-click unsubscribe link, or you can
                  request immediate deletion anytime via our Contact modal.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setContactSent(false);
                  setContactError(null);
                  setActiveModal("contact");
                }}
                className="text-xs font-medium text-[#38bdf8] hover:underline cursor-pointer"
              >
                Questions about marketing or privacy? Contact us →
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("none")}
                className="rounded-full bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer"
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
