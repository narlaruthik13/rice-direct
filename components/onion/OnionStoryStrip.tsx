import { OnionScene, type OnionBagInfo } from "@/components/onion/OnionScene";

// The onion story as four static frames: the same OnionScene with its CSS
// variables pinned. Used as the reduced-motion fallback on /shop/onions and as
// the home-page teaser.

export function onionCaptions(farmerName: string) {
  const first = farmerName.split(" ")[0];
  return [
    {
      key: "pull",
      step: "01",
      title: "Pull",
      text: `When the tops fall over, ${first} lifts the bulbs out of the soil by hand.`,
      vars: { "--os-pull": 1, "--os-dry": 0, "--os-sort": 0, "--os-pack": 0 },
    },
    {
      key: "dry",
      step: "02",
      title: "Cure in the sun",
      text: "10 to 15 days in the sun seal the necks and turn the skins papery and deep red, so they keep for weeks.",
      vars: { "--os-pull": 1, "--os-dry": 1, "--os-sort": 0, "--os-pack": 0 },
    },
    {
      key: "sort",
      step: "03",
      title: "Sort by size",
      text: "At the packhouse, a sizing line drops every bulb into Small, Medium or Large.",
      vars: { "--os-pull": 1, "--os-dry": 1, "--os-sort": 1, "--os-pack": 0 },
    },
    {
      key: "pack",
      step: "04",
      title: "Pack",
      text: "Into a breathable mesh bag, tagged with the farmer's name and batch.",
      vars: { "--os-pull": 1, "--os-dry": 1, "--os-sort": 1, "--os-pack": 1 },
    },
  ] as const;
}

export function OnionStoryStrip({ bag, className = "" }: { bag: OnionBagInfo; className?: string }) {
  return (
    <ol className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {onionCaptions(bag.farmerName).map((c) => (
        <li key={c.key} className="overflow-hidden rounded-2xl bg-white/75 shadow-card ring-1 ring-husk/10">
          <OnionScene
            bag={bag}
            vars={c.vars}
            viewBox="330 180 540 430"
            preserveAspectRatio="xMidYMid slice"
            className="aspect-[5/4] w-full"
            label={`${c.title}: ${c.text}`}
          />
          <div className="p-5">
            <p className="text-xs font-bold tracking-widest text-[#8E2F45]">{c.step}</p>
            <h3 className="mt-1 text-xl font-semibold text-field">{c.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-soil/75">{c.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
