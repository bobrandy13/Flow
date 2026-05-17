import type { Lesson } from "../../types/level";

export const LESSON_09_OPEN_ENDED: Lesson = {
  tagline: "No new concepts here: just compose what you know.",
  sections: [
    {
      heading: "Putting it together",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "load_balancer", eli5: "A router that spreads incoming traffic across multiple servers." },
            { term: "cache", eli5: "A fast short-term memory of recent answers." },
            { term: "queue", eli5: "A waiting line that holds work until a consumer is ready." },
            { term: "shard", eli5: "One slice of a dataset split across multiple databases." },
            { term: "cdn", eli5: "A network of edge servers that cache content near users." },
          ],
        },
        {
          type: "p",
          text: "This level is a capstone: heavy traffic, a bursty workload, and a mix of reads and writes. Every tool you have learned so far is available (load balancers, caches, queues, shards, CDN) and there are multiple valid solutions. The goal is not to find the single correct answer but to build something that meets the SLA by methodically identifying and eliminating bottlenecks.",
        },
        {
          type: "bullets",
          items: [
            "Scale out with a load balancer wherever a single node would saturate.",
            "Cache anywhere reads dominate and the same data is requested repeatedly.",
            "Queue anywhere a fast producer hits a slow consumer, especially for writes.",
            "Shard the database if capacity is the ceiling even after caching and queuing.",
          ],
        },
      ],
    },
    {
      heading: "How to approach it",
      blocks: [
        {
          type: "p",
          text: "Resist the urge to design the whole thing upfront. Start with the simplest possible architecture, run the simulation, and watch what breaks. Find the bottleneck: the node where requests are dropping. Apply the smallest change that addresses it. Then run again. This iterative loop is exactly how real production systems evolve.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Iterate, don't over-engineer",
          text: "Start simple. Run the sim. Find the bottleneck. Apply the smallest fix. Repeat. The simulation logs tell you exactly which node is dropping requests: use them.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Bottleneck → matching pattern → smallest fix → re-run.",
    "The simulation logs tell you exactly which node is dropping. Read them.",
  ],
};
