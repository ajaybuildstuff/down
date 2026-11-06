"use client";

import React, { useEffect, useState } from "react";

// Milestones (IST / UTC+05:30)
const USERNAME_OPEN_DATE = new Date("2026-11-11T00:00:00+05:30").getTime();
const LAUNCH_DATE = new Date("2026-11-25T00:00:00+05:30").getTime();

export interface TimeSnapshot {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  tenths: string;
  rawSeconds: number;
  usernameDaysLeft: number;
  usernameHoursLeft: number;
  istFormatted: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const SIXTY_TICKS = Array.from({ length: 60 }, (_, i) => i);

export function getSnapshot(): TimeSnapshot {
  const now = Date.now();
  const diffLaunch = Math.max(0, LAUNCH_DATE - now);

  const d = Math.floor(diffLaunch / 86_400_000);
  const h = Math.floor((diffLaunch / 3_600_000) % 24);
  const m = Math.floor((diffLaunch / 60_000) % 60);
  const s = Math.floor((diffLaunch / 1000) % 60);
  const tenths = Math.floor((diffLaunch % 1000) / 100);

  const diffUsername = Math.max(0, USERNAME_OPEN_DATE - now);
  const usernameDaysLeft = Math.floor(diffUsername / 86_400_000);
  const usernameHoursLeft = Math.floor((diffUsername / 3_600_000) % 24);

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
    tenths: String(tenths),
    rawSeconds: s,
    usernameDaysLeft,
    usernameHoursLeft,
    istFormatted,
  };
}

function DrumDigit({ char }: { char: string }) {
  const n = Number.parseInt(char, 10);
  const isNum = !Number.isNaN(n) && n >= 0 && n <= 9;

  if (!isNum) {
    return <span className="inline-flex h-[1.08em] items-center">{char}</span>;
  }

  return (
    <span
      className="relative inline-block h-[1.08em] w-[0.58em] overflow-hidden align-bottom select-none"
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
            className="flex h-[1.08em] items-center justify-center leading-none"
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
    <span className="inline-flex items-center tracking-[-0.055em] tabular-nums">
      {value.split("").map((ch, idx) => (
        <DrumDigit key={idx} char={ch} />
      ))}
    </span>
  );
}

