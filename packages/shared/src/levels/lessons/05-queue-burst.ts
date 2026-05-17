import type { Lesson } from "../../types/level";

export const LESSON_05_QUEUE_BURST: Lesson = {
  tagline: "Real traffic isn't smooth — queues turn spikes into a steady drip.",
  sections: [
    {
      heading: "The lunch-rush problem",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "load_balancer", eli5: "A router that spreads incoming traffic across multiple servers." },
          ],
        },
        {
          type: "p",
          text: "Imagine a restaurant at lunch: twelve tables seat simultaneously, one waiter handles everything. The kitchen is overwhelmed, orders pile up, and some customers walk out. A synchronous service has the same problem. When a spike of traffic hits — a marketing email goes out, a batch job fires, a retry storm rolls in — requests pile past the server's capacity ceiling and the excess gets dropped.",
        },
        {
          type: "p",
          text: "If you could spread those same requests over a slightly longer window, every single one would succeed. The question is how to hold onto the excess without dropping it. The answer is a queue — an inbox that accepts work immediately and holds it until a consumer is ready.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Why provisioning for the peak is expensive",
          text: "If your peak traffic is 10× your average, you'd need 10× the hardware sitting idle most of the time. Queues let you provision closer to the average and absorb the rest — you trade a small increase in latency for a massive reduction in infrastructure cost and dropped requests.",
        },
      ],
    },
    {
      heading: "What a queue does",
      blocks: [
        {
          type: "p",
          text: "The producer (your server) drops work into the queue and gets back an immediate acknowledgement — it does not wait for the work to be done. A consumer pulls work from the queue at its own pace. Production and consumption are now independent: a spike at the producer side becomes a smooth drip at the consumer side.",
        },
        {
          type: "definitions",
          items: [
            {
              term: "High capacity (~200 in-flight)",
              description: "Queues buffer enormous amounts of work and maintain a large pending depth for messages waiting to be processed.",
            },
            {
              term: "Low service latency (~1 tick)",
              description: "The queue itself just stores and forwards — the actual processing time comes from whatever consumes from it.",
            },
            {
              term: "Decoupling",
              description: "Producers and consumers run at their own pace. A spike at the producer side becomes a smooth drip at the consumer side.",
            },
          ],
        },
      ],
    },
    {
      heading: "Smoothing in practice",
      blocks: [
        {
          type: "p",
          text: "During a spike, the queue's pending depth grows as messages wait. When the spike passes, the consumer drains the backlog at its steady rate. Individual request latency goes up briefly — messages waited in the queue — but nothing is dropped. If pending depth grows and never shrinks back down, the consumer is permanently too slow, not just bursty, and you need to scale it.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Place a queue between a fast producer and a slow consumer.",
    "Pair queues with multiple servers behind an LB — one server alone can't drain a serious burst.",
    "Growing pendingDepth that never shrinks = consumer is too slow. Scale it.",
  ],
};
