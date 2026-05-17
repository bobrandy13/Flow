import type { Lesson } from "../../types/level";

export const LESSON_06_ASYNC_WRITES: Lesson = {
  tagline: "Not every write needs the database to confirm before you reply.",
  sections: [
    {
      heading: "Two ways to write",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "load_balancer", eli5: "A router that spreads incoming traffic across multiple servers." },
            { term: "queue", eli5: "A waiting line that holds work until a consumer is ready." },
          ],
        },
        {
          type: "p",
          text: "When a server writes data, it faces a choice: block until the database confirms, or drop the write into a queue and reply immediately while a background worker persists it later. The first is synchronous; the second is asynchronous. The right choice depends on how much the client needs to rely on that data being saved before continuing.",
        },
        {
          type: "code",
          text: "Sync:  client → server → DB (wait) → server → client\nAsync: client → server → queue (ack) → client\n                         └→ consumer → DB (background)",
        },
        {
          type: "bullets",
          items: [
            "Sync: strong durability guarantee, slower response: the client waits for the full DB round-trip.",
            "Async: fast acknowledgement, eventual durability: data is safe once the consumer processes it.",
            "Async throughput advantage compounds with load: the server is free instantly, so it handles the next request sooner.",
          ],
        },
      ],
    },
    {
      heading: "When async is the right call",
      blocks: [
        {
          type: "p",
          text: "Async writes make sense when the client does not need to read its own write back immediately. Think of dropping a letter in a postbox: you do not wait at the postbox until it is delivered, you trust the postal system. Classic use cases include analytics events, audit logs, notification dispatches, and any bursty write traffic that would overwhelm the database if processed synchronously.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "The trade-off",
          text: "If the consumer or queue crashes before draining, those writes are lost. In production, durable queues like Kafka or SQS mitigate this, but the fundamental trade-off remains: you are trading guaranteed immediate durability for speed and throughput.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Client → LB → servers → queue → database.",
    "Acknowledge fast; persist eventually.",
    "Use sync writes when the client needs to read its own write back immediately.",
  ],
};
