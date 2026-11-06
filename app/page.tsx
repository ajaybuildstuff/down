"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// Milestones (IST / UTC+05:30)
const USERNAME_OPEN_DATE = new Date("2026-11-11T00:00:00+05:30").getTime();
const LAUNCH_DATE = new Date("2026-11-25T00:00:00+05:30").getTime();

type ActiveModal = "none" | "contact" | "privacy";
type ContactCategory = "marketing" | "updates" | "press";

type WaitlistSubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; duplicate: boolean; passCode: string }
  | { status: "error"; message: string };

type ContactSubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

interface TimeSnapshot {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  rawSeconds: number;
  usernameDaysLeft: number;
  istFormatted: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SIXTY_TICKS = Array.from({ length: 60 }, (_, i) => i);

function getSnapshot(): TimeSnapshot {
  const now = Date.now();
  const diffLaunch = Math.max(0, LAUNCH_DATE - now);

  const d = Math.floor(diffLaunch / 86_400_000);
  const h = Math.floor((diffLaunch / 3_600_000) % 24);
  const m = Math.floor((diffLaunch / 60_000) % 60);
  const s = Math.floor((diffLaunch / 1000) % 60);

  const diffUsername = Math.max(0, USERNAME_OPEN_DATE - now);
  const usernameDaysLeft = Math.ceil(diffUsername / 86_400_000);

  const istFormatted = new Intl.DateTimeFormat("en-GB", {
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
    usernameDaysLeft,
    istFormatted,
  };
}

/** Deterministic pass serial from email address */
function generatePassSerial(email: string): string {
  let hash = 2166136261;
  for (let i = 0; i < email.length; i++) {
    hash ^= email.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const code = Math.abs(hash % 900000) + 100000;
  return `DWN-${code}`;
}

/** Downloads an .ics calendar event for the Nov 11 username drop */
function downloadUsernameReminderIcs() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//down.//Prelaunch//EN",
    "BEGIN:VEVENT",
    "DTSTART:20261110T183000Z",
    "DTEND:20261110T193000Z",
    "SUMMARY:down. — Claim Your Username",
    "DESCRIPTION:Username reservation is now live for early-access waitlist members.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "down-username-claim.ics";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Optical drum digit with top/bottom vignette mask so numbers roll out of shadow.
 */
function DrumDigit({ char }: { char: string }) {
  const n = Number.parseInt(char, 10);
  const isNum = !Number.isNaN(n) && n >= 0 && n <= 9;

  if (!isNum) {
    return <span className="inline-flex h-[1.12em] items-center">{char}</span>;
  }

  return (
    <span
      className="relative inline-block h-[1.12em] w-[0.61em] overflow-hidden align-bottom select-none"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%)",
      }}
    >
      <span
        className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none will-change-transform"
        style={{ transform: `translate3d(0, -${n * 10}%, 0)` }}
      >
        {DIGITS.map((digit) => (
          <span
            key={digit}
            className="flex h-[1.12em] items-center justify-center leading-none"
          >
            {digit}
          </span>
        ))}
      </span>
    </span>
  );
}

function DrumPair({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center tracking-[-0.045em] tabular-nums">
      {value.split("").map((ch, idx) => (
        <DrumDigit key={idx} char={ch} />
      ))}
    </span>
  );
}

/**
 * Double-bezel recessed horology centerpiece with a 60-second vernier tick scale.
 */
