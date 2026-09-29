const SOCIAL_LINKS = [
  {
    name: "فيسبوك",
    href: "https://www.facebook.com/Hlwany1s",
    bg: "#1877F2",
    svg: (
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    ),
  },
  {
    name: "إنستجرام",
    href: "https://www.instagram.com/hlwany1s",
    bg: "linear-gradient(45deg,#f58529,#dd2a7b,#8134af,#515bd4)",
    svg: (
      <path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.78.22 2.41.46.65.25 1.2.6 1.75 1.15.5.5.9 1.1 1.15 1.75.24.63.41 1.35.46 2.41.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.78-.46 2.41a4.9 4.9 0 0 1-1.15 1.75 4.9 4.9 0 0 1-1.75 1.15c-.63.24-1.35.41-2.41.46-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.78-.22-2.41-.46a4.9 4.9 0 0 1-1.75-1.15 4.9 4.9 0 0 1-1.15-1.75c-.24-.63-.41-1.35-.46-2.41C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.78.46-2.41.25-.65.6-1.2 1.15-1.75a4.9 4.9 0 0 1 1.75-1.15c.63-.24 1.35-.41 2.41-.46C8.94 2.01 9.28 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.17 1.17 0 1 0 0-2.34 1.17 1.17 0 0 0 0 2.34z" />
    ),
  },
  {
    name: "تيك توك",
    href: "https://www.tiktok.com/@hlwany1s",
    bg: "#000000",
    svg: (
      <path d="M16.6 2h-3.2v13.4a2.9 2.9 0 1 1-2.06-2.78V9.4a6.1 6.1 0 1 0 5.26 6.04V8.77a7.6 7.6 0 0 0 4.4 1.4V6.97a4.4 4.4 0 0 1-4.4-4.4V2z" />
    ),
  },
  {
    name: "تيليجرام",
    href: "https://t.me/Hlwany1S",
    bg: "#26A5E4",
    svg: (
      <path d="M21.8 4.2 18.7 19c-.24 1.05-.87 1.3-1.76.8l-4.86-3.58-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.97 9.05-8.18c.4-.35-.08-.55-.6-.2L6.1 12.1l-4.9-1.54c-1.06-.33-1.08-1.06.22-1.57L20.4 3.06c.89-.33 1.66.2 1.4 1.14z" />
    ),
  },
];

export function SiteFooter() {
  return (
    <footer style={{ width: "100%", borderTop: "1px solid rgba(25,246,167,.10)" }}>
      <div
        className="max-w-5xl mx-auto"
        style={{ width: "100%", boxSizing: "border-box", padding: "40px 20px" }}
      >
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://raw.githubusercontent.com/hlwany1s/Orders/refs/heads/main/hlwany_logo_final.png"
            alt="7lwany Store"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition hover:opacity-80"
                style={{ background: s.bg }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#ffffff">
                  {s.svg}
                </svg>
              </a>
            ))}
          </div>
          <p className="text-dim text-[11px]">© 7lwany Store</p>
        </div>
      </div>
    </footer>
  );
}
