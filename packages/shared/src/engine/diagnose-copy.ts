/**
 * Central prose library for mentor verdicts. Keeping the strings out of the
 * probe logic in `diagnose.ts` makes the tone easy to iterate on without
 * touching probe heuristics. Future i18n can swap this single file out.
 *
 * Placeholders: any `{name}` in headline/explanation/suggestions is
 * substituted via `format(template, vars)` below. Unknown placeholders
 * pass through unchanged so it's obvious in the UI when copy is broken.
 */

import type { DiagnosisCategory } from "../types/validation";

export interface DiagnosisCopyTemplate {
  headline: string;
  explanation: string;
  suggestions: string[];
}

export const DIAGNOSIS_COPY: Record<DiagnosisCategory, DiagnosisCopyTemplate> = {
  no_failover: {
    headline: "Your {kind} went down with no backup",
    explanation:
      "A scheduled outage took down your {kind} for a stretch of the run. Because there was only one of them, every request that needed it during the outage was dropped. Single points of failure look fine until something fails. That is exactly the scenario this level is testing.",
    suggestions: [
      "Replicate the {kind} so a sibling can take over when one fails.",
      "Group replicas with a replica id so the simulator spreads traffic across healthy members.",
    ],
  },
  breaker_absent: {
    headline: "A downstream failure cascaded back to your server",
    explanation:
      "When the {kind} got flaky, the upstream server kept sending requests at it. Each one hung waiting for a response, the server's in-flight slots filled up, and good traffic started getting dropped at the server too. The original failure did not cause the full outage by itself. The missing backstop let it spread.",
    suggestions: [
      "Insert a circuit breaker between the server and the {kind} so failures fail fast instead of stacking.",
      "A breaker opens on a high error rate, fast-fails new requests during the outage, then half-opens to probe for recovery.",
    ],
  },
  queue_overflow: {
    headline: "Your queue filled up faster than it drained",
    explanation:
      "Producers handed work to the queue faster than the downstream consumer could pull from it. The pending depth climbed until the queue's buffer was exhausted, after which every new arrival was dropped. A queue absorbs bursts, but it does not increase the long-run throughput of what is behind it.",
    suggestions: [
      "Scale the consumer side so the queue can actually drain.",
      "Add a dead-letter route on the overflow edge so dropped work is captured for later.",
      "Increase the queue's buffer size if the burst is short and a backlog is acceptable.",
    ],
  },
  rate_limit_pressure: {
    headline: "Your rate limiter is doing its job, and it hurts",
    explanation:
      "Traffic arrived faster than the rate limiter's token bucket refills, so the limiter shed the excess. That protected the {kind} downstream, but the dropped requests still count against your success rate. A rate limiter trades availability for stability. When the arrival rate is genuinely too high, something has to give.",
    suggestions: [
      "Raise the limiter's tokens-per-tick if the downstream can actually keep up.",
      "Place a queue after the limiter to smooth the dropped traffic rather than reject it outright.",
      "Scale out the protected {kind} so a higher limit is safe.",
    ],
  },
  node_overloaded: {
    headline: "Your {kind} ran out of capacity",
    explanation:
      "The {kind} hit its concurrency limit and started dropping requests. Most of the drops in this run happened there. A single instance has a ceiling on how many requests can be in flight at once. Past that, new arrivals do not queue, they are rejected.",
    suggestions: [
      "Scale out: add more instances of the {kind} behind a load balancer.",
      "Reduce the load reaching it: put a cache in front, batch requests, or filter at the edge.",
      "Use a queue to absorb bursts so the {kind} sees a smoothed rate.",
    ],
  },
  latency_path_too_long: {
    headline: "Most requests succeeded, but the tail is too slow",
    explanation:
      "Success rate is fine, so capacity isn't the problem. The p95 latency is over budget because every request walks a long serial path: each hop adds its own dwell time, and the slowest path defines the tail. The 95th-percentile user is feeling all of them stacked.",
    suggestions: [
      "Remove a hop: can a cache shortcut the long path?",
      "Parallelise: a CDN at the edge or a cache between server and database keeps most traffic off the slow chain.",
      "Replicate hot nodes so the worst-case path doesn't queue behind one slow instance.",
    ],
  },
  cache_underused: {
    headline: "Your cache is not catching enough traffic",
    explanation:
      "There is a cache in your design, but traffic is still reaching the slower backend path too often. A cache only helps when it sits on the hot path before the expensive component and serves repeated reads before they pile up behind the server or database.",
    suggestions: [
      "Make sure the read path goes through the cache, not around it.",
      "Raise the cache's hit-rate edge if the workload is genuinely cacheable.",
      "Consider a CDN at the very edge for traffic that never has to be personal.",
    ],
  },
  headroom_thin: {
    headline: "You passed, but the {kind} is close to the limit",
    explanation:
      "The simulation met your SLA, but the {kind} spent most of the run near full utilisation. That works today; a real burst, an extra failure, or a slightly heavier workload could push it over. Real systems are designed with headroom, not knife-edge tuning.",
    suggestions: [
      "Add an extra {kind} so peak load sits at ~60–70% of capacity instead of ~95%.",
      "Insert a smoothing layer (queue or rate limiter) so spikes don't directly hit the hot node.",
    ],
  },
  passed_clean: {
    headline: "Clean pass: your system has room to breathe",
    explanation:
      "The SLA was met comfortably and no node spent the run pinned at its limit. That's the shape of a healthy design. Move on to the next level or experiment with simpler topologies to feel where the real cost lives.",
    suggestions: [
      "Try removing one component. Does the system still pass?",
      "Push the workload higher in the sandbox to find this design's breaking point.",
    ],
  },
};

/** Replace `{name}` placeholders with values from `vars`. Unknown names pass
 *  through unchanged so the UI surfaces broken copy instead of hiding it. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
