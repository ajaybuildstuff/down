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
    const timer = setTimeout(() => setIsLoaded(true), 350);
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
          source: "down_prelaunch_2026_v2",
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          setAlreadyRegistered(true);
          setIsSubscribed(true);
        } else {
          setEmailError("Unable to register your email. Please try again.");
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
        setContactError("Unable to dispatch message. Please try again shortly.");
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
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#030407] text-white selection:bg-cyan-400 selection:text-black font-sans antialiased">
      {/* Cinematic Entry Preloader */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030407] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLoaded
            ? "pointer-events-none opacity-0 scale-105"
            : "opacity-100 scale-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse" />
          <span className="text-2xl font-bold tracking-tighter text-white">
            down<span className="text-cyan-400">.</span>
          </span>
        </div>
      </div>

      {/* Interactive Dot Distortion Shader & Mesh Gradients */}
      <DotDistortionShader />

      {/* Main UI Wrapper */}
      <div
        className={`relative z-10 flex min-h-dvh flex-col justify-between transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {/* Navigation Header */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-8 sm:px-12 sm:pt-10">
          <a href="#top" className="group flex items-center gap-2.5 focus:outline-none">
            <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-tr from-lime-400 via-cyan-400 to-indigo-500 transition-transform duration-300 group-hover:scale-125 shadow-[0_0_20px_rgba(56,189,248,0.7)]" />
            <span className="text-2xl font-extrabold tracking-tighter text-white">
              down<span className="text-cyan-400">.</span>
            </span>
          </a>

          <nav className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setContactSent(false);
                setContactError(null);
                setActiveModal("contact");
              }}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-neutral-300 backdrop-blur-xl transition-all duration-200 hover:border-white/25 hover:bg-white/[0.07] hover:text-white active:scale-95 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-neutral-300 backdrop-blur-xl transition-all duration-200 hover:border-white/25 hover:bg-white/[0.07] hover:text-white active:scale-95 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              Privacy
            </button>
            <div className="hidden sm:inline-flex items-center gap-2.5 rounded-full border border-lime-400/20 bg-lime-400/[0.06] px-4 py-2 text-xs font-medium text-lime-300 backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
              </span>
              <span>Launching 25 Nov 2026</span>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="mx-auto my-auto flex w-full max-w-4xl flex-col items-center px-6 py-12 text-center sm:px-8 sm:py-16">
          {/* Phase 01 Badge */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <span className="rounded-full bg-gradient-to-r from-lime-300 to-cyan-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              Phase 01
            </span>
            <span className="text-neutral-300">
              Username registry opens <strong className="text-white font-semibold">11 Nov 2026</strong>
            </span>
            <span className="font-mono text-cyan-400">({usernameDaysLeft}d)</span>
          </div>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl leading-[1.03]">
            A social space for{" "}
            <span className="bg-gradient-to-r from-lime-300 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              real life.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            Zero algorithmic noise. Pure presence, spontaneous connections, and spaces that feel alive. Opening globally on{" "}
            <span className="text-neutral-200 font-medium">25 November 2026</span>.
          </p>

          {/* Countdown Grid */}
          <div className="mt-10 w-full max-w-2xl">
            <div className="mb-3 flex items-center justify-between px-1 text-[11px] font-medium tracking-[0.2em] text-neutral-400 uppercase">
              <span>Global Launch Countdown</span>
              <span className="font-mono text-lime-400">25 · 11 · 2026</span>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "DAYS", value: launchTimeLeft.days },
                { label: "HOURS", value: launchTimeLeft.hours },
                { label: "MINUTES", value: launchTimeLeft.minutes },
                { label: "SECONDS", value: launchTimeLeft.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-5 sm:px-6 sm:py-7 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/[0.05]"
                >
                  <div className="pointer-events-none absolute -top-8 h-14 w-14 rounded-full bg-cyan-400/10 blur-xl opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="font-mono text-3xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl tabular-nums">
                    {unit.value}
                  </span>
                  <span className="mt-2 text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] text-neutral-400">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Cards */}
          <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left backdrop-blur-xl">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-lime-300">
                  Milestone 1
                </p>
                <p className="text-xs font-medium text-neutral-200">Username Collection Opens</p>
              </div>
              <span className="rounded-lg bg-white/[0.04] px-3 py-1 font-mono text-xs font-semibold text-white border border-white/10">
                11 Nov 2026
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left backdrop-blur-xl">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Milestone 2
                </p>
                <p className="text-xs font-medium text-neutral-200">Official Platform Launch</p>
              </div>
              <span className="rounded-lg bg-white/[0.04] px-3 py-1 font-mono text-xs font-semibold text-white border border-white/10">
                25 Nov 2026
              </span>
            </div>
          </div>

          {/* Email Subscription Form */}
          <div className="mt-10 w-full max-w-lg">
            {!isSubscribed ? (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3.5">
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 rounded-2xl sm:rounded-full border border-white/15 bg-white/[0.04] p-1.5 backdrop-blur-3xl transition-all duration-300 focus-within:border-cyan-400 focus-within:bg-white/[0.07] focus-within:shadow-[0_0_40px_-8px_rgba(34,211,238,0.4)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for launch dispatch..."
                    className="w-full bg-transparent px-5 py-3.5 sm:py-3 text-sm text-white placeholder-neutral-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="shrink-0 rounded-xl sm:rounded-full bg-gradient-to-r from-lime-300 via-cyan-400 to-indigo-500 px-7 py-3 sm:py-2.5 text-xs font-bold tracking-wide text-black shadow-lg transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Securing..." : "Get Early Access →"}
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
                      className="h-3.5 w-3.5 rounded border-white/25 bg-white/10 accent-cyan-400"
                    />
                    <span>Receive marketing updates & the 11 Nov username alert</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveModal("privacy")}
                    className="underline decoration-white/30 underline-offset-4 hover:text-white cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-lime-400/30 bg-lime-400/10 px-6 py-5 text-center backdrop-blur-2xl shadow-xl">
                <p className="text-sm font-bold text-lime-300">
                  {alreadyRegistered ? "You're already registered on the dispatch list." : "You're successfully on the dispatch list."}
                </p>
                <p className="mt-1.5 text-xs text-neutral-300">
                  Saved <span className="font-mono text-white">{email}</span>. Look for your early access alert on <strong className="text-white">11 November 2026</strong>.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mx-auto flex w-full max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 px-6 py-8 text-xs text-neutral-400 sm:px-12">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-white tracking-tight">down.</span>
            <span>© 2026 All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => {
                setContactSent(false);
                setContactError(null);
                setActiveModal("contact");
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact & Marketing
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="font-mono text-[11px] text-neutral-400">
              Move cursor or tap to ripple
            </span>
          </div>
        </footer>
      </div>

      {/* ================================================================== */}
      {/* MODAL 1: CONTACT FOR MARKETING & INQUIRIES                         */}
      {/* ================================================================== */}
      {activeModal === "contact" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#07090e]/95 p-6 sm:p-8 text-left shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                  Secure Channel
                </span>
                <h2 className="text-xl font-bold text-white">Contact & Partnerships</h2>
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
              <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-2">
                    Inquiry Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "marketing", label: "Marketing" },
                      { id: "updates", label: "Updates" },
                      { id: "press", label: "Press" },
                    ].map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setContactType(tab.id as "marketing" | "updates" | "press")}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                          contactType === tab.id
                            ? "border-lime-400/60 bg-lime-400/10 text-lime-300"
                            : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white"
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
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-cyan-400 focus:outline-none"
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
                    placeholder="Detail your inquiry, partnership proposition, or marketing question..."
                    className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-cyan-400 focus:outline-none"
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
                    className="rounded-full bg-gradient-to-r from-lime-300 via-cyan-400 to-indigo-500 px-6 py-2.5 text-xs font-bold text-black hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingContact ? "Transmitting..." : "Send Message →"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="my-6 rounded-2xl border border-lime-400/30 bg-lime-400/10 p-6 text-center">
                <p className="text-base font-bold text-lime-300">Message Dispatched</p>
                <p className="mt-1.5 text-xs text-neutral-300">
                  Your message has been securely recorded. Our team will review and follow up promptly.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="mt-4 rounded-full bg-white/10 px-5 py-2 text-xs font-medium text-white hover:bg-white/20 cursor-pointer"
                >
                  Return to Site
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 2: PRIVACY & COMMUNICATIONS POLICY                           */}
      {/* ================================================================== */}
      {activeModal === "privacy" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg">
          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/15 bg-[#07090e]/95 p-6 sm:p-8 text-left shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-lime-300">
                  Data Governance
                </span>
                <h2 className="text-xl font-bold text-white">Privacy & Email Policy</h2>
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
                <h3 className="font-semibold text-white">1. Pre-Launch Data Collection</h3>
                <p className="mt-1 text-neutral-400">
                  Leading up to our public release on <strong>25 November 2026</strong>, <strong>down.</strong> collects only your email address and communication preferences when you subscribe or submit inquiries.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white">2. Marketing & Milestone Notifications</h3>
                <p className="mt-1 text-neutral-400">
                  Your email is securely stored via Supabase Row-Level Security exclusively to dispatch:
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-neutral-400">
                  <li>Username registration access on <strong className="text-white">11 November 2026</strong>.</li>
                  <li>Platform launch access on <strong className="text-white">25 November 2026</strong>.</li>
                  <li>Curated product updates and marketing announcements (when opted in).</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white">3. Zero Third-Party Sharing</h3>
                <p className="mt-1 text-neutral-400">
                  We never sell or distribute your email data. Every communication includes an immediate unsubscribe option, or you can request complete erasure via our Contact channel.
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
                className="text-xs font-medium text-cyan-400 hover:underline cursor-pointer"
              >
                Questions regarding data? Contact us →
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("none")}
                className="rounded-full bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
