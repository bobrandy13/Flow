import type { Lesson } from "../types/level";

/**
 * Per-level concept lessons. Each one is short on purpose — enough to seed
 * intuition before the player drops into the sandbox. Cheatsheets repeat the
 * single most actionable rule of thumb so players can scan them mid-exercise.
 */

export const LESSON_01_HELLO_SERVER: Lesson = {
  tagline: "Every system starts the same way: a client asks, a server answers.",
  sections: [
    {
      heading: "The request/response cycle",
      blocks: [
        {
          type: "p",
          text: "A client (browser, mobile app, another service) sends a request over the network. A server receives it, does some work, and sends a response back. Until that response arrives, the request is in flight.",
        },
        {
          type: "p",
          text: "On the canvas, an edge from a client to a server represents that connection. When you press Run, you'll see dots travel along the edge in both directions: forward (the request) and return (the response).",
        },
      ],
    },
    {
      heading: "Why this matters",
      blocks: [
        {
          type: "bullets",
          items: [
            "Every more-complex pattern (caches, queues, shards) is built on this primitive.",
            "Latency is measured end-to-end: client → server → client. Adding hops adds latency.",
            "If a server is down or unreachable, the request fails — the dot is dropped.",
          ],
        },
      ],
    },
  ],
  cheatsheet: ["Client → Server is the atom of every system you'll build."],
};

export const LESSON_02_PERSISTENCE: Lesson = {
  tagline: "Servers handle logic; databases remember.",
  sections: [
    {
      heading: "Why separate the database",
      blocks: [
        {
          type: "p",
          text: "Servers are stateless and disposable — you can run many copies of the same server behind a load balancer. Databases are stateful: they hold the canonical record of what your system knows.",
        },
        {
          type: "p",
          text: "A typical request now flows: client → server → database → server → client. The server is the orchestrator; the database answers \"what data?\".",
        },
      ],
    },
    {
      heading: "Capacity and latency",
      blocks: [
        {
          type: "callout",
          tone: "info",
          title: "Two numbers to track",
          text: "Capacity = how many requests can be in flight at once. Latency = how long each one takes. When in-flight requests exceed capacity, new arrivals get dropped.",
        },
        {
          type: "bullets",
          items: [
            "Server capacity ≈ 80 concurrent.",
            "Database capacity ≈ 120 concurrent (but each request takes longer).",
            "If your offered load × latency exceeds capacity, you have a bottleneck.",
          ],
        },
      ],
    },
  ],
  cheatsheet: [
    "Servers compute; databases persist.",
    "Watch for a node where peak in-flight = capacity AND new arrivals are dropping.",
  ],
};

export const LESSON_03_SCALE_OUT: Lesson = {
  tagline: "When one server isn't enough, add more — and a load balancer to spread traffic.",
  sections: [
    {
      heading: "Vertical vs horizontal scaling",
      blocks: [
        {
          type: "p",
          text: "Vertical = a bigger machine (more CPU/RAM). Horizontal = more machines. Vertical hits a ceiling fast and is a single point of failure. Horizontal scales further and survives individual failures, but needs something in front to spread requests across the copies.",
        },
      ],
    },
    {
      heading: "Load balancers",
      blocks: [
        {
          type: "p",
          text: "A load balancer accepts every client request and forwards it to one of the backend servers. The most common policy is round-robin: server 1, server 2, server 3, server 1, ... It can also pick the least-loaded server, or hash on a key for stickiness.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Effective capacity",
          text: "With N identical servers behind an LB, your steady-state capacity is roughly N × per-server capacity — minus a small overhead for the LB itself.",
        },
      ],
    },
  ],
  cheatsheet: [
    "More traffic → more servers behind a load balancer.",
    "An LB has high capacity (~500) and low latency (~1 tick). It's almost never your bottleneck.",
  ],
};

