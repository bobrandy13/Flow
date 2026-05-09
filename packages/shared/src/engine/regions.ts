/**
 * Geographic regions for cross-region latency modelling.
 *
 * Each node on the diagram may be assigned a `region`. When a request hops
 * between two nodes whose regions differ, the simulator tacks
 * `CROSS_REGION_TICKS` onto the destination node's dwell — modelling the
 * speed-of-light cost of physically moving bits across a continent or ocean.
 *
 * Same-region or unset-region transitions cost nothing extra, so existing
 * single-region levels (L1–L13) keep their previous behaviour unchanged.
 */

export const REGIONS = ["us-east", "eu-west", "ap-south"] as const;
export type Region = (typeof REGIONS)[number];

/** Extra dwell ticks added to a request when it crosses regions. 8 ticks ≈ 80ms — a typical cross-Atlantic round-trip half. */
export const CROSS_REGION_TICKS = 8;

/** Display colour per region (used for the corner pill on a node). */
export const REGION_COLORS: Record<Region, string> = {
  "us-east": "#3b82f6",
  "eu-west": "#a855f7",
  "ap-south": "#f97316",
};

/** Short human-readable label per region. */
export const REGION_LABELS: Record<Region, string> = {
  "us-east": "US-East",
  "eu-west": "EU-West",
  "ap-south": "AP-South",
};

export function isRegion(value: string | undefined): value is Region {
  return value !== undefined && (REGIONS as readonly string[]).includes(value);
}
