"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MonumentalTimepiece } from "@/components/MonumentalClock";

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

function generatePassSerial(email: string): string {
  let hash = 2166136261;
  for (let i = 0; i < email.length; i++) {
    hash ^= email.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const code = Math.abs(hash % 900000) + 100000;
  return `DWN-${code}`;
}

function downloadUsernameReminderIcs() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//down.//Prelaunch//EN",
    "BEGIN:VEVENT",
    "DTSTART:20261110T183000Z",
    "DTEND:20261110T193000Z",
    "SUMMARY:down. — Claim Your Username (Phase 01)",
    "DESCRIPTION:Initial username collection is live for early-access waitlist members ahead of the 25 November 2026 launch.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "down-nov11-username-claim.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export default function DownPrelaunchPage() {
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [copiedPass, setCopiedPass] = useState(false);
  const [waitlistState, setWaitlistState] = useState<WaitlistSubmissionState>({
    status: "idle",
  });

  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const [contactType, setContactType] = useState<ContactCategory>("marketing");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactState, setContactState] = useState<ContactSubmissionState>({
    status: "idle",
  });

  // Press "/" to focus email input
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

  // Modal scroll lock & Escape handler
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
          pass_code: passCode,
          marketing_opt_in: marketingOptIn,
          source: "down_prelaunch_2026_prod",
        },
      ]);

      // Fallback if optional columns were not migrated yet
      if (
        error &&
        error.code !== "23505" &&
        (error.code === "PGRST204" ||
          error.code === "42703" ||
          error.message?.toLowerCase().includes("column"))
      ) {
        const retry = await supabase
          .from("waitlist_subscribers")
          .insert([{ email: cleanEmail, marketing_opt_in: marketingOptIn }]);
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
            message: "Unable to complete registration. Please try again.",
          });
        }
      } else {
        setWaitlistState({ status: "success", duplicate: false, passCode });
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
        message: "Please provide a valid email address and message.",
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
          message: "Unable to send inquiry right now. Please try again.",
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

  const copyPassToClipboard = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#040507] font-sans text-[#F4F4F0] antialiased selection:bg-[#D8FF5B] selection:text-black">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        textarea:-webkit-autofill {
          -webkit-text-fill-color: #F4F4F0 !important;
          -webkit-box-shadow: 0 0 0px 1000px #08090C inset !important;
          transition: background-color 500000s ease-in-out 0s !important;
          caret-color: #D8FF5B !important;
        }
      `}</style>

      {/* Subtle Architectural Grid & Overhead Studio Glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-x-0 -top-48 h-[560px]"
          style={{
            background:
              "radial-gradient(55% 50% at 50% 0%, rgba(216, 255, 91, 0.065) 0%, rgba(255, 255, 255, 0.015) 55%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-between px-5 sm:px-8">
        {/* Top Navigation */}
        <header className="flex items-center justify-between py-6 sm:py-8">
          <a
            href="#top"
            className="group inline-flex items-center gap-2.5 focus-visible:outline-none"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.03] font-mono text-xs font-bold text-[#D8FF5B] transition-colors group-hover:border-[#D8FF5B]/50">
              d.
            </span>
            <span className="text-lg font-bold tracking-[-0.03em] text-white">
              down<span className="text-[#D8FF5B]">.</span>
            </span>
          </a>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={openContactModal}
              className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-white/10 hover:bg-white/[0.04] hover:text-white cursor-pointer"
            >
              Inquiries
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-white/10 hover:bg-white/[0.04] hover:text-white cursor-pointer"
            >
              Privacy
            </button>
          </nav>
        </header>

        {/* Centerpiece Content */}
        <main className="my-auto flex flex-col items-center py-4 sm:py-8">
          {/* Direct, High-Contrast SaaS Header */}
          <div className="mb-6 flex w-full flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D8FF5B]/25 bg-[#D8FF5B]/[0.06] px-3 py-1 font-mono text-[11px] font-medium text-[#D8FF5B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D8FF5B]" />
                <span>SOCIAL GRAPH · RELEASE 1.0</span>
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-5xl md:text-6xl leading-[1.03]">
                Real life,{" "}
                <span className="text-zinc-500">off the feed.</span>
              </h1>
            </div>

            <p className="max-w-sm text-xs leading-relaxed text-zinc-400 sm:text-right sm:text-sm">
              Spontaneous plans with your actual circle. Zero public vanity
              metrics, zero algorithmic clutter. Username claims open{" "}
              <strong className="font-semibold text-white">11 Nov</strong>{" "}
              ahead of our{" "}
              <strong className="font-semibold text-white">25 Nov 2026</strong>{" "}
              launch.
            </p>
          </div>

          {/* 1. Monumental Horological Countdown */}
          <MonumentalTimepiece />

          {/* 2. Waitlist Command Bar / Issued Pass */}
          <div className="mt-5 w-full">
            {waitlistState.status !== "success" ? (
              <form
                onSubmit={handleEmailSubmit}
                noValidate
                className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-1.5 shadow-2xl sm:rounded-[30px] sm:p-2"
              >
                <div className="rounded-[18px] border border-white/[0.08] bg-[#08090C] p-4 sm:rounded-[22px] sm:p-5">
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
                        placeholder="Enter your email for the 11 Nov username drop & launch updates…"
                        className="h-12 w-full rounded-xl border border-white/[0.1] bg-[#040507] pl-4 pr-12 text-sm text-white placeholder:text-zinc-500 focus:border-[#D8FF5B]/70 focus:outline-none"
                      />
                      <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline-block">
                        /
                      </kbd>
                    </div>

                    <button
                      type="submit"
                      disabled={waitlistState.status === "submitting"}
                      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D8FF5B] px-6 text-sm font-semibold text-black transition-all hover:bg-[#e3ff80] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                    >
                      <span>
                        {waitlistState.status === "submitting"
                          ? "Reserving…"
                          : "Get Early Access"}
                      </span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>

                  {waitlistState.status === "error" && (
                    <p
                      role="alert"
                      className="mt-2.5 text-xs font-medium text-rose-400"
                    >
                      {waitlistState.message}
                    </p>
                  )}

                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
                    <div
                      onClick={() => setMarketingOptIn((v) => !v)}
                      className="inline-flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={marketingOptIn}
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
                        Receive marketing dispatches & the{" "}
                        <strong className="font-medium text-zinc-200">
                          11 Nov
                        </strong>{" "}
                        username claim alert
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveModal("privacy")}
                      className="font-mono text-[11px] text-zinc-500 underline decoration-white/20 underline-offset-4 hover:text-zinc-300 cursor-pointer"
                    >
                      Zero spam · Privacy Policy
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Issued Early-Access Pass Card */
              <div
                role="status"
                className="rounded-[24px] border border-[#D8FF5B]/35 bg-[#D8FF5B]/[0.03] p-1.5 sm:rounded-[30px] sm:p-2"
              >
                <div className="flex flex-col justify-between gap-4 rounded-[18px] border border-[#D8FF5B]/20 bg-[#080A0D] p-5 sm:flex-row sm:items-center sm:rounded-[22px] sm:px-7">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#D8FF5B] text-xs font-bold text-black">
                        ✓
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {waitlistState.duplicate
                          ? "Waitlist Pass Already Active"
                          : "Early-Access Pass Issued"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyPassToClipboard(waitlistState.passCode)
                        }
                        title="Click to copy pass serial"
                        className="rounded border border-[#D8FF5B]/35 bg-[#D8FF5B]/10 px-2 py-0.5 font-mono text-[11px] text-[#D8FF5B] hover:bg-[#D8FF5B]/20 cursor-pointer"
                      >
                        {copiedPass ? "COPIED" : waitlistState.passCode}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Registered{" "}
                      <span className="font-mono text-zinc-200">
                        {email.trim().toLowerCase()}
                      </span>
                      . Your username claim link arrives on{" "}
                      <strong className="font-medium text-white">
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
                    <span>+ Add 11 Nov Calendar Alert (.ics)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
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
              Marketing & Inquiries
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
      {/* MODAL 1: MARKETING, PRESS & GENERAL INQUIRIES                     */}
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
          <div className="w-full max-w-md rounded-[26px] border border-white/[0.09] bg-white/[0.02] p-1.5 shadow-2xl">
            <div className="max-h-[88dvh] overflow-y-auto rounded-[20px] border border-white/[0.08] bg-[#090A0E] p-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
                <div>
                  <h2
                    id="contact-modal-title"
                    className="text-base font-semibold text-white"
                  >
                    Marketing & Inquiries
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Direct dispatch to the down. communications team.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  ESC
                </button>
              </div>

              {contactState.status !== "success" ? (
                <form onSubmit={handleContactSubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-300">
                      Department
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: "marketing", label: "Marketing" },
                          { id: "updates", label: "Updates" },
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
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-white/10 bg-[#050608] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[#D8FF5B]/70 focus:outline-none"
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
                      placeholder="Tell us about your marketing inquiry, partnership, or email update question…"
                      className="w-full rounded-xl border border-white/10 bg-[#050608] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[#D8FF5B]/70 focus:outline-none"
                    />
                  </div>

                  {contactState.status === "error" && (
                    <p role="alert" className="text-xs font-medium text-rose-400">
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
                      className="rounded-xl bg-[#D8FF5B] px-5 py-2.5 text-xs font-semibold text-black hover:bg-[#e3ff80] disabled:opacity-50 cursor-pointer"
                    >
                      {contactState.status === "submitting"
                        ? "Sending…"
                        : "Send Message"}
                    </button>
                  </div>
                </form>
              ) : (
                <div role="status" className="my-6 text-center">
                  <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#D8FF5B]/15 text-[#D8FF5B] font-bold">
                    ✓
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Inquiry logged
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Our team has received your message and will respond via
                    email.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModal("none")}
                    className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: PRIVACY & EMAIL COMMUNICATIONS POLICY                    */}
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
          <div className="w-full max-w-md rounded-[26px] border border-white/[0.09] bg-white/[0.02] p-1.5 shadow-2xl">
            <div className="max-h-[85dvh] overflow-y-auto rounded-[20px] border border-white/[0.08] bg-[#090A0E] p-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
                <div>
                  <h2
                    id="privacy-modal-title"
                    className="text-base font-semibold text-white"
                  >
                    Privacy & Email Policy
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    How down. handles pre-launch waitlist & marketing data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs leading-relaxed text-zinc-400">
                <div>
                  <h3 className="font-semibold text-white">
                    1. Pre-Release Data Collection
                  </h3>
                  <p className="mt-1">
                    We collect only your email address, pass serial, and
                    notification preference when you join the waitlist or submit
                    an inquiry.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    2. Milestone & Marketing Dispatches
                  </h3>
                  <p className="mt-1">
                    Your email is stored securely with Row-Level Security to
                    deliver your{" "}
                    <strong className="text-zinc-200">11 November 2026</strong>{" "}
                    initial username claim alert, our{" "}
                    <strong className="text-zinc-200">25 November 2026</strong>{" "}
                    launch notice, and opted-in marketing updates.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white">
                    3. Zero Third-Party Sharing
                  </h3>
                  <p className="mt-1">
                    We never sell, rent, or trade your email address. Every
                    dispatch contains a one-click unsubscribe link, or you can
                    request immediate data removal via our Inquiries panel.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
                <button
                  type="button"
                  onClick={openContactModal}
                  className="text-xs font-medium text-[#D8FF5B] hover:underline cursor-pointer"
                >
                  Contact Marketing / Privacy →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal("none")}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white hover:bg-white/10 cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
