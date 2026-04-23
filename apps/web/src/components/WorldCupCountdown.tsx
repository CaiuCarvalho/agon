"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";

// Abertura da Copa do Mundo FIFA 2026 — Estádio Azteca (México).
// 11 de junho de 2026, 12:00 horário local (UTC-6) = 18:00 UTC.
const KICKOFF_UTC = Date.UTC(2026, 5, 11, 18, 0, 0);

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function computeTimeLeft(nowMs: number): TimeLeft {
  const diff = Math.max(0, KICKOFF_UTC - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: diff === 0,
  };
}

function pad(value: number, length = 2): string {
  return value.toString().padStart(length, "0");
}

function Unit({ value, label, width = 2 }: { value: number | null; label: string; width?: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full rounded-2xl md:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-6 md:px-8 md:py-10 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-px bg-white/10"
        />
        <span
          className="block font-display font-black italic uppercase tracking-tighter text-white text-5xl md:text-7xl lg:text-8xl leading-none tabular-nums text-center"
          suppressHydrationWarning
        >
          {value === null ? "--".repeat(width / 2 || 1) : pad(value, width)}
        </span>
      </div>
      <span className="mt-4 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/60">
        {label}
      </span>
    </div>
  );
}

export default function WorldCupCountdown() {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const tick = () => setTime(computeTimeLeft(Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const done = time?.done ?? false;

  return (
    <section className="relative overflow-hidden bg-black py-24 md:py-32 border-y border-white/10">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(0,156,59,0.6) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,221,0,0.35) 0%, transparent 50%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-20 -right-24 h-80 w-80 md:h-[28rem] md:w-[28rem] rounded-full bg-primary/20 blur-3xl"
      />

      <div className="container relative z-10 mx-auto px-6 md:px-12">
        <div className="flex flex-col items-center text-center mb-14 md:mb-20">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-5 w-5 text-primary" />
            <p className="text-primary font-black uppercase tracking-[0.5em] text-[10px] md:text-xs">
              Contagem Regressiva
            </p>
          </div>
          <h2 className="font-display text-white uppercase italic tracking-tighter font-black leading-[0.85] text-6xl md:text-8xl lg:text-9xl">
            COPA DO MUNDO <br />
            <span className="text-primary">2026</span>
          </h2>
          <div className="h-1 w-20 bg-primary mt-8" />
          <p className="mt-8 max-w-2xl text-white/70 text-sm md:text-base font-medium leading-relaxed">
            11 de junho de 2026 · Estádio Azteca · Cidade do México. Prepare o
            manto, a nação veste verde e amarelo.
          </p>
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center gap-6">
            <h3 className="font-display text-4xl md:text-6xl uppercase italic tracking-tighter text-white">
              A <span className="text-primary">HORA</span> CHEGOU
            </h3>
            <p className="text-white/70 max-w-xl">
              A Copa do Mundo 2026 começou. Vista a camisa, viva a história.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 md:gap-6 max-w-5xl mx-auto">
            <Unit value={time?.days ?? null} label="Dias" width={3} />
            <Unit value={time?.hours ?? null} label="Horas" />
            <Unit value={time?.minutes ?? null} label="Minutos" />
            <Unit value={time?.seconds ?? null} label="Segundos" />
          </div>
        )}

        <div className="mt-14 md:mt-20 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 max-w-5xl mx-auto">
          <div className="flex items-center gap-6 md:gap-8">
            <div className="relative h-20 w-28 md:h-24 md:w-36 shrink-0">
              <img
                src="https://res.cloudinary.com/dbcy4h37x/image/upload/v1775188056/ikq1whvviiqvpsoiuxpp.jpg"
                alt="Copa do Mundo 2026"
                className="absolute inset-0 w-full h-full object-contain invert brightness-0 opacity-90"
              />
            </div>
            <div className="text-left">
              <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-1">
                Rumo ao Hexa
              </p>
              <p className="font-display text-2xl md:text-3xl uppercase italic tracking-tighter text-white leading-none">
                Coleção <span className="text-primary">Oficial</span> <br />
                chegando em breve
              </p>
            </div>
          </div>

          <Link
            href="/products"
            className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 font-display text-base md:text-lg uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-primary/40"
          >
            Vestir o Manto
          </Link>
        </div>
      </div>
    </section>
  );
}
