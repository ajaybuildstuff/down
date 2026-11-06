"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const USERNAME_OPEN_DATE = new Date("2026-11-11T00:00:00+05:30").getTime();
const LAUNCH_DATE = new Date("2026-11-25T00:00:00+05:30").getTime();

type ActiveOverlay = "none" | "contact" | "privacy";
type ContactCategory = "marketing" | "updates" | "press";

type WaitlistState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; duplicate: boolean }
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
  usernameDaysLeft: number;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function readCountdown(): CountdownTime {
  const now = Date.now();
  const diff = Math.max(0, LAUNCH_DATE - now);

  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff / 3_600_000) % 24);
  const m = Math.floor((diff / 60_000) % 60);
  const s = Math.floor((diff / 1000) % 60);

  const usernameDiff = Math.max(0, USERNAME_OPEN_DATE - now);
  const usernameDaysLeft = Math.ceil(usernameDiff / 86_400_000);

  return {
    days: String(d).padStart(2, "0"),
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
    usernameDaysLeft,
  };
}

/**
 * Editorial digit reel with buttery cubic-bezier easing.
 */
function EditorialDigit({ char }: { char: string }) {
  const num = Number.parseInt(char, 10);
  if (Number.isNaN(num)) {
    return <span className="inline-block">{char}</span>;
  }

  return (
    <span
      className="relative inline-block h-[1.04em] w-[0.61em] overflow-hidden align-bottom select-none"
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
            className="flex h-[1.04em] items-center justify-center leading-none"
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
 * Sculptural Timepiece with borderless editorial grid.
 */
function SculpturalCountdown() {
  const [time, setTime] = useState<CountdownTime>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    usernameDaysLeft: 5,
  });

  useEffect(() => {
    const init = window.setTimeout(() => setTime(readCountdown()), 40);
    const id = window.setInterval(() => setTime(readCountdown()), 1000);
    return () => {
      window.clearTimeout(init);
      window.clearInterval(id);
    };
  }, []);

  const columns = [
    { index: "01", label: "Days", value: time.days },
    { index: "02", label: "Hours", value: time.hours },
    { index: "03", label: "Minutes", value: time.minutes },
    { index: "04", label: "Seconds", value: time.seconds, muted: true },
  ];

  return (
    <section aria-label="Countdown to launch" className="w-full py-6 sm:py-10">
      {/* Top Hairline Status */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-current/[0.12] pt-4 text-xs tracking-[-0.01em] opacity-75">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          <span>Global public release countdown</span>
        </div>

        <div className="flex items-center gap-6">
          <span>
            Username claims open{" "}
            <strong className="font-medium underline underline-offset-4">
              Nov 11
              {time.usernameDaysLeft > 0 ? ` (${time.usernameDaysLeft}d)` : ""}
            </strong>
          </span>
          <span className="hidden sm:inline opacity-30">—</span>
          <span className="hidden sm:inline">
            Full release{" "}
            <strong className="font-medium">November 25, 2026</strong>
          </span>
        </div>
      </div>

      {/* Monumental Numbers */}
      <div className="mt-6 grid grid-cols-2 gap-y-8 border-b border-current/[0.12] pb-8 sm:mt-8 sm:pb-12 lg:grid-cols-4">
        {columns.map((col, idx) => (
          <div
            key={col.label}
            className={`flex flex-col justify-between ${
              idx > 0 ? "lg:border-l lg:border-current/[0.1] lg:pl-10" : ""
            } ${idx % 2 === 1 ? "pl-5 sm:pl-8 lg:pl-10 border-l border-current/[0.1]" : "pr-4"}`}
          >
            <div className="flex items-baseline justify-between text-xs opacity-60">
              <span>{col.label}</span>
              <span className="font-serif italic text-sm">{col.index}</span>
            </div>

            <div
              className={`mt-2 text-[clamp(4rem,11vw,10rem)] font-light leading-[0.92] tracking-[-0.055em] sm:mt-4 ${
                col.muted ? "opacity-55" : "opacity-100"
              }`}
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
  const [isHovered, setIsHovered] = useState(false);

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

  // Lock scroll & bind Escape key
  useEffect(() => {
    if (overlay === "none") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlay("none");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [overlay]);

  const openContact = () => {
    setContact({ status: "idle" });
    setOverlay("contact");
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

    try {
      let { error } = await supabase.from("waitlist_subscribers").insert([
        {
          email: cleanEmail,
          marketing_opt_in: marketingOptIn,
          source: "down_awwards_2026",
        },
      ]);

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
          setWaitlist({ status: "success", duplicate: true });
        } else {
          setWaitlist({
            status: "error",
            message: "Unable to join right now. Please try again.",
          });
        }
      } else {
        setWaitlist({ status: "success", duplicate: false });
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
        message: "Please enter your email and message.",
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

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative min-h-dvh w-full transition-colors duration-700 ease-out antialiased selection:bg-current selection:text-white ${
        isHovered
          ? "bg-[#EBE7DF] text-[#121211]"
          : "bg-[#0A0A09] text-[#F2EFE9]"
      }`}
      style={{
        fontFamily:
          "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

        .font-serif-editorial {
          font-family: 'Instrument Serif', Georgia, serif;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill {
          -webkit-text-fill-color: inherit !important;
          -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
          transition: background-color 500000s ease-in-out 0s !important;
        }
      `}</style>

      {/* Main Editorial Canvas */}
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1400px] flex-col justify-between px-6 py-7 sm:px-12 sm:py-10">
        {/* Minimalist Top Bar */}
        <header className="flex items-baseline justify-between">
          <a
            href="#top"
            className="text-2xl font-medium tracking-[-0.04em] focus-visible:outline-none"
          >
            down<span className="font-serif-editorial italic font-normal">.</span>
          </a>

          <span className="hidden text-xs opacity-60 md:inline">
            Social space for real life — Est. 2026
          </span>

          <nav className="flex items-center gap-7 text-xs opacity-75">
            <button
              type="button"
              onClick={openContact}
              className="transition-opacity hover:opacity-100 cursor-pointer"
            >
              Inquiries
            </button>
            <button
              type="button"
              onClick={() => setOverlay("privacy")}
              className="transition-opacity hover:opacity-100 cursor-pointer"
            >
              Privacy
            </button>
          </nav>
        </header>

        {/* Centerpiece */}
        <main className="my-auto py-6 sm:py-10">
          <SculpturalCountdown />

          {/* Asymmetric Split */}
          <div className="mt-8 grid grid-cols-1 items-end gap-12 lg:mt-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Statement */}
            <div className="lg:col-span-7">
              <h1 className="max-w-xl text-4xl font-light tracking-[-0.035em] sm:text-6xl leading-[1.04]">
                A private social utility,{" "}
                <span className="font-serif-editorial italic font-normal opacity-85">
                  built for real life.
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm font-normal leading-relaxed opacity-70 sm:text-base">
                Spontaneous plans with the people you actually know. No public
                follower counts, no performative feeds, and no algorithmic noise.
              </p>
            </div>

            {/* Right Waitlist Underline Form */}
            <div className="w-full lg:col-span-5">
              {waitlist.status !== "success" ? (
                <form
                  onSubmit={handleWaitlistSubmit}
                  noValidate
                  className="space-y-4"
                >
                  <div className="group relative flex items-center border-b border-current/30 pb-3 transition-colors focus-within:border-current">
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
                        if (waitlist.status === "error") {
                          setWaitlist({ status: "idle" });
                        }
                      }}
                      placeholder="Enter your email address"
                      aria-invalid={waitlist.status === "error"}
                      className="w-full bg-transparent pr-4 text-base font-light placeholder:opacity-40 focus:outline-none sm:text-lg"
                    />
                    <button
                      type="submit"
                      disabled={waitlist.status === "submitting"}
                      className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-60 disabled:opacity-40 cursor-pointer"
                    >
                      <span>
                        {waitlist.status === "submitting"
                          ? "Joining…"
                          : "Join waitlist"}
                      </span>
                      <span aria-hidden="true" className="text-base leading-none">
                        ↗
                      </span>
                    </button>
                  </div>

                  {waitlist.status === "error" && (
                    <p role="alert" className="text-xs text-[#E57368]">
                      {waitlist.message}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs opacity-70">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none transition-opacity hover:opacity-100">
                      <input
                        type="checkbox"
                        checked={marketingOptIn}
                        onChange={(e) => setMarketingOptIn(e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-3.5 w-3.5 items-center justify-center border transition-colors ${
                          marketingOptIn
                            ? "border-current bg-current text-bg"
                            : "border-current/40 bg-transparent"
                        }`}
                      >
                        {marketingOptIn && (
                          <svg
                            className="h-2.5 w-2.5 text-current"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2.5 6L5 8.5L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="square"
                            />
                          </svg>
                        )}
                      </span>
                      <span>Notify me when username claims open on Nov 11</span>
                    </label>
                  </div>
                </form>
              ) : (
                <div role="status" className="border-t border-current/20 pt-5">
                  <p className="font-serif-editorial italic text-2xl">
                    {waitlist.duplicate
                      ? "You’re already on the list."
                      : "You’re on the list."}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed opacity-70">
                    We’ll send your early-access invitation to{" "}
                    <span className="underline">{email.trim()}</span> ahead of
                    username registration on{" "}
                    <span className="underline">November 11, 2026</span>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Continuous Architectural Marquee Footer */}
        <footer className="border-t border-current/12 pt-6">
          <div className="flex flex-col items-start justify-between gap-4 text-xs opacity-70 sm:flex-row sm:items-center">
            <span>© 2026 down. All rights reserved.</span>

            <div className="flex items-center gap-7">
              <button
                type="button"
                onClick={openContact}
                className="transition-opacity hover:opacity-100 cursor-pointer"
              >
                Press & Partnerships
              </button>
              <button
                type="button"
                onClick={() => setOverlay("privacy")}
                className="transition-opacity hover:opacity-100 cursor-pointer"
              >
                Privacy Policy
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#080807]/92 p-6 backdrop-blur-md sm:p-12 text-[#F2EFE9]"
        >
          <div className="relative w-full max-w-2xl">
            <div className="flex items-baseline justify-between border-b border-[#F2EFE9]/15 pb-6">
              <h2
                id="overlay-contact-title"
                className="text-3xl font-light tracking-[-0.03em] sm:text-4xl"
              >
                Inquiries{" "}
                <span className="font-serif-editorial italic text-[#8C8881]">
                  & Press
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setOverlay("none")}
                className="text-xs tracking-wider uppercase opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
              >
                [Esc] Close
              </button>
            </div>

            {contact.status !== "success" ? (
              <form onSubmit={handleContactSubmit} className="mt-8 space-y-8">
                <div>
                  <span className="block text-xs uppercase tracking-widest opacity-60">
                    Department
                  </span>
                  <div className="mt-3 flex gap-3">
                    {(
                      [
                        { id: "marketing", label: "Partnerships" },
                        { id: "updates", label: "Product" },
                        { id: "press", label: "Press" },
                      ] as const
                    ).map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setContactType(t.id)}
                        className={`rounded-full border px-5 py-2 text-xs transition-colors cursor-pointer ${
                          contactType === t.id
                            ? "border-[#F2EFE9] bg-[#F2EFE9] text-[#0A0A09]"
                            : "border-[#F2EFE9]/20 text-[#8C8881] hover:text-[#F2EFE9]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs uppercase tracking-widest opacity-60"
                    >
                      Return email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="mt-3 w-full border-b border-[#F2EFE9]/25 bg-transparent pb-3 text-lg font-light text-[#F2EFE9] placeholder:opacity-30 focus:border-[#F2EFE9] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs uppercase tracking-widest opacity-60"
                    >
                      Message
                    </label>
                    <input
                      id="contact-message"
                      type="text"
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="How can we help?"
                      className="mt-3 w-full border-b border-[#F2EFE9]/25 bg-transparent pb-3 text-lg font-light text-[#F2EFE9] placeholder:opacity-30 focus:border-[#F2EFE9] focus:outline-none"
                    />
                  </div>
                </div>

                {contact.status === "error" && (
                  <p role="alert" className="text-xs text-[#E57368]">
                    {contact.message}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs opacity-60">
                    Or email{" "}
                    <a
                      href="mailto:marketing@down.social"
                      className="underline underline-offset-4 text-[#F2EFE9]"
                    >
                      marketing@down.social
                    </a>
                  </span>
                  <button
                    type="submit"
                    disabled={contact.status === "submitting"}
                    className="inline-flex items-center gap-2 border border-[#F2EFE9] bg-[#F2EFE9] px-7 py-4 text-xs font-medium uppercase tracking-wider text-[#0A0A09] transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    <span>
                      {contact.status === "submitting"
                        ? "Transmitting…"
                        : "Send message"}
                    </span>
                    <span>↗</span>
                  </button>
                </div>
              </form>
            ) : (
              <div role="status" className="mt-16 space-y-4">
                <p className="font-serif-editorial italic text-4xl text-[#F2EFE9]">
                  Transmission received.
                </p>
                <p className="text-sm opacity-70">
                  Thank you. Our team will review your message and reply
                  shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setOverlay("none")}
                  className="mt-6 border border-[#F2EFE9]/30 px-6 py-3 text-xs uppercase tracking-wider hover:border-[#F2EFE9] cursor-pointer"
                >
                  Close overlay
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#080807]/92 p-6 backdrop-blur-md sm:p-12 text-[#F2EFE9]"
        >
          <div className="relative w-full max-w-2xl">
            <div className="flex items-baseline justify-between border-b border-[#F2EFE9]/15 pb-6">
              <h2
                id="overlay-privacy-title"
                className="text-3xl font-light tracking-[-0.03em] sm:text-4xl"
              >
                Privacy{" "}
                <span className="font-serif-editorial italic text-[#8C8881]">
                  Policy
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setOverlay("none")}
                className="text-xs tracking-wider uppercase opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
              >
                [Esc] Close
              </button>
            </div>

            <div className="mt-8 max-h-[60vh] overflow-y-auto space-y-6 text-sm leading-relaxed opacity-80 pr-4">
              <div>
                <h3 className="font-medium text-[#F2EFE9]">
                  1. Minimal Collection Scope
                </h3>
                <p className="mt-1">
                  We collect only your email address and notification
                  preferences when you reserve a waitlist spot or submit an
                  inquiry.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[#F2EFE9]">
                  2. Release Communications
                </h3>
                <p className="mt-1">
                  Your email is used strictly to send your username claim invite
                  on <strong className="text-[#F2EFE9]">November 11, 2026</strong>{" "}
                  and our public release notice on{" "}
                  <strong className="text-[#F2EFE9]">November 25, 2026</strong>.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-[#F2EFE9]">
                  3. Zero Third-Party Brokerage
                </h3>
                <p className="mt-1">
                  We never sell, rent, or trade your records. You may request
                  permanent deletion at any time.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[#F2EFE9]/15 pt-6 text-xs">
              <button
                type="button"
                onClick={openContact}
                className="underline underline-offset-4 opacity-80 hover:opacity-100 cursor-pointer"
              >
                Have a privacy question? Contact us
              </button>
              <button
                type="button"
                onClick={() => setOverlay("none")}
                className="border border-[#F2EFE9] bg-[#F2EFE9] px-6 py-3 font-medium uppercase tracking-wider text-[#0A0A09] hover:opacity-90 cursor-pointer"
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
