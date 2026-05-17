import type { Lesson } from "../../types/level";

export const LESSON_08_READ_WRITE_SPLIT: Lesson = {
  tagline: "Reads and writes have different shapes: give them different paths.",
  sections: [
    {
      heading: "Asymmetric workloads",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "load_balancer", eli5: "A router that spreads incoming traffic across multiple servers." },
            { term: "cache", eli5: "A fast short-term memory of recent answers." },
            { term: "queue", eli5: "A waiting line that holds work until a consumer is ready." },
          ],
        },
        {
          type: "p",
          text: "Most real-world systems are dramatically read-heavy: 90% or more of traffic is reads, with the remainder being writes. This asymmetry matters because reads and writes benefit from completely different optimizations.",
        },
        {
          type: "p",
          text: "Reads love caching: the same answer served over and over to different users. Writes benefit from queuing: smooth out bursts and decouple acknowledgement from durability. A single undifferentiated path for everything means you optimise for neither.",
        },
      ],
    },
    {
      heading: "The composite pattern",
      blocks: [
        {
          type: "p",
          text: "The mature architecture for a read-write mixed workload gives each shape its own path. A load balancer sits in front of multiple servers. Each server checks a cache for reads, falling through to the database only on misses. For writes, each server pushes into a queue, and a consumer drains that queue into the database in the background.",
        },
        {
          type: "code",
          text: "Read path:  client → LB → server → cache → (DB on miss)\nWrite path: client → LB → server → queue (ack) → consumer → DB",
        },
      ],
    },
    {
      heading: "Why composition matters",
      blocks: [
        {
          type: "callout",
          tone: "success",
          title: "The big idea",
          text: "Real architectures aren't a single pattern: they're a stack of well-understood patterns layered on top of each other, each chosen because it removes a specific bottleneck. Recognising which lever to pull on which path is the core skill of system design.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Cache the read path. Queue the write path. Scale both behind an LB.",
    "Identify the dominant traffic shape before reaching for a tool.",
  ],
};
