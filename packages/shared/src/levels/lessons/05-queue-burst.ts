import type { Lesson } from "../../types/level";

export const LESSON_05_QUEUE_BURST: Lesson = {
  tagline: "Real traffic isn't smooth: queues turn spikes into a steady drip.",
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
          text: "Imagine a restaurant at lunch: twelve tables seat simultaneously, one waiter handles everything. The kitchen is overwhelmed, orders pile up, and some customers walk out. A synchronous service has the same problem. When a spike of traffic hits (a marketing email goes out, a batch job fires, or a retry storm rolls in), requests pile past the server's capacity ceiling and the excess gets dropped.",
        },
        {
          type: "p",
          text: "If you could spread those same requests over a slightly longer window, every single one would succeed. The question is how to hold onto the excess without dropping it. The answer is a queue: an inbox for work that accepts jobs immediately and holds them until the downstream consumer is ready.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Why provisioning for the peak is expensive",
          text: "If your peak traffic is 10× your average, you'd need 10× the hardware sitting idle most of the time. Queues let you provision closer to the average and absorb the rest: you trade a small increase in latency for a massive reduction in infrastructure cost and dropped requests.",
        },
      ],
    },
    {
      heading: "What a queue does",
      blocks: [
        {
          type: "p",
          text: "In this level, the thing you queue is the database-write job. The producer is your server: it accepts the user request, places a job in the queue, and replies quickly. The consumer is whatever sits after the queue. On this canvas, Queue -> Database means the database is the slow consumer being fed at a steady pace. In a real app, that consumer is often a worker service that reads from the queue and writes to the database.",
        },
        {
          type: "code",
          text: "client -> load balancer -> servers -> queue (ack fast)\n                                      queue -> database (drain steadily)",
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
              description: "The queue itself just accepts and stores jobs quickly. The actual processing time comes from the consumer after it.",
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
          text: "During a spike, the queue's pending depth grows as jobs wait. When the spike passes, the consumer drains the backlog at its steady rate. It is normal for the database to run near 100% while draining: the queue is keeping it busy without letting new work overflow it. That is only a problem if pending depth keeps growing or drops appear.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Queue the database-write job, not the user's whole waiting request.",
    "Producer path: client -> LB -> servers -> queue. Consumer path: queue -> database.",
    "A database near 100% with zero drops can be fine: the queue is feeding it steadily.",
    "Growing pendingDepth that never shrinks = consumer is too slow. Scale the consumer.",
  ],
};
