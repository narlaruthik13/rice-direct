import { useId } from "react";

// Mesh onion bag with bulbs showing through and a card tag (farmer, variety,
// weight, batch). Drawn in the same 240x300 box as RiceBag so they swap cleanly.

interface OnionBagProps {
  farmerName: string;
  variety: string;
  weightKg: number;
  batchId: string;
  /** Bulb skin colour, from the category's varietyColors. */
  bulbColor?: string;
  accent?: string;
}

// Bulb positions inside the sack: [cx, cy, r]
const BULBS: [number, number, number][] = [
  [86, 92, 22], [128, 84, 24], [166, 100, 21],
  [70, 140, 23], [112, 132, 25], [156, 146, 24], [190, 136, 18],
  [62, 192, 22], [100, 184, 24], [142, 196, 25], [182, 186, 22],
  [80, 238, 23], [122, 244, 25], [164, 236, 23],
];

const SACK = "M100,54 C62,72 40,140 42,208 C44,262 80,292 120,292 C160,292 196,262 198,208 C200,140 178,72 140,54 Z";

export function OnionBagShape({ farmerName, variety, weightKg, batchId, bulbColor = "#8E2F45", accent = "#2F4A2A" }: OnionBagProps) {
  const id = useId().replace(/:/g, "");
  const nameLines = farmerName.split(" ");
  const nameY = 158;
  const afterName = nameY + (nameLines.length - 1) * 15;

  return (
    <g>
      <defs>
        <clipPath id={`${id}-sack`}>
          <path d={SACK} />
        </clipPath>
        <pattern id={`${id}-mesh`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0,0 V9 M0,0 H9" stroke="#C8462C" strokeWidth="1.8" />
        </pattern>
        <radialGradient id={`${id}-bulb`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="0.45" stopColor={bulbColor} stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.25" />
        </radialGradient>
      </defs>

      {/* Gathered neck and twine tie */}
      <path d="M100,56 L110,30 L130,30 L140,56 Z" fill="#B8432B" />
      <path d="M100,56 L110,30 L130,30 L140,56 Z" fill={`url(#${id}-mesh)`} opacity="0.6" />
      <rect x="104" y="34" width="32" height="8" rx="3" fill="#D9A441" stroke="#A67E12" strokeWidth="1" />

      {/* Bulbs seen through the mesh */}
      <g clipPath={`url(#${id}-sack)`}>
        <rect x="30" y="40" width="180" height="260" fill="#4A2A22" />
        {BULBS.map(([cx, cy, r], i) => (
          <g key={i}>
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.92} fill={bulbColor} />
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.92} fill={`url(#${id}-bulb)`} />
            <path
              d={`M${cx},${cy - r * 0.9} Q${cx + r * 0.35},${cy} ${cx},${cy + r * 0.9}`}
              stroke="#000000"
              strokeOpacity="0.15"
              fill="none"
            />
          </g>
        ))}
        <rect x="30" y="40" width="180" height="260" fill={`url(#${id}-mesh)`} />
      </g>
      <path d={SACK} fill="none" stroke="#9E3622" strokeWidth="2" />

      {/* Card tag */}
      <rect x="70" y="112" width="100" height="126" rx="6" fill="#FBF6EA" stroke={accent} strokeWidth="2" />
      <circle cx="120" cy="122" r="3" fill="#FFFFFF" stroke={accent} strokeWidth="1.2" />
      <text x="120" y="139" textAnchor="middle" fontSize="7.5" letterSpacing="2" fontWeight="700" fill={accent}>
        KISA
      </text>
      <line x1="84" x2="156" y1="145" y2="145" stroke={accent} strokeOpacity="0.3" />
      {nameLines.map((line, i) => (
        <text
          key={i}
          x="120"
          y={nameY + i * 15}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#2E2219"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {line}
        </text>
      ))}
      <text x="120" y={afterName + 16} textAnchor="middle" fontSize="8.5" fill="#5A4636">
        {variety} onions
      </text>
      <text x="120" y={afterName + 38} textAnchor="middle" fontSize="17" fontWeight="800" fill={accent}>
        {weightKg} kg
      </text>
      <text x="120" y="230" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#5A4636">
        {batchId}
      </text>
    </g>
  );
}
