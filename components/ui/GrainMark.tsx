export function GrainMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 30V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="16" cy="7" rx="3.2" ry="5.5" fill="#D4A62A" />
      <ellipse cx="10.5" cy="13" rx="2.8" ry="5" fill="#D4A62A" transform="rotate(-35 10.5 13)" />
      <ellipse cx="21.5" cy="13" rx="2.8" ry="5" fill="#D4A62A" transform="rotate(35 21.5 13)" />
      <ellipse cx="11" cy="21" rx="2.6" ry="4.6" fill="#EBCB6E" transform="rotate(-40 11 21)" />
      <ellipse cx="21" cy="21" rx="2.6" ry="4.6" fill="#EBCB6E" transform="rotate(40 21 21)" />
    </svg>
  );
}
