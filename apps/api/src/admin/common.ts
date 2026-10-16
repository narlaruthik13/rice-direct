import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod";

/** Validates an :id route param (cuid, seeded ids like "farmer-ramana", batch ids). */
export const IdPipe = new ZodValidationPipe(z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, "Invalid id"));

export const toPaise = (rupees: number) => Math.round(rupees * 100);
export const toRupees = (paise: number) => paise / 100;
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export const dateValue = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** A 400 in the same shape as the zod pipe, for rules checked against the database. */
export const validationError = (issues: { path: string; message: string }[]) =>
  new BadRequestException({ message: "Validation failed", issues });

export const nothingToUpdate = () => new BadRequestException("Nothing to update");

/** URL slug: lowercase letters, digits and dashes, at most 80 characters. */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");

/** Two letters for a batch id: initials of the first two words, or the first two letters. */
export function varietyCode(variety: string): string {
  const words = variety.toUpperCase().replace(/[^A-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words[0][0] + words[1][0];
  return (words[0] ?? "XX").padEnd(2, "X").slice(0, 2);
}

/** Candidate suffixes in order: the variety code, then first letter + A-Z/0-9, then any pair. */
export function batchSuffixCandidates(variety: string): string[] {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const code = varietyCode(variety);
  const out = [code];
  for (const c of chars) out.push(code[0] + c);
  for (const a of chars) for (const b of chars) out.push(a + b);
  return [...new Set(out)];
}
