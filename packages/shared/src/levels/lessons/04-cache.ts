import type { Lesson } from "../../types/level";

export const LESSON_04_CACHE: Lesson = {
  tagline: "The fastest request is the one you don't have to compute.",
  sections: [
    {
      heading: "The wall moved",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "load_balancer", eli5: "A router that spreads incoming traffic across multiple servers." },
            { term: "request", eli5: "A message asking a server to do something or return data." },
          ],
        },
        {
          type: "p",
          text: "Last level you fixed an overloaded server by scaling out: more servers behind a load balancer. That works until the bottleneck moves. Now every server forwards its reads to the same single database, and the database has its own capacity ceiling. You've pushed the wall one tier downstream.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Scaling out has a limit here",
          text: "Adding a fourth, fifth, or tenth server changes nothing once the database is the bottleneck: they all queue behind the same storage. When the next tier is the wall, adding capacity to the previous tier is wasted money. You have to reduce the work reaching the database, not add machines in front of it.",
        },
        {
          type: "p",
          text: "That's what a cache does. Instead of giving the database more help, you stop most requests from ever reaching it.",
        },
      ],
    },
    {
      heading: "What a cache does",
      blocks: [
        {
          type: "p",
          text: "A cache is like a sticky-note pad of recent answers. When the same question comes in again, the server can return the cached answer immediately instead of going all the way to the database. Memory lookups are orders of magnitude faster than database queries, so a well-tuned cache dramatically reduces both latency and database load.",
        },
        {
          type: "definitions",
          items: [
            {
              term: "Cache hit",
              description: "The answer is already in the cache. Return it immediately: very cheap, very fast.",
            },
            {
              term: "Cache miss",
              description: "The answer isn't cached. Fall through to the database, fetch it, then store a copy in the cache for next time. This request is expensive, but the next identical one won't be.",
            },
            {
              term: "Hit rate",
              description: "The percentage of requests served from cache. A 90% hit rate means only 10% of requests reach your database.",
            },
          ],
        },
      ],
    },
    {
      heading: "Read patterns",
      blocks: [
        {
          type: "p",
          text: "There are two common strategies for reading through a cache. The choice affects who is responsible for populating it:",
        },
        {
          type: "callout",
          tone: "info",
          title: "Cache-aside (most common)",
          text: "The server checks the cache first. On a miss, it queries the database directly and writes the result back into the cache. The application code owns the caching logic: it decides what to cache and when.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Read-through",
          text: "The server always asks the cache, and the cache itself is responsible for fetching from the database on a miss. The server doesn't even know the database exists: the cache abstracts it away entirely.",
        },
      ],
    },
    {
      heading: "Write patterns",
      blocks: [
        {
          type: "p",
          text: "How you handle writes determines the consistency trade-offs in your system. Each pattern optimises for a different priority:",
        },
        {
          type: "callout",
          tone: "info",
          title: "Write-through",
          text: "Write to the cache and the database at the same time. Both must succeed before acknowledging the client. Guarantees strong consistency (the cache is never stale) at the cost of slightly slower writes.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Write-behind",
          text: "Write to the cache immediately, then flush to the database asynchronously in the background. Very fast writes, but if the cache crashes before flushing, that data is lost. Use only when you can tolerate occasional data loss.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Write-around",
          text: "Skip the cache entirely on writes: write only to the database. The cache fills naturally on the next read miss. Avoids polluting the cache with data that might never be read again.",
        },
      ],
    },
    {
      heading: "When caching helps (and when it doesn't)",
      blocks: [
        {
          type: "p",
          text: "Caches excel at read-heavy workloads where a small set of hot answers is requested over and over. They offer no benefit when every request is unique: there is nothing to reuse. And a low hit rate can actually hurt: you pay for the cache lookup on every request while still reaching the database on most of them.",
        },
      ],
    },
  ],
  cheatsheet: [
    "When the next tier down is the bottleneck, adding more of the previous tier does nothing.",
    "A cache fixes a database bottleneck by removing reads, not by adding capacity.",
    "Put the cache on the read path: Server -> Cache -> Database (misses fall through).",
    "Cache reads; the database stays the source of truth.",
  ],
};