export const LESSON_04_CACHE: Lesson = {
  tagline: "The fastest request is the one you don't have to compute.",
  sections: [
    {
      heading: "What a cache does",
      blocks: [
        {
          type: "p",
          text: "A cache stores the result of recent work so you can return it again without redoing the computation or re-fetching from the database. It's a memory of \"what did we just answer?\".",
        },
        {
          type: "bullets",
          items: [
            "Cache hit = answer is in cache, return immediately. Cheap.",
            "Cache miss = not in cache, fall through to the database, then store the result. Expensive (this time).",
            "Hit rate = % of requests served from cache. Higher = better.",
          ],
        },
      ],
    },
    {
      heading: "Read patterns",
      blocks: [
        {
          type: "callout",
          tone: "info",
          title: "Cache-aside (most common)",
          text: "Server checks the cache first. On miss, it queries the DB and writes the result back into the cache. Next request for the same key hits.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Read-through",
          text: "Server always asks the cache; the cache itself fetches from the DB on miss. The server doesn't know about the DB.",
        },
      ],
    },
    {
      heading: "Write patterns",
      blocks: [
        {
          type: "bullets",
          items: [
            "Write-through: write to cache and DB at the same time. Strong consistency, slower writes.",
            "Write-behind: write to cache now, DB later (async). Fast writes, risk of loss on crash.",
            "Write-around: write only to DB, let the cache fill on next read. Avoids cache pollution from one-shot writes.",
          ],
        },
      ],
    },
    {
      heading: "When caching helps",
      blocks: [
        {
          type: "p",
          text: "Caches shine when the same answer is requested many times (read-heavy, hot keys). They don't help when every request is unique, and they can hurt if the cache hit rate is low (you pay for the cache lookup AND the DB read).",
        },
      ],
    },
  ],
  cheatsheet: [
    "Cache reads; the DB stays the source of truth.",
    "On the canvas, set the edge's cache hit rate to model your workload's locality.",
    "If the cache barely helps, your traffic isn't read-heavy — try a different lever.",
  ],
};

