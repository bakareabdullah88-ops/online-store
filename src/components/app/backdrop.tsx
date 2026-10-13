/** Tinted, slowly drifting colour field behind every signed-in page. */
export function AppBackdrop() {
  return (
    <div className="app-backdrop" aria-hidden>
      <span
        style={{
          background: "var(--blob-1)",
          width: "46vw",
          height: "46vw",
          left: "-10vw",
          top: "-14vw",
        }}
      />
      <span
        style={{
          background: "var(--blob-2)",
          width: "40vw",
          height: "40vw",
          right: "-8vw",
          top: "-6vw",
          animationDelay: "-8s",
        }}
      />
      <span
        style={{
          background: "var(--blob-3)",
          width: "36vw",
          height: "36vw",
          left: "20vw",
          bottom: "-18vw",
          animationDelay: "-14s",
        }}
      />
      <span
        style={{
          background: "var(--blob-4)",
          width: "28vw",
          height: "28vw",
          right: "4vw",
          bottom: "-10vw",
          animationDelay: "-4s",
        }}
      />
    </div>
  );
}
