import type { Lesson } from "../../types/level";

export const LESSON_07_SHARDING: Lesson = {
  tagline: "When one database can't keep up, slice the data across many.",
  sections: [
    {
      heading: "When the database becomes the ceiling",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "load_balancer", eli5: "A router that spreads incoming traffic across multiple servers." },
            { term: "queue", eli5: "A waiting line that holds work until a consumer is ready." },
            { term: "consistent hashing", eli5: "A method that minimises data movement when shards are added or removed." },
          ],
        },
        {
          type: "p",
          text: "A single database has a maximum write throughput no matter how powerful the machine. Read replicas spread read load across copies of the data, but every write still lands on the primary. If write volume keeps growing, you hit a wall that no amount of vertical scaling can break through.",
        },
        {
          type: "p",
          text: "Sharding is horizontal scaling for databases. Think of it like splitting a large dictionary into two volumes — A through M and N through Z. Each volume is smaller and faster, and both can be consulted in parallel. Every shard holds a non-overlapping slice of the data, and the aggregate throughput grows almost linearly with the number of shards.",
        },
      ],
    },
    {
      heading: "How a shard router works",
      blocks: [
        {
          type: "p",
          text: "A shard router (sometimes called a coordinator) sits in front of the shards. Given a request's shard key — typically a hash of a user ID or account ID — it computes which shard owns that key and forwards the request there. The application calls the router as though it were a single database; the routing is transparent.",
        },
        {
          type: "code",
          text: "request(key) → hash(key) % N → shard[N] → response",
        },
      ],
    },
    {
      heading: "Consistent hashing",
      blocks: [
        {
          type: "p",
          text: "Naive modular hashing (key % N) has a nasty property: change N and almost every key maps to a different shard, forcing a full data migration. Consistent hashing arranges shards on a virtual ring. Adding or removing a shard only displaces the keys that were its immediate neighbours — typically 1/N of total keys — leaving the rest untouched.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Why consistent hashing matters in production",
          text: "Without it, adding a shard means moving nearly all your data — hours of downtime. With it, adding a shard moves only a small fraction. This makes scaling up far less disruptive and is why every serious distributed database uses it.",
        },
      ],
    },
    {
      heading: "Trade-offs",
      blocks: [
        {
          type: "p",
          text: "Cross-shard queries — aggregations that need data from multiple shards — are expensive: you fan out to every shard and merge the results. Hot keys are another pitfall: if one user generates disproportionate traffic, their shard saturates even while the others are idle. Pick a shard key with high cardinality and even distribution to avoid both problems.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Pick a shard key with high cardinality and even distribution.",
    "Aggregate capacity ≈ N × per-shard capacity.",
    "If one shard is hot, the average looks fine but users on that shard suffer.",
  ],
};
