"use client";

import { useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import type { FarmerPurchase, Product, SalesModel } from "@/lib/types";
import { PriceBreakdown } from "@/components/product/PriceBreakdown";

export interface ModelExample {
  product: Product;
  farmerName: string;
  partnerName: string;
  purchase?: FarmerPurchase;
}

const MODELS: { value: SalesModel; label: string; sub: string }[] = [
  { value: "FARMER_OWNED", label: "Farmer-Owned", sub: "Farmer sells, partner is paid a fee" },
  { value: "PARTNER_SOURCED", label: "Partner-Direct", sub: "Partner buys from the farmer" },
];

const STEPS: Record<SalesModel, { title: string; text: string }[]> = {
  FARMER_OWNED: [
    { title: "Farmer", text: "Grows the crop and keeps ownership all the way to you. Sets the price and keeps the biggest share." },
    {
      title: "Mill / Packhouse",
      text: "Processes the harvest as a paid service (milling rice, curing and grading onions) for a fixed fee per kg. It never buys the crop.",
    },
    { title: "You", text: "Buy straight from the farmer and see the farmer's share, the processing fee and our fee." },
  ],
  PARTNER_SOURCED: [
    { title: "Farmer", text: "Sells the harvest to a partner at a published price, paid up front, and stays named on every pack." },
    { title: "Mill / Packhouse", text: "Buys the crop, processes and packs it, and adds a visible margin." },
    { title: "You", text: "Buy from the partner and still see who grew it and exactly what they were paid." },
  ],
};

// Node positions along the track (percent of width).
const X = { farmer: "13%", partner: "50%", you: "87%" };
const DURATION = 3.2;

function Node({ x, label, icon, pulse }: { x: string; label: string; icon: JSX.Element; pulse?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute top-0 z-10 flex w-24 -translate-x-1/2 flex-col items-center" style={{ left: x }}>
      <motion.span
        className="grid h-14 w-14 place-items-center rounded-full bg-field text-rice ring-4 ring-rice"
        animate={pulse && !reduce ? { scale: [1, 1, 1.12, 1, 1.12, 1, 1] } : { scale: 1 }}
        transition={{ duration: DURATION, times: [0, 0.34, 0.42, 0.5, 0.56, 0.62, 1] }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon}
        </svg>
      </motion.span>
      <span className="mt-2 text-center text-xs font-semibold leading-tight text-soil sm:text-sm">{label}</span>
    </div>
  );
}

/** Farmer → Partner → You, with who owns the crop and which way the money moves. */
function FlowDiagram({ model, run }: { model: SalesModel; run: number }) {
  const reduce = useReducedMotion();
  const farmerOwned = model === "FARMER_OWNED";
  const timed = (times: number[]): Transition => (reduce ? { duration: 0 } : { duration: DURATION, times, ease: "easeInOut" });

  return (
    <div className="relative mx-auto h-48 max-w-2xl" aria-hidden="true">
      {/* Owner tag lane */}
      <motion.span
        key={`owner-${model}-${run}`}
        className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-paddy px-2.5 py-1 text-[11px] font-bold text-soil shadow-sm"
        initial={{ left: X.farmer }}
        animate={{ left: farmerOwned ? X.farmer : reduce ? X.partner : [X.farmer, X.farmer, X.partner, X.partner] }}
        transition={timed([0, 0.15, 0.32, 1])}
      >
        Owns the crop
      </motion.span>

      {/* Track + nodes */}
      <div className="absolute inset-x-0 top-10">
        <div className="absolute left-[13%] right-[13%] top-7 h-1 -translate-y-1/2 rounded-full bg-husk/20" />
        <Node
          x={X.farmer}
          label="Farmer"
          icon={<path d="M12 21v-8m0 0c0-4 3-6 7-6 0 4-3 6-7 6Zm0 0C12 9 9 7 5 7c0 4 3 6 7 6ZM4 21h16" />}
        />
        <Node
          x={X.partner}
          label="Mill / Packhouse"
          pulse
          icon={<path d="M3 10l9-6 9 6v10H3V10Zm5 10v-6h8v6" />}
        />
        <Node x={X.you} label="You" icon={<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />} />

        {/* The produce travelling to you (passes behind the nodes) */}
        <motion.span
          key={`bag-${model}-${run}`}
          className="absolute top-7 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-husk-light text-rice shadow"
          initial={{ left: X.farmer }}
          animate={{ left: reduce ? X.you : [X.farmer, X.farmer, X.partner, X.partner, X.you] }}
          transition={timed([0, 0.1, 0.34, 0.62, 0.92])}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 7c0-2 2-3 5-3s5 1 5 3l1 13H6L7 7Z" strokeLinejoin="round" />
          </svg>
        </motion.span>
      </div>

      {/* Money lane: who pays whom between farmer and partner */}
      <motion.span
        key={`money-${model}-${run}`}
        className={`absolute top-36 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${
          farmerOwned ? "bg-field/10 text-field ring-1 ring-field/30" : "bg-paddy/20 text-husk-dark ring-1 ring-husk/30"
        }`}
        initial={{ left: farmerOwned ? X.farmer : X.partner, opacity: 0 }}
        animate={
          reduce
            ? { left: "31.5%", opacity: 1 }
            : {
                left: farmerOwned ? [X.farmer, X.farmer, X.partner, X.partner] : [X.partner, X.partner, X.farmer, X.farmer],
                opacity: [0, 1, 1, 0.9],
              }
        }
        transition={timed(farmerOwned ? [0, 0.38, 0.6, 1] : [0, 0.12, 0.3, 1])}
      >
        {farmerOwned ? "Fee ₹ →" : "← ₹ Price paid"}
      </motion.span>
    </div>
  );
}

export function ModelExplainer({ examples }: { examples: Record<SalesModel, ModelExample> }) {
  const [model, setModel] = useState<SalesModel>("FARMER_OWNED");
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  const example = examples[model];

  const select = (next: SalesModel) => {
    setModel(next);
    setRun((r) => r + 1);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = model === "FARMER_OWNED" ? "PARTNER_SOURCED" : "FARMER_OWNED";
    select(next);
    document.getElementById(`model-tab-${next}`)?.focus();
  };

  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label="Sales model"
        onKeyDown={onKeyDown}
        className="mx-auto grid max-w-xl grid-cols-2 gap-1 rounded-2xl bg-rice-dim p-1.5"
      >
        {MODELS.map((m) => {
          const active = model === m.value;
          return (
            <button
              key={m.value}
              id={`model-tab-${m.value}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="model-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => select(m.value)}
              className={`relative rounded-xl px-3 py-2.5 text-left transition-colors ${active ? "text-rice" : "text-soil/75 hover:text-field"}`}
            >
              {active && (
                <motion.span
                  layoutId="model-tab-bg"
                  className="absolute inset-0 rounded-xl bg-field shadow"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative block text-sm font-semibold">{m.label}</span>
              <span className={`relative block text-xs ${active ? "text-rice/75" : "text-soil/60"}`}>{m.sub}</span>
            </button>
          );
        })}
      </div>

      <div id="model-panel" role="tabpanel" aria-labelledby={`model-tab-${model}`} className="mt-8">
        <div className="overflow-hidden rounded-2xl bg-white/70 px-4 pt-6 shadow-card ring-1 ring-husk/10 sm:px-8">
          <FlowDiagram model={model} run={run} />
          {/* Always rendered (server can't know the motion preference); hidden by CSS when reduced. */}
          <div className="flex justify-end pb-3 motion-reduce:invisible">
            <button type="button" onClick={() => setRun((r) => r + 1)} className="px-2 py-2 text-xs font-semibold text-field hover:underline">
              ↻ Replay
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.ol
            key={model}
            className="mt-6 grid gap-6 md:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {STEPS[model].map((step, i) => (
              <motion.li
                key={step.title}
                className="rounded-2xl bg-white/70 p-6 shadow-card ring-1 ring-husk/10"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                // Stagger in step with the diagram: farmer, then partner, then you.
                transition={{ duration: 0.4, delay: reduce ? 0 : [0.1, 1.1, 2.6][i] }}
              >
                <span className="text-xs font-bold tracking-widest text-paddy-dark">0{i + 1}</span>
                <h3 className="mt-2 text-xl font-semibold text-field">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soil/75">{step.text}</p>
              </motion.li>
            ))}
          </motion.ol>
        </AnimatePresence>

        <div className="mt-8 grid items-center gap-8 rounded-2xl bg-field-dark p-6 text-rice sm:p-8 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paddy-light">Price transparency</p>
            <h3 className="mt-2 text-2xl font-semibold">Where your money goes</h3>
            <p className="mt-2 text-sm text-rice/70">
              Example: {example.product.name}, {example.product.bagSizeKg} kg from {example.farmerName}
              {model === "PARTNER_SOURCED" ? `, sold by ${example.partnerName}` : ""}. Every product page shows this split.
            </p>
          </div>
          <div className="rounded-xl bg-rice p-5 text-soil">
            <PriceBreakdown
              breakdown={example.product.priceBreakdown}
              price={example.product.price}
              categoryId={example.product.categoryId}
              purchase={example.purchase}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
