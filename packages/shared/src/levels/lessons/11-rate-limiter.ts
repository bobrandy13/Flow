import type { Lesson } from "../../types/level";

export const LESSON_11_RATE_LIMITER: Lesson = {
  tagline: "When you can't scale fast enough, throttle the firehose.",
  sections: [
    {
      heading: "The problem with uncontrolled traffic",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "rate_limiter", eli5: "A gatekeeper that caps how fast requests reach a service." },
          ],
        },
        {
          type: "p",
          text: "Imagine a nightclub bouncer with a clicker at the door. Once capacity is reached, no one else gets in — not because the bouncer is being cruel, but because letting in more people than the venue can safely hold would make it miserable or dangerous for everyone inside. A rate limiter plays the same role: it caps arrivals at a sustainable rate so the downstream service stays healthy.",
        },
        {
          type: "p",
          text: "Without a rate limiter, a sudden spike — a bot, a retry storm, or viral traffic — floods your server with more requests than it can handle. In-flight requests pile up, new arrivals are dropped indiscriminately, and latency balloons for everyone, even well-behaved users. A rate limiter makes the dropping intentional and controlled.",
        },
      ],
    },
    {
      heading: "What a rate limiter does",
      blocks: [
        {
          type: "p",
          text: "The most common implementation is a token bucket. Tokens refill at a fixed rate (your sustained throughput limit). Each incoming request consumes one token. Arrivals that find an empty bucket are rejected immediately — they never reach the downstream service. The bucket has a maximum size that determines burst tolerance: a full bucket lets a short spike through before enforcement kicks in.",
        },
        {
          type: "definitions",
          items: [
            {
              term: "tokensPerTick",
              description: "The sustained throughput rate — how many requests per tick your downstream can reliably handle. This is your steady-state limit.",
            },
            {
              term: "bucketSize",
              description: "The burst tolerance — how many tokens can accumulate when traffic is below the limit. A larger bucket lets short spikes through without dropping.",
            },
            {
              term: "Intentional drops",
              description: "Drops at the rate limiter are by design. They protect what's behind them from overload. A rate limiter that never drops isn't doing anything.",
            },
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "Match the limit to the bottleneck",
          text: "Set tokensPerTick slightly under what the protected service can actually handle. Too high and the limiter is decorative — traffic still overwhelms the backend. Too low and you're rejecting requests that could have succeeded.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Token bucket: refill rate = sustained limit, bucket size = burst tolerance.",
    "Place in front of a service that can't scale — third-party APIs, fragile downstreams, expensive ops.",
  ],
};
