import type { Lesson } from "../../types/level";

export const LESSON_12_CIRCUIT_BREAKER: Lesson = {
  tagline: "When the downstream is broken, fail fast: don't pile on.",
  sections: [
    {
      heading: "The cascading-failure problem",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "circuit_breaker", eli5: "A guard that stops calls to a broken service automatically." },
            { term: "rate_limiter", eli5: "A gatekeeper that caps how fast requests reach a service." },
          ],
        },
        {
          type: "p",
          text: "When a downstream service slows down or starts failing, naive callers keep sending requests, hold connections open waiting for responses that never come, and eventually exhaust their own resources. This creates a domino effect: one broken service at the bottom of the stack eventually takes down every service above it. The technical term is cascading failure.",
        },
        {
          type: "p",
          text: "Think of the circuit breaker in your home fuse box. When a circuit draws too much current, the breaker trips and disconnects it: not to cause a problem, but to prevent the overload from spreading to other circuits. A software circuit breaker does the same thing: when a downstream starts failing, it disconnects the caller from it so the rest of the system stays healthy.",
        },
      ],
    },
    {
      heading: "How a circuit breaker works",
      blocks: [
        {
          type: "p",
          text: "A circuit breaker monitors the recent error rate to a downstream service and transitions between three states: closed (normal: requests flow through), open (tripped: all requests are immediately rejected without attempting the downstream), and half-open (recovery probe: one test request is let through to see if the downstream has recovered). If the probe succeeds the breaker closes; if it fails, back to open.",
        },
        {
          type: "definitions",
          items: [
            {
              term: "failureRateThreshold",
              description: "The error ratio above which the breaker opens. Typically 50% or higher: you want confidence the downstream is genuinely broken, not just having a bad moment.",
            },
            {
              term: "windowTicks",
              description: "How long a window of recent history to consider when calculating the failure rate.",
            },
            {
              term: "cooldownTicks",
              description: "How long to stay open (rejecting everything) before sending a probe to check if the downstream has recovered.",
            },
          ],
        },
        {
          type: "callout",
          tone: "success",
          title: "The point isn't fewer drops",
          text: "When the downstream is truly down, drops are inevitable either way. The circuit breaker's value is freeing your callers fast: they get an error in milliseconds instead of holding a connection for seconds waiting for a timeout. This keeps the rest of your system healthy while the broken part recovers.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Closed → open when error rate spikes. Cooldown. Half-open probe. Success closes it.",
    "Pair with retries and timeouts: the breaker prevents retries from making things worse.",
  ],
};
