import type { Lesson } from "../../types/level";

export const LESSON_10_REPLICATE_FAILOVER: Lesson = {
  tagline: "One database is one outage waiting to happen: replicate to survive.",
  sections: [
    {
      heading: "Why replication",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "replica", eli5: "A copy of a database that serves reads independently." },
            { term: "replication lag", eli5: "The brief delay before a write reaches all replicas." },
          ],
        },
        {
          type: "p",
          text: "A single database is a single point of failure: when it goes down, every read and write fails instantly. Replication keeps copies of the same data on multiple nodes so that if one disappears, the others can keep serving traffic. Think of a replica like a backup singer who knows all the same songs: if the lead vocalist calls in sick, the show still goes on.",
        },
        {
          type: "p",
          text: "In Flow, you can click a database in the inspector and press Replicate. The original becomes the primary (handles all writes), and new copies become replicas (serve reads). They share a group badge showing they belong to the same replication set. Reads spread across all healthy members; writes go only to the primary.",
        },
      ],
    },
    {
      heading: "What you get (and what you don't)",
      blocks: [
        {
          type: "definitions",
          items: [
            {
              term: "Aggregate read capacity",
              description: "The sum of all healthy members. Three replicas means 3× the read throughput of a single node.",
            },
            {
              term: "Partial availability",
              description: "If the primary fails, replicas keep serving reads: your app stays partially up rather than completely dead.",
            },
            {
              term: "Write limitation",
              description: "Writes still go to the primary. During a primary outage, writes fail until a replica is promoted to primary.",
            },
            {
              term: "Replication lag",
              description: "Every write propagates from primary to replicas with a small delay. A replica might briefly return a slightly stale value right after a write.",
            },
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "This level: scheduled outage",
          text: "The primary database fails for a window mid-simulation. Without replicas, success rate craters. With replicas, reads continue flowing to the healthy copies and your SLA holds through the outage.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Replicate any database that holds important reads: even one extra copy buys survivability.",
    "Replication ≠ free. Lag means a replica might serve a slightly older value.",
  ],
};
