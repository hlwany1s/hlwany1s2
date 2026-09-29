export function SupportButton() {
  return (
    <a
      href="https://t.me/Hlwany1S"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معانا على تيليجرام"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 50,
        width: "56px",
        height: "56px",
        borderRadius: "999px",
        background: "#26A5E4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 20px rgba(0,0,0,.35)",
      }}
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="#ffffff">
        <path d="M21.8 4.2 18.7 19c-.24 1.05-.87 1.3-1.76.8l-4.86-3.58-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.97 9.05-8.18c.4-.35-.08-.55-.6-.2L6.1 12.1l-4.9-1.54c-1.06-.33-1.08-1.06.22-1.57L20.4 3.06c.89-.33 1.66.2 1.4 1.14z" />
      </svg>
    </a>
  );
}
