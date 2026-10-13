import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { OnionStoryStrip } from "@/components/onion/OnionStoryStrip";
import { onionStoryBag } from "@/lib/onionStory";

/** Home-page teaser: the onion story as four frames, linking to the full scroll story. */
export function OnionTeaser() {
  return (
    <section aria-labelledby="onion-teaser-title" className="bg-[#F6E6E3] py-20 sm:py-24">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8E2F45]">The onion story</p>
            <h2 id="onion-teaser-title" className="mt-3 text-3xl font-semibold text-field sm:text-4xl">
              Pulled, cured, sorted, packed
            </h2>
            <p className="mt-3 text-soil/75">Every mesh bag goes through the same four steps before it reaches you.</p>
          </div>
          <Link
            href="/shop/onions#onion-story"
            className="inline-block py-2 text-sm font-semibold text-field underline decoration-[#8E2F45] decoration-2 underline-offset-4"
          >
            Watch the full story →
          </Link>
        </Reveal>
        <Reveal delay={0.1}>
          <OnionStoryStrip bag={onionStoryBag()} className="mt-10" />
        </Reveal>
      </div>
    </section>
  );
}