export function MonumentalTimepiece() {
  const [snap, setSnap] = useState<TimeSnapshot>({
    days: "18",
    hours: "10",
    minutes: "00",
    seconds: "00",
    tenths: "0",
    rawSeconds: 0,
    usernameDaysLeft: 4,
    usernameHoursLeft: 10,
    istFormatted: "--:--:--",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSnap(getSnapshot());

    const timer = window.setInterval(() => {
      setSnap(getSnapshot());
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

  const units = [
    { label: "DAYS", sub: "24H CYCLE", value: snap.days, isLive: false },
    { label: "HOURS", sub: "IST SYNC", value: snap.hours, isLive: false },
    { label: "MINUTES", sub: "60M WINDOW", value: snap.minutes, isLive: false },
    { label: "SECONDS", sub: `.${snap.tenths}s PULSE`, value: snap.seconds, isLive: true },
  ];

  const activeTickIndex = mounted ? (60 - snap.rawSeconds) % 60 : 0;

  return (
    <section aria-label="Global launch countdown" className="w-full">
      {/* Outer Machined Chassis */}
      <div className="rounded-[28px] border border-white/[0.09] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-1.5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] sm:rounded-[36px] sm:p-2.5">
        <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#07080B] sm:rounded-[28px]">
          {/* Top Specular Edge */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          {/* Telemetry Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-[#090B0F] px-5 py-3.5 text-xs sm:px-8">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D8FF5B] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D8FF5B]" />
              </span>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-200">
                GLOBAL LAUNCH CHRONOMETER
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400 tabular-nums">
              <span className="hidden sm:inline text-zinc-500">
                IST {mounted ? snap.istFormatted : "--:--:--"}
              </span>
              <span className="hidden sm:inline text-white/15">|</span>
              <span className="rounded bg-white/[0.04] px-2 py-0.5 text-zinc-200 border border-white/[0.06]">
                TARGET · 25 NOV 2026
              </span>
            </div>
          </div>

          {/* 4-Across Monumental Horological Grid */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.06] sm:grid-cols-4">
            {units.map((unit) => (
              <div
                key={unit.label}
                className="relative flex flex-col justify-between bg-[#07080B] px-4 py-5 sm:px-6 sm:py-8"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-zinc-400">
                    {unit.label}
                  </span>
                  <span
                    className={`font-mono text-[10px] tabular-nums ${
                      unit.isLive ? "text-[#D8FF5B]" : "text-zinc-600"
                    }`}
                  >
                    {unit.sub}
                  </span>
                </div>

                {/* Deep Recessed Mechanical Drum Well */}
                <div className="relative my-3 flex items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-[#030406] py-5 shadow-[inset_0_8px_32px_rgba(0,0,0,0.95)] sm:my-5 sm:py-8">
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/[0.05]" />
                  <div
                    className={`font-mono text-[clamp(3.85rem,9.8vw,7.75rem)] font-bold leading-none ${
                      unit.isLive
                        ? "text-[#D8FF5B] drop-shadow-[0_0_28px_rgba(216,255,91,0.22)]"
                        : "text-[#F4F4F0]"
                    }`}
                  >
                    <DrumPair value={unit.value} />
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                  <span>{unit.isLive ? "ACTIVE STREAM" : "LOCKED"}</span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      unit.isLive ? "bg-[#D8FF5B]" : "bg-white/15"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 60-Second Vernier Scale */}
          <div className="border-t border-white/[0.06] bg-[#050608] px-5 pt-4 pb-3 sm:px-8">
            <div
              aria-hidden="true"
              className="grid gap-[2px] sm:gap-1"
              style={{ gridTemplateColumns: "repeat(60, minmax(0, 1fr))" }}
            >
              {SIXTY_TICKS.map((t) => {
                const isMajor = t % 5 === 0;
                const isLit = mounted && t <= activeTickIndex;
                const isHead = mounted && t === activeTickIndex;
                return (
                  <span
                    key={t}
                    className={`rounded-full transition-colors duration-200 ${
                      isMajor ? "h-2.5" : "h-1.5 self-center"
                    } ${
                      isHead
                        ? "bg-[#D8FF5B] shadow-[0_0_8px_#D8FF5B]"
                        : isLit
                        ? "bg-[#D8FF5B]/55"
                        : "bg-white/[0.07]"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* 2-Stage Release Schedule Deck */}
          <div className="grid grid-cols-1 gap-px border-t border-white/[0.06] bg-white/[0.06] sm:grid-cols-2">
            {/* Phase 01: 11 Nov */}
            <div className="flex items-center justify-between bg-[#08090D] px-5 py-4 sm:px-7">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D8FF5B]" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#D8FF5B]">
                    PHASE 01 · USERNAME DROP
                  </span>
                </div>
                <p className="text-xs font-medium text-zinc-200">
                  Initial handle reservation opens
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="block text-xs font-semibold text-white">
                  11 NOV 2026
                </span>
                <span className="text-[10px] text-[#D8FF5B]">
                  {mounted
                    ? `${snap.usernameDaysLeft}d ${snap.usernameHoursLeft}h left`
                    : "Upcoming"}
                </span>
              </div>
            </div>

            {/* Phase 02: 25 Nov */}
            <div className="flex items-center justify-between bg-[#08090D] px-5 py-4 sm:px-7">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                    PHASE 02 · PUBLIC RELEASE
                  </span>
                </div>
                <p className="text-xs font-medium text-zinc-200">
                  Global platform goes live
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="block text-xs font-semibold text-white">
                  25 NOV 2026
                </span>
                <span className="text-[10px] text-zinc-500">00:00 IST</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
