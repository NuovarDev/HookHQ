"use client";

import Image from "next/image";

export function Header({ deployUrl, docsUrl, repoUrl }: { deployUrl: string; docsUrl: string; repoUrl: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-[color:color-mix(in_srgb,var(--bg)_84%,transparent)] px-5 py-4 backdrop-blur-[18px] max-[760px]:px-3">
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center border border-lineStrong bg-panelStrong">
          <Image src="/logo.svg" alt="HookHQ logo" width={32} height={32} className="invert brightness-0" />
        </div>
        <div>
          <strong className="block text-[0.95rem] uppercase tracking-[0.08em]">HookHQ</strong>
          <span className="block text-[0.8rem] text-muted">Open source Event Destinations infrastructure</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 max-[760px]:w-full max-[760px]:justify-stretch">
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-lineStrong bg-panel px-4 text-[0.92rem] font-semibold transition hover:-translate-y-px hover:border-foreground max-[760px]:flex-1"
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-lineStrong bg-panel px-4 text-[0.92rem] font-semibold transition hover:-translate-y-px hover:border-foreground max-[760px]:flex-1"
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-lineStrong bg-foreground px-4 text-[0.92rem] font-semibold text-background transition hover:-translate-y-px hover:border-foreground max-[760px]:flex-1"
          href={deployUrl}
          target="_blank"
          rel="noreferrer"
        >
          Deploy to Cloudflare
        </a>
      </div>
    </header>
  );
}
