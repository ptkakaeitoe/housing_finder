"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 py-12 text-ink sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:gap-16 lg:px-12">
        <div className="max-w-2xl">
          <h2 className="text-[clamp(2.75rem,6vw,5rem)] leading-[.98] font-extrabold tracking-[-.075em]">
            Find a place<br />that feels like<br /><span className="text-accent">home.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">Search the area, compare rent and arrange a visit.</p>
          <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-accent underline underline-offset-4">Explore homes ↗</Link>
        </div>
        <div className="relative min-w-0">
          <div className="overflow-hidden rounded-[2rem] border border-line bg-surface p-2 shadow-2xl">
            <div className="relative h-[300px] overflow-hidden rounded-[1.5rem] sm:h-[400px]">
              <img src="/images/housing-hero.jpg" alt="Modern housing exterior" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <div className="absolute right-5 bottom-5 left-5 rounded-2xl border border-white/30 bg-white/90 p-5 text-[#171b20] backdrop-blur-md dark:bg-[#1a2026]/90 dark:text-white">
                <p className="text-lg font-semibold tracking-tight">Closer to campus.</p>
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}
