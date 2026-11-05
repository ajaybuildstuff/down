"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DotDistortionShader } from "@/components/DotDistortionShader";

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

interface CountdownValues {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  usernameDaysLeft: number;
}

function calculateTimeRemaining(): CountdownValues {
  const now = Date.now();
  const diffLaunch = Math.max(0, LAUNCH_DATE - now);

  const d = Math.floor(diffLaunch / (1000 * 60 * 60 * 24));
  const h = Math.floor((diffLaunch / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diffLaunch / 1000 / 60) % 60);
  const s = Math.floor((diffLaunch / 1000) % 60);

  const diffUsername = Math.max(0, USERNAME_OPEN_DATE - now);
  const usernameDaysLeft = Math.ceil(diffUsername / (1000 * 60 * 60 * 24));

  return {
    days: String(d).padStart(2, "0"),
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
    usernameDaysLeft,
  };
}

/**
 * Isolated countdown component so the 1-second timer never re-renders
 * the forms, modals, or background shader.
 */
function LaunchCountdown() {
  const [time, setTime] = useState<CountdownValues | null>(null);

  useEffect(() => {
    const update = () => setTime(calculateTimeRemaining());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const units = [
    { label: "Days", value: time?.days ?? "--" },
    { label: "Hours", value: time?.hours ?? "--" },
    { label: "Minutes", value: time?.minutes ?? "--" },
    { label: "Seconds", value: time?.seconds ?? "--" },
  ];

  return (
    <section
      aria-label="Time remaining until launch"
      className="mt-10 w-full max-w-xl"
    >
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
        <div className="grid grid-cols-4 divide-x divide-white/[0.08]">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="flex flex-col items-center justify-center px-3 py-5 sm:px-6 sm:py-6"
            >
              <span className="font-mono text-2xl font-semibold tracking-tight text-white sm:text-4xl tabular-nums">
                {unit.value}
              </span>
              <span className="mt-1.5 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/[0.08] bg-white/[0.01] px-4 py-2.5 text-xs text-neutral-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            <span>
              Usernames open <strong className="font-medium text-neutral-200">11 Nov</strong>
              {time && time.usernameDaysLeft > 0
                ? ` (${time.usernameDaysLeft}d)`
                : ""}
            </span>
          </div>
          <span className="hidden text-white/20 sm:inline">·</span>
          <div>
            Full release <strong className="font-medium text-neutral-200">25 Nov 2026</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DownPrelaunchPage() {
  // Waitlist form state
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [waitlistState, setWaitlistState] = useState<WaitlistSubmissionState>({
    status: "idle",
  });

  // Modal & Contact form state
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
        message: "Please enter a valid email address.",
      });
      return;
    }

    setWaitlistState({ status: "submitting" });

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
          setWaitlistState({ status: "success", duplicate: true });
        } else {
          setWaitlistState({
            status: "error",
            message: "Unable to join right now. Please try again.",
          });
        }
      } else {
        setWaitlistState({ status: "success", duplicate: false });
      }
    } catch {
      setWaitlistState({
        status: "error",
        message: "Network error. Please check your connection and try again.",
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
        message: "Please provide a valid email and message.",
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
        message: "Network error. Please check your connection.",
      });
    }
  };

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#060709] font-sans text-[#F5F5F2] antialiased selection:bg-lime-300 selection:text-black">
      {/* Ambient Background Shader */}
      <DotDistortionShader />

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-dvh flex-col justify-between">
        {/* Header */}
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-7 sm:px-10 sm:pt-9">
          <a
            href="#top"
            className="inline-flex items-center gap-2 rounded-lg py-1 text-xl font-bold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
          >
            <span>down</span>
            <span className="text-lime-300">.</span>
          </a>

          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={openContactModal}
              className="rounded-lg px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 cursor-pointer"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="rounded-lg px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 cursor-pointer"
            >
              Privacy
            </button>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="mx-auto my-auto flex w-full max-w-3xl flex-col items-center px-6 py-16 text-center sm:px-8 sm:py-20">
          {/* Eyebrow Pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-medium text-neutral-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
            <span>Early access · November 2026</span>
          </div>

          {/* Headline */}
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl leading-[1.05]">
            A social space for{" "}
            <span className="text-lime-300">real life.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-5 max-w-lg text-base leading-relaxed text-neutral-300 sm:text-lg">
            A quieter social app for staying close to friends and making spontaneous plans—without algorithmic noise.
          </p>

          {/* Isolated Countdown + Key Dates */}
          <LaunchCountdown />

          {/* Waitlist Form */}
          <div className="mt-8 w-full max-w-md">
            {waitlistState.status !== "success" ? (
              <form onSubmit={handleEmailSubmit} noValidate className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm: rounded-xl sm:border sm:border-white/15 sm:bg-white/[0.03] sm:p-1.5 sm:backdrop-blur-xl sm:focus-within:border-lime-300/80 transition-colors">
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
                    placeholder="you@example.com"
                    aria-invalid={waitlistState.status === "error"}
                    aria-describedby={
                      waitlistState.status === "error"
                        ? "waitlist-error"
                        : undefined
                    }
                    className="min-h-11 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-base text-white placeholder:text-neutral-500 focus:border-lime-300 focus:outline-none sm:min-h-0 sm:border-0 sm:bg-transparent sm:px-3.5 sm:py-2 sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={waitlistState.status === "submitting"}
                    className="min-h-11 shrink-0 rounded-xl bg-lime-300 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-lime-200 active:scale-[0.99] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060709] sm:min-h-0 sm:rounded-lg cursor-pointer"
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
                    className="text-left text-xs font-medium text-rose-400 px-1"
                  >
                    {waitlistState.message}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 px-1 text-xs text-neutral-400">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none hover:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-lime-300 focus:ring-lime-300"
                    />
                    <span>Notify me when username registration opens</span>
                  </label>
                </div>
              </form>
            ) : (
              <div
                role="status"
                className="rounded-2xl border border-lime-300/25 bg-lime-300/[0.07] px-5 py-4 text-left backdrop-blur-xl"
              >
                <p className="text-sm font-semibold text-lime-300">
                  {waitlistState.duplicate
                    ? "You’re already on the waitlist."
                    : "You’re on the waitlist."}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-300">
                  We’ll email{" "}
                  <span className="font-mono text-white">{email.trim()}</span>{" "}
                  ahead of username registration on{" "}
                  <strong className="font-medium text-white">
                    11 November 2026
                  </strong>
                  .
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/[0.08] px-6 py-6 text-xs text-neutral-400 sm:flex-row sm:px-10">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">down.</span>
            <span>© 2026 All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={openContactModal}
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline cursor-pointer"
            >
              Contact & Partnerships
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </footer>
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: CONTACT & PARTNERSHIPS                                   */}
      {/* ================================================================= */}
      {activeModal === "contact" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal("none");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0B0D11] p-6 text-left shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <h2
                  id="contact-modal-title"
                  className="text-lg font-semibold text-white"
                >
                  Contact us
                </h2>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Partnerships, press, or general questions.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setActiveModal("none")}
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {contactState.status !== "success" ? (
              <form onSubmit={handleContactSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-300">
                    Topic
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "marketing", label: "Marketing" },
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
                            ? "border-lime-300/60 bg-lime-300/10 text-lime-300"
                            : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white"
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
                    className="mb-1.5 block text-xs font-medium text-neutral-300"
                  >
                    Your email
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
                    className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-base text-white placeholder:text-neutral-500 focus:border-lime-300 focus:outline-none sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block text-xs font-medium text-neutral-300"
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
                    className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 text-base text-white placeholder:text-neutral-500 focus:border-lime-300 focus:outline-none sm:text-sm"
                  />
                </div>

                {contactState.status === "error" && (
                  <p role="alert" className="text-xs font-medium text-rose-400">
                    {contactState.message}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-neutral-400">
                    Or email{" "}
                    <a
                      href="mailto:marketing@down.social"
                      className="text-neutral-200 underline decoration-white/30 underline-offset-4 hover:text-white"
                    >
                      marketing@down.social
                    </a>
                  </span>
                  <button
                    type="submit"
                    disabled={contactState.status === "submitting"}
                    className="rounded-lg bg-lime-300 px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-lime-200 disabled:opacity-50 cursor-pointer"
                  >
                    {contactState.status === "submitting"
                      ? "Sending…"
                      : "Send message"}
                  </button>
                </div>
              </form>
            ) : (
              <div role="status" className="my-6 text-center">
                <p className="text-base font-semibold text-white">
                  Message sent
                </p>
                <p className="mt-1.5 text-xs text-neutral-400">
                  Thanks for reaching out. Our team will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="mt-5 rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: PRIVACY POLICY                                           */}
      {/* ================================================================= */}
      {activeModal === "privacy" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal("none");
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0B0D11] p-6 text-left shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <h2
                  id="privacy-modal-title"
                  className="text-lg font-semibold text-white"
                >
                  Privacy Policy
                </h2>
                <p className="mt-0.5 text-xs text-neutral-400">
                  How we handle pre-launch waitlist and contact data.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setActiveModal("none")}
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs sm:text-sm leading-relaxed text-neutral-300">
              <div>
                <h3 className="font-semibold text-white">
                  1. What we collect
                </h3>
                <p className="mt-1 text-neutral-400">
                  Ahead of our launch on{" "}
                  <strong className="font-medium text-neutral-200">
                    25 November 2026
                  </strong>
                  , <strong className="font-medium text-neutral-200">down.</strong>{" "}
                  collects only your email address and notification preferences when you join the waitlist or contact us.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  2. How we use your email
                </h3>
                <p className="mt-1 text-neutral-400">
                  We use your email solely to send:
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-neutral-400">
                  <li>
                    Your username registration invite on{" "}
                    <strong className="font-medium text-neutral-200">
                      11 November 2026
                    </strong>
                    .
                  </li>
                  <li>
                    Our official launch announcement on{" "}
                    <strong className="font-medium text-neutral-200">
                      25 November 2026
                    </strong>
                    .
                  </li>
                  <li>
                    Occasional product updates if you opted in.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  3. No third-party sharing
                </h3>
                <p className="mt-1 text-neutral-400">
                  We never sell or rent your personal information. Every email includes a one-click unsubscribe link, or you can contact us anytime to permanently delete your data.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={openContactModal}
                className="text-xs font-medium text-lime-300 hover:underline cursor-pointer"
              >
                Have a privacy question? Contact us →
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("none")}
                className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
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
