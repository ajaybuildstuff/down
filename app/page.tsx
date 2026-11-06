"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const USERNAME_OPEN_DATE = new Date("2026-11-11T00:00:00+05:30").getTime();
const LAUNCH_DATE = new Date("2026-11-25T00:00:00+05:30").getTime();

type ActiveDrawer = "none" | "contact" | "privacy";
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
 * Proportional editorial digit reel — uses refined sans-serif numerals
 * instead of cheap monospace coder fonts.
 */
function EditorialDigit({ char }: { char: string }) {
  const num = Number.parseInt(char, 10);
  if (Number.isNaN(num)) {
    return <span className="inline-block">{char}</span>;
  }

  return (
    <span
      className="relative inline-block h-[1.04em] w-[0.62em] overflow-hidden align-bottom select-none"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      <span
        className="flex flex-col transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] will-change-transform"
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
 * Borderless, full-bleed sculptural countdown.
 * No SaaS boxes, no fake radar bars—just pure scale and negative space.
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
    const init = window.setTimeout(() => setTime(readCountdown()), 50);
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
    <section aria-label="Countdown to launch" className="w-full py-8 sm:py-12">
      {/* Top Hairline & Editorial Dates */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-[#F2EFE9]/12 pt-4 text-xs tracking-[-0.01em] text-[#8C8881]">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F2EFE9]" />
          <span className="text-[#F2EFE9]">Time until public release</span>
        </div>

        <div className="flex items-center gap-6">
          <span>
            Usernames open{" "}
            <strong className="font-normal text-[#F2EFE9]">
              Nov 11
              {time.usernameDaysLeft > 0 ? ` (${time.usernameDaysLeft}d)` : ""}
            </strong>
          </span>
          <span className="hidden sm:inline text-[#F2EFE9]/20">—</span>
          <span className="hidden sm:inline">
            App launch{" "}
            <strong className="font-normal text-[#F2EFE9]">Nov 25, 2026</strong>
          </span>
        </div>
      </div>

      {/* Monumental Typographic Grid */}
      <div className="mt-6 grid grid-cols-2 gap-y-10 border-b border-[#F2EFE9]/12 pb-8 sm:mt-10 sm: pb-12 lg:grid-cols-4">
        {columns.map((col, idx) => (
          <div
            key={col.label}
            className={`flex flex-col justify-between ${
              idx > 0 ? "lg:border-l lg:border-[#F2EFE9]/10 lg:pl-8" : ""
            } ${idx % 2 === 1 ? "pl-4 sm:pl-6 lg:pl-8 border-l border-[#F2EFE9]/10" : "pr-4"}`}
          >
            <div className="flex items-baseline justify-between text-xs text-[#8C8881]">
              <span>{col.label}</span>
              <span className="font-serif italic text-sm text-[#8C8881]/70">
                {col.index}
              </span>
            </div>

            <div
              className={`mt-3 text-[clamp(4.25rem,11.5vw,10.5rem)] font-light leading-[0.92] tracking-[-0.055em] sm:mt-5 ${
                col.muted ? "text-[#8C8881]" : "text-[#F2EFE9]"
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
  // Waitlist state
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [waitlist, setWaitlist] = useState<WaitlistState>({ status: "idle" });

  // Drawer & Contact state
  const [drawer, setDrawer] = useState<ActiveDrawer>("none");
  const [contactType, setContactType] = useState<ContactCategory>("marketing");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contact, setContact] = useState<ContactState>({ status: "idle" });

  // Lock scroll & Escape key when a slide-over drawer is open
  useEffect(() => {
    if (drawer === "none") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer("none");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const openContact = () => {
    setContact({ status: "idle" });
    setDrawer("contact");
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
          source: "down_editorial_2026",
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
          setWaitlist({ status: "success", duplicate: true });
        } else {
          setWaitlist({
            status: "error",
            message: "Something went wrong. Please try again.",
          });
        }
      } else {
        setWaitlist({ status: "success", duplicate: false });
      }
    } catch {
      setWaitlist({
        status: "error",
        message: "Connection error. Please check your internet.",
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
        message: "Please enter your email and a short message.",
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
        message: "Connection error. Please try again.",
      });
    }
  };

  return (
    <div
      className="relative min-h-dvh w-full bg-[#0A0A09] text-[#F2EFE9] antialiased selection:bg-[#F2EFE9] selection:text-[#0A0A09]"
      style={{
        fontFamily:
          "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Load Authentic Editorial Fonts (Plus Jakarta Sans + Instrument Serif) & Autofill Fix */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

        .font-serif-editorial {
          font-family: 'Instrument Serif', Georgia, serif;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill {
          -webkit-text-fill-color: #F2EFE9 !important;
          -webkit-box-shadow: 0 0 0px 1000px #0A0A09 inset !important;
          transition: background-color 500000s ease-in-out 0s !important;
          caret-color: #F2EFE9 !important;
        }
      `}</style>

      {/* Subtle Warm Atmospheric Wash (Zero grids, zero green dots) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(75% 60% at 50% 0%, rgba(242, 239, 233, 0.045) 0%, transparent 100%)",
        }}
      />

      {/* Main Editorial Wrapper */}
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1380px] flex-col justify-between px-6 py-7 sm:px-12 sm:py-10">
        {/* Minimalist Top Bar */}
        <header className="flex items-baseline justify-between">
          <a
            href="#top"
            className="text-2xl font-medium tracking-[-0.04em] text-[#F2EFE9] focus-visible:outline-none"
          >
            down<span className="font-serif-editorial italic font-normal">.</span>
          </a>

          <span className="hidden text-xs text-[#8C8881] md:inline">
            Early access — November 2026
          </span>

          <nav className="flex items-center gap-7 text-xs text-[#8C8881]">
            <button
              type="button"
              onClick={openContact}
              className="transition-colors hover:text-[#F2EFE9] cursor-pointer"
            >
              Inquiries
            </button>
            <button
              type="button"
              onClick={() => setDrawer("privacy")}
              className="transition-colors hover:text-[#F2EFE9] cursor-pointer"
            >
              Privacy
            </button>
          </nav>
        </header>

        {/* Centerpiece: Sculptural Countdown + Editorial Split */}
        <main className="my-auto py-8">
          <SculpturalCountdown />

          {/* Lower Asymmetric Split: Editorial Statement (Left) + Minimal Line Input (Right) */}
          <div className="mt-6 grid grid-cols-1 items-end gap-12 lg:mt-10 lg:grid-cols-12 lg:gap-8">
            {/* Left: High-Contrast Editorial Headline */}
            <div className="lg:col-span-7">
              <h1 className="max-w-xl text-4xl font-light tracking-[-0.035em] text-[#F2EFE9] sm:text-6xl leading-[1.04]">
                A social space for real life,{" "}
                <span className="font-serif-editorial italic font-normal text-[#D6D1C7]">
                  off the feed.
                </span>
              </h1>
              <p className="mt-4 max-w-md text-sm font-normal leading-relaxed text-[#8C8881] sm:text-base">
                Made for spontaneous plans with the people you actually know. No
                public metrics, no performative feeds, and no noise.
              </p>
            </div>

            {/* Right: Minimalist Architectural Underline Form */}
            <div className="w-full lg:col-span-5">
              {waitlist.status !== "success" ? (
                <form
                  onSubmit={handleWaitlistSubmit}
                  noValidate
                  className="space-y-4"
                >
                  <div className="group relative flex items-center border-b border-[#F2EFE9]/25 pb-3 transition-colors focus-within:border-[#F2EFE9]">
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
                      className="w-full bg-transparent pr-4 text-base font-light text-[#F2EFE9] placeholder:text-[#8C8881]/70 focus:outline-none sm:text-lg"
                    />
                    <button
                      type="submit"
                      disabled={waitlist.status === "submitting"}
                      className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-[#F2EFE9] transition-opacity hover:opacity-70 disabled:opacity-40 cursor-pointer"
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

                  <div className="flex items-center justify-between pt-1 text-xs text-[#8C8881]">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none hover:text-[#F2EFE9] transition-colors">
                      <input
                        type="checkbox"
                        checked={marketingOptIn}
                        onChange={(e) => setMarketingOptIn(e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-3.5 w-3.5 items-center justify-center border transition-colors ${
                          marketingOptIn
                            ? "border-[#F2EFE9] bg-[#F2EFE9] text-[#0A0A09]"
                            : "border-[#8C8881]/50 bg-transparent"
                        }`}
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
                <div
                  role="status"
                  className="border-t border-[#F2EFE9]/20 pt-5"
                >
                  <p className="font-serif-editorial italic text-2xl text-[#F2EFE9]">
                    {waitlist.duplicate
                      ? "You’re already on the list."
                      : "You’re on the list."}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#8C8881]">
                    We’ll send your early-access invitation to{" "}
                    <span className="text-[#F2EFE9]">{email.trim()}</span> ahead
                    of username registration on{" "}
                    <span className="text-[#F2EFE9]">November 11, 2026</span>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Whisper-Quiet Footer */}
        <footer className="flex flex-col items-start justify-between gap-4 border-t border-[#F2EFE9]/10 pt-6 text-xs text-[#8C8881] sm:flex-row sm:items-center">
          <span>© 2026 down. All rights reserved.</span>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={openContact}
              className="transition-colors hover:text-[#F2EFE9] cursor-pointer"
            >
              Press & Partnerships
            </button>
            <button
              type="button"
              onClick={() => setDrawer("privacy")}
              className="transition-colors hover:text-[#F2EFE9] cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </footer>
      </div>

      {/* ================================================================= */}
      {/* SLIDE-OVER SHEET 1: INQUIRIES                                     */}
      {/* ================================================================= */}
      {drawer === "contact" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-contact-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawer("none");
          }}
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
        >
          <div className="flex h-full w-full max-w-md flex-col justify-between border-l border-[#F2EFE9]/12 bg-[#0D0D0C] p-8 sm:p-10">
            <div>
              <div className="flex items-baseline justify-between border-b border-[#F2EFE9]/12 pb-6">
                <h2
                  id="drawer-contact-title"
                  className="text-2xl font-light tracking-[-0.03em] text-[#F2EFE9]"
                >
                  Inquiries{" "}
                  <span className="font-serif-editorial italic text-[#8C8881]">
                    & Press
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setDrawer("none")}
                  className="text-xs text-[#8C8881] transition-colors hover:text-[#F2EFE9] cursor-pointer"
                >
                  Close
                </button>
              </div>

              {contact.status !== "success" ? (
                <form onSubmit={handleContactSubmit} className="mt-8 space-y-6">
                  <div>
                    <span className="block text-xs text-[#8C8881]">Topic</span>
                    <div className="mt-3 flex gap-2">
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
                          className={`rounded-full border px-4 py-1.5 text-xs transition-colors cursor-pointer ${
                            contactType === t.id
                              ? "border-[#F2EFE9] bg-[#F2EFE9] text-[#0A0A09]"
                              : "border-[#F2EFE9]/15 text-[#8C8881] hover:text-[#F2EFE9]"
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
                      className="block text-xs text-[#8C8881]"
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
                      className="mt-2 w-full border-b border-[#F2EFE9]/20 bg-transparent pb-2.5 text-base font-light text-[#F2EFE9] placeholder:text-[#8C8881]/50 focus:border-[#F2EFE9] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs text-[#8C8881]"
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
                      className="mt-2 w-full resize-none border-b border-[#F2EFE9]/20 bg-transparent pb-2.5 text-base font-light text-[#F2EFE9] placeholder:text-[#8C8881]/50 focus:border-[#F2EFE9] focus:outline-none"
                    />
                  </div>

                  {contact.status === "error" && (
                    <p role="alert" className="text-xs text-[#E57368]">
                      {contact.message}
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={contact.status === "submitting"}
                      className="inline-flex w-full items-center justify-between border border-[#F2EFE9] bg-[#F2EFE9] px-5 py-3.5 text-xs font-medium text-[#0A0A09] transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
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
                <div role="status" className="mt-12 space-y-3">
                  <p className="font-serif-editorial italic text-3xl text-[#F2EFE9]">
                    Thank you.
                  </p>
                  <p className="text-sm text-[#8C8881]">
                    We’ve received your note and will respond shortly.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-[#F2EFE9]/12 pt-5 text-xs text-[#8C8881]">
              Direct email —{" "}
              <a
                href="mailto:marketing@down.social"
                className="text-[#F2EFE9] underline underline-offset-4"
              >
                marketing@down.social
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER SHEET 2: PRIVACY                                       */}
      {/* ================================================================= */}
      {drawer === "privacy" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-privacy-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawer("none");
          }}
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
        >
          <div className="flex h-full w-full max-w-md flex-col justify-between overflow-y-auto border-l border-[#F2EFE9]/12 bg-[#0D0D0C] p-8 sm:p-10">
            <div>
              <div className="flex items-baseline justify-between border-b border-[#F2EFE9]/12 pb-6">
                <h2
                  id="drawer-privacy-title"
                  className="text-2xl font-light tracking-[-0.03em] text-[#F2EFE9]"
                >
                  Privacy{" "}
                  <span className="font-serif-editorial italic text-[#8C8881]">
                    Policy
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setDrawer("none")}
                  className="text-xs text-[#8C8881] transition-colors hover:text-[#F2EFE9] cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#8C8881]">
                <div>
                  <h3 className="font-medium text-[#F2EFE9]">
                    1. Information we collect
                  </h3>
                  <p className="mt-1.5">
                    When you join the waitlist or reach out, we collect only
                    your email address and notification preference.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-[#F2EFE9]">
                    2. How we use your email
                  </h3>
                  <p className="mt-1.5">
                    We use your email solely to send your username claim invite
                    on{" "}
                    <span className="text-[#F2EFE9]">November 11, 2026</span>{" "}
                    and our public release note on{" "}
                    <span className="text-[#F2EFE9]">November 25, 2026</span>.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-[#F2EFE9]">
                    3. No third-party sharing
                  </h3>
                  <p className="mt-1.5">
                    We never sell, rent, or trade your data. Every email
                    contains a one-click unsubscribe link.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#F2EFE9]/12 pt-5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={openContact}
                className="text-[#F2EFE9] underline underline-offset-4 cursor-pointer"
              >
                Have a question? Contact us
              </button>
              <span className="text-[#8C8881]">Effective Nov 2026</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
