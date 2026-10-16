// Re-mounts on every navigation, giving each page a soft fade-in (skipped under reduced motion).
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">{children}</div>;
}