function MonumentalTimepiece() {
  const [snap, setSnap] = useState<TimeSnapshot>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    rawSeconds: 0,
    usernameDaysLeft: 5,
    istFormatted: "--:--:--",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      setMounted(true);
      setSnap(getSnapshot());
    }, 35);

    const timer = window.setInterval(() => {
      setSnap(getSnapshot());
    }, 1000);

    return () => {
      window.clearTimeout(boot);
      window.clearInterval(timer);
    };
  }, []);

  const units = [
    { label: "Days", code: "DD", value: snap.days },
    { label: "Hours", code: "HH", value: snap.hours },
    { label: "Minutes", code: "MM", value: snap.minutes },
    { label: "Seconds", code: "SS", value: snap.seconds, isLive: true },
  ];

  // Progress along the 60-second cycle (inverted from countdown second)
  const activeTickIndex = mounted ? (60 - snap.rawSeconds) % 60 : 0;

  return (
    <section aria-label="Time remaining until launch" className="w-full">
      {/* Outer machined bezel */}
      <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-1.5 shadow-[0_32px_90px_-20px_rgba(0,0,0,0.95)] sm:rounded-[34px] sm:p-2">
        {/* Inner instrument housing */}
        <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#090A0D] sm:rounded-[26px]">
          {/* Specular top highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Instrument Top Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-white/[0.01] px-5 py-3 text-[11px] text-zinc-400 sm:px-7">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D8FF5B] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D8FF5B]" />
              </span>
              <span className="font-medium tracking-tight text-zinc-200">
                Global Release Countdown
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
              <span>IST {mounted ? snap.istFormatted : "--:--:--"}</span>
              <span className="text-white/15">•</span>
              <span className="text-zinc-300">25 Nov 2026</span>
            </div>
          </div>

          {/* 4 Recessed Odometer Drums */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.06] lg:grid-cols-4">
            {units.map((unit) => (
              <div
                key={unit.label}
                className="relative flex flex-col justify-between bg-[#090A0D] px-5 py-6 sm:px-8 sm:py-9"
              >
                {/* Subtle inner vignette */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_75%)]" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-xs font-medium tracking-tight text-zinc-400">
                    {unit.label}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wider ${
                      unit.isLive
                        ? "bg-[#D8FF5B]/15 text-[#D8FF5B]"
                        : "bg-white/[0.04] text-zinc-500"
                    }`}
                  >
                    {unit.code}
                  </span>
                </div>

                {/* Recessed Drum Well */}
                <div className="relative my-3 flex items-center justify-center rounded-2xl border border-white/[0.05] bg-[#050608] py-4 shadow-[inset_0_4px_20px_rgba(0,0,0,0.85)] sm:my-5 sm:py-6">
                  {/* Horizontal mechanical split line */}
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/[0.04]" />

                  <div
                    className={`font-mono text-[clamp(3.25rem,8.5vw,6.75rem)] font-semibold leading-none ${
                      unit.isLive ? "text-[#D8FF5B]" : "text-[#F4F4F0]"
                    }`}
                  >
                    <DrumPair value={unit.value} />
                  </div>
                </div>

                {/* Bottom micro-caption */}
                <div className="relative z-10 flex items-center justify-between font-mono text-[10px] text-zinc-500">
                  <span>{unit.isLive ? "1000ms cycle" : "Locked"}</span>
                  <span
                    className={`h-1 w-1 rounded-full ${
                      unit.isLive ? "bg-[#D8FF5B]" : "bg-white/20"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 60-Second Vernier Scale + Milestone Strip */}
          <div className="border-t border-white/[0.06] bg-[#07080A] px-5 py-4 sm:px-7">
            {/* 60-Tick Precision Bar */}
            <div
              aria-hidden="true"
              className="mb-4 grid grid-cols-60 gap-[2px] sm:gap-1"
              style={{
                gridTemplateColumns: "repeat(60, minmax(0, 1fr))",
              }}
            >
              {SIXTY_TICKS.map((t) => {
                const isMajor = t % 5 === 0;
                const isLit = mounted && t <= activeTickIndex;
                const isHead = mounted && t === activeTickIndex;
                return (
                  <span
                    key={t}
                    className={`rounded-full transition-colors duration-300 ${
                      isMajor ? "h-2.5" : "h-1.5 self-center"
                    } ${
                      isHead
                        ? "bg-[#D8FF5B] shadow-[0_0_8px_#D8FF5B]"
                        : isLit
                          ? "bg-[#D8FF5B]/55"
                          : "bg-white/[0.08]"
                    }`}
                  />
                );
              })}
            </div>

            {/* Two-Stage Milestone Footer */}
            <div className="flex flex-col items-start justify-between gap-3 pt-1 text-xs sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8FF5B]/30 bg-[#D8FF5B]/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#D8FF5B]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D8FF5B]" />
                  Milestone 01
                </span>
                <span className="text-zinc-300">
                  Username reservation opens{" "}
                  <strong className="font-semibold text-white">
                    11 November
                  </strong>
                </span>
                {mounted && snap.usernameDaysLeft > 0 && (
                  <span className="font-mono text-[11px] text-zinc-500">
                    ({snap.usernameDaysLeft} days away)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-zinc-400">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 font-mono text-[11px] text-zinc-400">
                  Milestone 02
                </span>
                <span>
                  iOS & Android launch{" "}
                  <strong className="font-semibold text-zinc-200">
                    25 November
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default function DownPrelaunchPage() {
  const emailInputRef = useRef<HTMLInputElement>(null);

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

  // Press "/" anywhere to focus the waitlist email input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        activeModal === "none" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        emailInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeModal]);

  // Lock scroll & bind Escape when modal is open
  useEffect(() => {
    if (activeModal === "none") return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal("none");
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEsc);
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
    const passCode = generatePassSerial(cleanEmail);

    try {
      let { error } = await supabase.from("waitlist_subscribers").insert([
        {
          email: cleanEmail,
          marketing_opt_in: marketingOptIn,
          source: "down_prelaunch_2026_final",
        },
      ]);

      // Resilient fallback if optional columns do not exist in DB
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
          setWaitlistState({ status: "success", duplicate: true, passCode });
        } else {
          setWaitlistState({
            status: "error",
            message: "Could not complete registration. Please try again.",
          });
        }
      } else {
        setWaitlistState({ status: "success", duplicate: false, passCode });
      }
    } catch {
      setWaitlistState({
        status: "error",
        message: "Connection error. Please check your internet and try again.",
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
        message: "Please enter both a valid email and a message.",
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
          message: "Unable to send right now. Please try again.",
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
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#060709] font-sans text-[#F4F4F0] antialiased selection:bg-[#D8FF5B] selection:text-black">
      {/* Keep browser autofill strictly dark */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill {
          -webkit-text-fill-color: #F4F4F0 !important;
          -webkit-box-shadow: 0 0 0px 1000px #0B0C10 inset !important;
          transition: background-color 500000s ease-in-out 0s !important;
          caret-color: #D8FF5B !important;
        }
      `}</style>

      {/* Ambient overhead studio light + subtle anodized grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div
          className="absolute inset-x-0 -top-40 h-[480px]"
          style={{
            background:
              "radial-gradient(55% 50% at 50% 0%, rgba(216, 255, 91, 0.065) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-between px-5 sm:px-8">
        {/* Minimalist Navigation */}
        <header className="flex items-center justify-between py-6 sm:py-8">
          <a
            href="#top"
            className="group inline-flex items-center gap-2 focus-visible:outline-none"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] font-mono text-xs font-bold text-[#D8FF5B] transition-colors group-hover:border-[#D8FF5B]/40">
              d.
            </span>
            <span className="text-lg font-semibold tracking-[-0.03em] text-white">
              down<span className="text-[#D8FF5B]">.</span>
            </span>
          </a>

          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={openContactModal}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white cursor-pointer"
            >
              Inquiries
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white cursor-pointer"
            >
              Privacy
            </button>
          </nav>
        </header>

        {/* Centerpiece Content */}
        <main className="my-auto flex flex-col items-center py-6 sm:py-10">
          {/* Focused Editorial Header */}
          <div className="mb-8 flex w-full flex-col items-start justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[11px] font-medium text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D8FF5B]" />
                <span>Private Social Utility · Pre-Release</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl leading-[1.06]">
                Real life,{" "}
                <span className="text-zinc-400">off the feed.</span>
              </h1>
            </div>

            <p className="max-w-xs text-xs leading-relaxed text-zinc-400 sm:text-right sm:text-sm">
              Spontaneous plans with your actual circle. No follower counts, no
              public metrics, and no algorithmic noise.
            </p>
          </div>

          {/* 1. The Monumental Horology Centerpiece */}
          <MonumentalTimepiece />

          {/* 2. Double-Bezel Waitlist Command Bar / Early-Access Pass */}
          <div className="mt-6 w-full">
            {waitlistState.status !== "success" ? (
              <form
                onSubmit={handleEmailSubmit}
                noValidate
                className="rounded-[24px] border border-white/[0.07] bg-white/[0.02] p-1.5 sm:rounded-[28px] sm:p-2"
              >
                <div className="rounded-[18px] border border-white/[0.08] bg-[#0B0C10] p-4 sm:rounded-[22px] sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
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
                          if (waitlistState.status === "error") {
                            setWaitlistState({ status: "idle" });
                          }
                        }}
                        placeholder="Enter your email to reserve early access…"
                        aria-invalid={waitlistState.status === "error"}
                        aria-describedby={
                          waitlistState.status === "error"
                            ? "waitlist-error"
                            : undefined
                        }
                        className="h-12 w-full rounded-xl border border-white/[0.1] bg-[#07080A] pl-4 pr-14 text-base text-white placeholder:text-zinc-500 focus:border-[#D8FF5B]/70 focus:outline-none sm:text-sm"
                      />
                      <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline-block">
                        /
                      </kbd>
                    </div>

                    <button
                      type="submit"
                      disabled={waitlistState.status === "submitting"}
                      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D8FF5B] px-6 text-sm font-semibold text-black transition-all hover:bg-[#e2ff7d] active:scale-[0.99] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8FF5B] cursor-pointer"
                    >
                      <span>
                        {waitlistState.status === "submitting"
                          ? "Reserving…"
                          : "Reserve spot"}
                      </span>
                      <svg
                        className="h-4 w-4"
                         viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3.5 8H12.5M12.5 8L8.5 4M12.5 8L8.5 12"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {waitlistState.status === "error" && (
                    <p
                      id="waitlist-error"
                      role="alert"
                      className="mt-2.5 text-xs font-medium text-rose-400"
                    >
                      {waitlistState.message}
                    </p>
                  )}

                  {/* Custom Tactile Switch Bar */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
                    <div
                      onClick={() => setMarketingOptIn((v) => !v)}
                      className="inline-flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={marketingOptIn}
                        aria-label="Notify me when username claims open on 11 November"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMarketingOptIn((v) => !v);
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors cursor-pointer ${
                          marketingOptIn
                            ? "border-[#D8FF5B]/50 bg-[#D8FF5B]/20"
                            : "border-white/15 bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full transition-transform duration-200 ${
                            marketingOptIn
                              ? "translate-x-4 bg-[#D8FF5B]"
                              : "translate-x-0.5 bg-zinc-500"
                          }`}
                        />
                      </button>
                      <span className="group-hover:text-zinc-200 transition-colors">
                        Send me an invite when username claims open on{" "}
                        <strong className="font-medium text-zinc-200">
                          11 Nov
                        </strong>
                      </span>
                    </div>

                    <span className="font-mono text-[11px] text-zinc-500">
                      Zero spam · Unsubscribe anytime
                    </span>
                  </div>
                </div>
              </form>
            ) : (
              /* Bespoke Early-Access Pass on Signup */
              <div
                role="status"
                className="rounded-[24px] border border-[#D8FF5B]/30 bg-[#D8FF5B]/[0.03] p-1.5 sm:rounded-[28px] sm:p-2"
              >
                <div className="flex flex-col justify-between gap-4 rounded-[18px] border border-[#D8FF5B]/20 bg-[#090B0E] p-5 sm:flex-row sm:items-center sm:rounded-[22px] sm:px-7 sm:py-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#D8FF5B] text-black">
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2.5 6.2L4.8 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {waitlistState.duplicate
                          ? "Your spot is already reserved"
                          : "Early-access pass issued"}
                      </span>
                      <span className="rounded border border-[#D8FF5B]/30 bg-[#D8FF5B]/10 px-2 py-0.5 font-mono text-[11px] text-[#D8FF5B]">
                        {waitlistState.passCode}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      We’ll dispatch your claim link to{" "}
                      <span className="font-mono text-zinc-200">
                        {email.trim()}
                      </span>{" "}
                      before{" "}
                      <strong className="font-medium text-zinc-200">
                        11 November 2026
                      </strong>
                      .
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadUsernameReminderIcs}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:border-[#D8FF5B]/50 hover:bg-white/[0.08] cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5 text-[#D8FF5B]" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M5 1.5V4M11 1.5V4M2 6.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    <span>Add 11 Nov reminder (.ics)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
        {/* Minimal Footer */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] py-6 text-xs text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">down.</span>
            <span>© 2026 All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={openContactModal}
              className="transition-colors hover:text-zinc-200 cursor-pointer"
            >
              Partnerships & Press
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="transition-colors hover:text-zinc-200 cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-md rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-1.5 shadow-2xl">
            <div className="max-h-[88dvh] overflow-y-auto rounded-[20px] border border-white/[0.08] bg-[#0A0B0E] p-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
                <div>
                  <h2
                    id="contact-modal-title"
                    className="text-base font-semibold text-white"
                  >
                    Inquiries & Partnerships
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Direct line to the founding team.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => setActiveModal("none")}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-zinc-400 transition-colors hover:text-white cursor-pointer"
                >
                  ESC
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
                          className={`rounded-xl border py-2 text-xs font-medium transition-colors cursor-pointer ${
                            contactType === tab.id
                              ? "border-[#D8FF5B]/50 bg-[#D8FF5B]/10 text-[#D8FF5B]"
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
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-white/10 bg-[#07080A] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-[#D8FF5B]/70 focus:outline-none sm:text-sm"
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
                      placeholder="How can we collaborate?"
                      className="w-full rounded-xl border border-white/10 bg-[#07080A] px-3.5 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-[#D8FF5B]/70 focus:outline-none sm:text-sm"
                    />
                  </div>

                  {contactState.status === "error" && (
                    <p
                      role="alert"
                      className="text-xs font-medium text-rose-400"
                    >
                      {contactState.message}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
                    <a
                      href="mailto:marketing@down.social"
                      className="font-mono text-xs text-zinc-400 underline decoration-white/20 underline-offset-4 hover:text-white"
                    >
                      marketing@down.social
                    </a>
                    <button
                      type="submit"
                      disabled={contactState.status === "submitting"}
                      className="rounded-xl bg-[#D8FF5B] px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-[#e2ff7d] disabled:opacity-50 cursor-pointer"
                    >
                      {contactState.status === "submitting"
                        ? "Sending…"
                        : "Send message"}
                    </button>
                  </div>
                </form>
              ) : (
                <div role="status" className="my-6 text-center">
                  <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#D8FF5B]/15 text-[#D8FF5B]">
                    <svg className="h-4 w-4" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6.2L4.8 8.5L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Message received
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Thank you. Our team will respond directly via email.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModal("none")}
                    className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-md rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-1.5 shadow-2xl">
            <div className="max-h-[85dvh] overflow-y-auto rounded-[20px] border border-white/[0.08] bg-[#0A0B0E] p-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
                <div>
                  <h2
                    id="privacy-modal-title"
                    className="text-base font-semibold text-white"
                  >
                    Privacy Policy
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    How we handle pre-release waitlist data.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => setActiveModal("none")}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-zinc-400 transition-colors hover:text-white cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs leading-relaxed text-zinc-400">
                <div>
                  <h3 className="font-semibold text-white">
                    1. Minimal collection
                  </h3>
                  <p className="mt-1">
                    We collect only your email address and notification
                    preference when you reserve a waitlist spot or send an
                    inquiry.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    2. Release communications
                  </h3>
                  <p className="mt-1">
                    Your email is used strictly to send your username claim
                    invite on{" "}
                    <strong className="text-zinc-200">11 November 2026</strong>{" "}
                    and our launch notice on{" "}
                    <strong className="text-zinc-200">25 November 2026</strong>.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    3. Zero data sharing
                  </h3>
                  <p className="mt-1">
                    We never sell, rent, or share your information with third
                    parties. Every email includes a one-click unsubscribe link.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
                <button
                  type="button"
                  onClick={openContactModal}
                  className="text-xs font-medium text-[#D8FF5B] hover:underline cursor-pointer"
                >
                  Questions? Contact us →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
