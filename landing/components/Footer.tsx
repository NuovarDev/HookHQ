import Image from "next/image";

function ExternalLinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function Footer({ deployUrl, docsUrl, repoUrl }: { deployUrl: string; docsUrl: string; repoUrl: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-28 pt-16 sm:mt-36 sm:pt-20">
      <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:gap-8 mb-16">
        <div className="footer-column">
          <strong>Product</strong>
          <a href="#features">Features</a>
          <a href={deployUrl} target="_blank" rel="noreferrer">Deploy</a>
        </div>
        <div className="footer-column">
          <strong>Resources</strong>
          <a href={docsUrl} target="_blank" rel="noreferrer">Documentation <ExternalLinkIcon /></a>
          <a href="https://eventdestinations.org" target="_blank" rel="noreferrer">Event Destinations <ExternalLinkIcon /></a>
        </div>
        <div className="footer-column">
          <strong>Company</strong>
          <a href="https://www.nuovar.com/?utm_source=hookhq&utm_medium=footer" target="_blank" rel="noreferrer">About <ExternalLinkIcon /></a>
          <a href="mailto:hello@nuovar.com">Contact</a>
        </div>
        <div className="footer-column">
          <strong>Open source</strong>
          <a href={repoUrl} target="_blank" rel="noreferrer">GitHub <ExternalLinkIcon /></a>
          <a href={`${repoUrl}/blob/main/LICENSE.md`} target="_blank" rel="noreferrer">MIT License <ExternalLinkIcon /></a>
        </div>
      </div>

      <div className="footer-wordmark" aria-hidden="true">
        <Image src="/img/logo.svg" alt="" width={512} height={512} />
        <span>HookHQ</span>
      </div>

      <div className="footer-legal">
        <span>&copy; {year} Nuovar LLC. All rights reserved.</span>
        <span>Open source Event Destinations infrastructure.</span>
      </div>
    </footer>
  );
}