export const LESSON_05_QUEUE_BURST: Lesson = {
  tagline: "Real traffic isn't smooth. Queues turn spikes into a steady drip.",
  sections: [
    {
      heading: "The problem with bursts",
      blocks: [
        {
          type: "p",
          text: "Servers and databases have a fixed concurrent capacity. When a burst arrives — say, 5× your normal traffic for a few seconds — synchronous designs collapse: in-flight requests pile up past capacity, new arrivals are dropped, and users see errors.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Why provisioning for the peak is expensive",
          text: "If your peak is 10× the average, you'd need 10× the hardware sitting idle most of the time. Queues let you provision closer to the average and absorb the rest.",
        },
      ],
    },
    {
      heading: "What a queue does",
      blocks: [
        {
          type: "p",
          text: "A queue accepts work immediately (acknowledging the producer) and stores it until a consumer is ready to process it. Producers don't wait for the consumer; consumers pull at their own pace.",
        },
        {
          type: "bullets",
          items: [
            "High capacity (~200 in flight, plus a large pending buffer).",
            "Low service latency (~1 tick) — it just stores and forwards.",
            "Decouples producer rate from consumer rate.",
          ],
        },
      ],
    },
    {
      heading: "Smoothing in practice",
      blocks: [
        {
          type: "p",
          text: "During the spike, the queue absorbs the excess (its pending depth grows). When the spike ends, the consumer keeps draining at its steady rate until the backlog clears. Latency goes up briefly, but nothing is dropped.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Place a queue between a fast producer and a slow consumer.",
    "Pair a queue with multiple servers behind a load balancer — one server can't drain a serious burst alone.",
    "A growing pendingDepth that doesn't shrink = your consumer is permanently too slow, not bursty. Scale the consumer.",
  ],
};

export const LESSON_06_ASYNC_WRITES: Lesson = {
  tagline: "Not every write needs the database to confirm before you reply.",
  sections: [
    {
      heading: "Sync vs async writes",
      blocks: [
        {
          type: "callout",
          tone: "info",
          title: "Synchronous write",
          text: "Server receives request → writes to DB → waits for confirmation → responds to client. Strong durability guarantee, but the client waits for the slowest hop.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Asynchronous write",
          text: "Server receives request → enqueues the write → responds to client immediately. A consumer drains the queue into the DB in the background. Fast acknowledgement, eventual durability.",
        },
      ],
    },
    {
      heading: "When async is the right call",
      blocks: [
        {
          type: "bullets",
          items: [
            "The client doesn't need the persisted result — just confirmation that the write was accepted (e.g., \"like\" buttons, analytics events, notifications).",
            "You can tolerate a small window where the write is in the queue but not yet in the DB.",
            "Bursty write traffic that would otherwise overwhelm the DB.",
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "Trade-offs",
          text: "If the consumer or queue crashes before draining, those writes are lost (in real systems, durable queues mitigate this). The DB becomes \"eventually consistent\" with what the client was told.",
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

export const LESSON_07_SHARDING: Lesson = {
  tagline: "When one database can't keep up, slice the data across many.",
  sections: [
    {
      heading: "Vertical limits",
      blocks: [
        {
          type: "p",
          text: "A single database has a maximum throughput — eventually you'll saturate it no matter how big the machine. Read replicas help with reads, but writes still need to land on the primary.",
        },
      ],
    },
    {
      heading: "What sharding is",
      blocks: [
        {
          type: "p",
          text: "Sharding partitions your data across multiple databases by a shard key — typically a hash of the user id, account id, or whatever the request is keyed on. Shard 0 holds keys hashing to 0, shard 1 holds keys hashing to 1, and so on.",
        },
        {
          type: "p",
          text: "A shard router (also called a coordinator) sits in front. Given a request's key, it computes the hash and forwards to the correct shard. Aggregate throughput scales nearly linearly with shard count.",
        },
      ],
    },
    {
      heading: "Trade-offs",
      blocks: [
        {
          type: "bullets",
          items: [
            "Cross-shard queries are expensive (must fan out to every shard and merge results).",
            "Resharding (changing the number of shards) is operationally painful — pick a key with good distribution up front.",
            "Hot keys (one user generating disproportionate traffic) can still saturate a single shard.",
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "Consistent hashing",
          text: "Hashing by `key % N` breaks horribly when N changes. Production systems use consistent hashing rings so adding a shard only moves a small fraction of keys.",
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

export const LESSON_08_READ_WRITE_SPLIT: Lesson = {
  tagline: "Reads and writes have different shapes — give them different paths.",
  sections: [
    {
      heading: "Asymmetric workloads",
      blocks: [
        {
          type: "p",
          text: "Most real systems are read-heavy: 90%+ of traffic is reads, the rest writes. Reads benefit from caching (repeat the same answer) and replication (serve from any copy). Writes benefit from queueing (smooth bursts, decouple from durability latency).",
        },
      ],
    },
    {
      heading: "The composite pattern",
      blocks: [
        {
          type: "p",
          text: "Put a load balancer in front of multiple servers. Each server checks a cache for reads, falling through to the database on miss. Each server enqueues writes into a queue, which a consumer drains into the database. Two patterns, one diagram.",
        },
        {
          type: "bullets",
          items: [
            "Read path: client → LB → server → cache → (DB on miss) → server → client.",
            "Write path: client → LB → server → queue (ack here) → DB.",
            "The queue and the cache use the same DB but never block each other.",
          ],
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
          text: "Real architectures are not one pattern, they're a stack of small ones — each chosen because it removes a specific bottleneck. Recognising which lever to pull on which path is most of system design.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Cache the read path. Queue the write path. Scale both behind an LB.",
    "Identify the dominant traffic shape before reaching for a tool.",
  ],
};

export const LESSON_09_OPEN_ENDED: Lesson = {
  tagline: "No new concepts here — just compose what you know.",
  sections: [
    {
      heading: "Putting it together",
      blocks: [
        {
          type: "p",
          text: "This level is a capstone: heavy traffic, bursty workload, mixed reads and writes. Every tool you've learned is on the table. There are multiple valid solutions.",
        },
        {
          type: "bullets",
          items: [
            "Scale out with load balancers wherever a single node would saturate.",
            "Cache anywhere reads dominate.",
            "Queue anywhere a fast producer hits a slow consumer (especially writes).",
            "Shard the database if its capacity is the ceiling.",
          ],
        },
      ],
    },
    {
      heading: "How to approach it",
      blocks: [
        {
          type: "callout",
          tone: "info",
          title: "Iterate, don't design upfront",
          text: "Start simple. Run the sim. Find the bottleneck. Apply the smallest change that addresses it. Repeat. The Copy Logs button is your friend.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Bottleneck → matching pattern → smallest fix → re-run.",
    "Copy your logs and read them. The sim tells you exactly which node is hurting.",
  ],
};
