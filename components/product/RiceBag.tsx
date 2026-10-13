import { useId } from "react";

// Jute-style rice sack with a printed label (farmer, variety, weight, batch).
// RiceBagShape is a bare <g> (bag drawn in a 240x300 box) so the hero's
// RicePour can embed and animate it; RiceBag wraps it in its own <svg>.
// Hooks for animation: .rb-sack (whole sack) and .rb-mound (rice at the mouth).

interface RiceBagProps {
  farmerName: string;
  variety: string;
  weightKg: number;
  batchId: string;
  aged?: boolean;
}

export function RiceBagShape({ farmerName, variety, weightKg, batchId, aged = false }: RiceBagProps) {
  const id = useId().replace(/:/g, "");
  const accent = aged ? "#8B5E3C" : "#2F4A2A";
  const nameLines = farmerName.split(" ");
  const nameY = 152;
  const afterName = nameY + (nameLines.length - 1) * 17;

  return (
    <g>
      <defs>
        <pattern id={`${id}-jute`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#C8A16B" />
          <path d="M0,1.5 H6" stroke="#A97F4B" strokeOpacity="0.55" strokeWidth="1.2" />
          <path d="M1.5,0 V6" stroke="#A97F4B" strokeOpacity="0.3" strokeWidth="1" />
        </pattern>
      </defs>

      <g className="rb-sack">
        {/* Open mouth with rice heaped inside */}
        <ellipse cx="120" cy="44" rx="76" ry="12" fill="#5C3B22" />
        <g className="rb-mound">
          <path d="M50,46 Q120,6 190,46 Q120,58 50,46 Z" fill="#FBF7EE" />
          <g fill="#E6DCC6">
            <ellipse cx="96" cy="36" rx="4" ry="1.6" transform="rotate(-20 96 36)" />
            <ellipse cx="122" cy="30" rx="4" ry="1.6" transform="rotate(15 122 30)" />
            <ellipse cx="144" cy="38" rx="4" ry="1.6" transform="rotate(-35 144 38)" />
            <ellipse cx="110" cy="42" rx="4" ry="1.6" transform="rotate(40 110 42)" />
          </g>
        </g>

        {/* Sack body */}
        <path
          d="M44,52 C30,120 24,220 34,272 Q120,302 206,272 C216,220 210,120 196,52 Q120,64 44,52 Z"
          fill={`url(#${id}-jute)`}
          stroke="#8A6638"
          strokeWidth="2"
        />
        {/* Folded, stitched top band */}
        <path d="M42,44 Q120,58 198,44 L197,64 Q120,78 43,64 Z" fill="#B48D58" stroke="#8A6638" strokeWidth="1.5" />
        <path d="M48,58 Q120,71 192,58" fill="none" stroke="#6B4A2E" strokeWidth="1.2" strokeDasharray="4 3" />

        {/* Label */}
        <rect x="64" y="104" width="112" height="132" rx="6" fill="#FBF6EA" stroke={accent} strokeWidth="2" />
        <text x="120" y="122" textAnchor="middle" fontSize="8" letterSpacing="2" fontWeight="700" fill={accent}>
          KISA
        </text>
        <line x1="80" x2="160" y1="130" y2="130" stroke={accent} strokeOpacity="0.3" />
        {nameLines.map((line, i) => (
          <text
            key={i}
            x="120"
            y={nameY + i * 17}
            textAnchor="middle"
            fontSize="15"
            fontWeight="700"
            fill="#2E2219"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {line}
          </text>
        ))}
        <text x="120" y={afterName + 18} textAnchor="middle" fontSize="9" fill="#5A4636">
          {variety}
        </text>
        <text x="120" y={afterName + 42} textAnchor="middle" fontSize="18" fontWeight="800" fill={accent}>
          {weightKg} kg
        </text>
        <text x="120" y="228" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#5A4636">
          {batchId}
        </text>
      </g>
    </g>
  );
}

export function RiceBag({ className = "", ...props }: RiceBagProps & { className?: string }) {
  return (
    <svg
      viewBox="20 18 200 288"
      className={className}
      role="img"
      aria-label={`${props.weightKg} kg bag of ${props.variety} from ${props.farmerName}`}
    >
      <RiceBagShape {...props} />
    </svg>
  );
}
