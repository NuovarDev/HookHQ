"use client";

import Image from "next/image";

export function Header({ deployUrl, docsUrl, repoUrl }: { deployUrl: string; docsUrl: string; repoUrl: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color:color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-[1360px] grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        <a href="/" aria-label="Homepage" className="nav-wordmark">
          <Image src="/img/logo.svg" alt="" width={555} height={405} />
          <span>HookHQ</span>
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-8 text-sm text-muted lg:flex">
          <a className="nav-link" href="#features">Features</a>
          <a className="nav-link" href={docsUrl} target="_blank" rel="noreferrer">Docs</a>
          <a className="nav-link" href={repoUrl} target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <div className="flex items-center justify-end gap-2">
          <a className="header-link lg:hidden" href={docsUrl} target="_blank" rel="noreferrer">Docs</a>
          <a
            className="header-deploy"
            href={deployUrl}
            target="_blank"
            rel="noreferrer"
          >
            Deploy to Cloudflare
          </a>
        </div>
      </div>
    </header>
  );
}
