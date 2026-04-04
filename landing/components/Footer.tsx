import Image from "next/image";

export function Footer({ deployUrl, docsUrl, repoUrl }: { deployUrl: string; docsUrl: string; repoUrl: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-line pt-10 text-[0.98rem] text-muted">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-3 text-[1.8rem] tracking-[-0.03em] text-foreground">
            <div className="flex h-9 w-9 items-center justify-center border border-lineStrong bg-panelStrong">
              <Image src="/logo.svg" alt="HookHQ logo" width={32} height={32} className="invert brightness-0" />
            </div>
            <span>HookHQ</span>
          </div>
          <p className="max-w-sm leading-[1.6]">
            Open source Event Destinations infrastructure for durable delivery, routing control, retries, and operator
            visibility.
          </p>
        </div>

        <div>
          <strong className="mb-4 block text-[1rem] font-semibold text-foreground">Product</strong>
          <div className="flex flex-col gap-3">
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <a href={deployUrl} target="_blank" rel="noreferrer" className="transition hover:text-foreground">
              Deploy
            </a>
          </div>
        </div>

        <div>
          <strong className="mb-4 block text-[1rem] font-semibold text-foreground">Resources</strong>
          <div className="flex flex-col gap-3">
            <a href={docsUrl} target="_blank" rel="noreferrer" className="transition hover:text-foreground">
              Documentation
            </a>
            <a href={repoUrl} target="_blank" rel="noreferrer" className="transition hover:text-foreground">
              GitHub Repository
            </a>
            <a href="https://eventdestinations.org" target="_blank" rel="noreferrer" className="transition hover:text-foreground">
              Event Destinations
            </a>
          </div>
        </div>

        <div>
          <strong className="mb-4 block text-[1rem] font-semibold text-foreground">Company</strong>
          <div className="flex flex-col gap-3">
            <a
              href="https://www.nuovar.com/?utm_source=hookhq&utm_medium=footer"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-foreground"
            >
              About
            </a>
            <a
              href="mailto:hello@nuovar.com"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-foreground"
            >
              Contact
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-line pt-8 text-center text-[0.95rem]">
        &copy; {year}{" "}
        <a
          href="https://nuovar.com"
          target="_blank"
          rel="noreferrer"
          className="transition-all hover:underline text-foreground"
        >
          Nuovar LLC
        </a>
        . All rights reserved.
      </div>
    </footer>
  );
}
