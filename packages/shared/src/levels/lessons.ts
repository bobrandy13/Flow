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

export const LESSON_10_REPLICATE_FAILOVER: Lesson = {
  tagline: "One database is one outage waiting to happen. Replicate to survive.",
  sections: [
    {
      heading: "Why replication",
      blocks: [
        {
          type: "p",
          text: "A single database is a single point of failure: when it goes down, every write and read fails with it. Replication keeps copies of the same data on multiple nodes so reads can keep flowing — and (with promotion) writes too — when one node disappears.",
        },
        {
          type: "p",
          text: "In Flow, click a database in the inspector and press Replicate. The original becomes the primary; new ones are replicas. They share a 🔗 group badge. Reads spread across the group; writes go to the primary.",
        },
      ],
    },
    {
      heading: "What you get (and what you don't)",
      blocks: [
        {
          type: "bullets",
          items: [
            "Aggregate read capacity = sum of all healthy members.",
            "If the primary fails, replicas keep serving reads — your app stays partially up.",
            "Writes still go to the primary, so during a primary outage they fail. Promotion (a replica becomes the new primary) is a follow-up topic.",
            "Replication isn't free: every write has to propagate. There's lag.",
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "This level: scheduled outage",
          text: "The primary database fails for a window mid-simulation. Without replicas, success rate craters. With replicas, reads continue and your SLA holds.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Replicate any database that holds important reads — even just one extra copy buys you survivability.",
    "Replication ≠ free. Lag means a replica might serve a slightly older value.",
  ],
};

export const LESSON_11_RATE_LIMITER: Lesson = {
  tagline: "When you can't scale fast enough, throttle the firehose.",
  sections: [
    {
      heading: "What a rate limiter does",
      blocks: [
        {
          type: "p",
          text: "A rate limiter caps how fast traffic flows downstream. The most common implementation is a token bucket: tokens refill at a fixed rate (say, 30 per tick), each request takes one, and arrivals with no token are rejected immediately. The bucket size lets short bursts squeak through; sustained overload is throttled.",
        },
      ],
    },
    {
      heading: "Tokens vs bucket size",
      blocks: [
        {
          type: "bullets",
          items: [
            "tokensPerTick = sustained rate. This is what your downstream can survive.",
            "bucketSize = burst tolerance. Higher = more headroom for spiky traffic.",
            "Drops here are intentional — they protect what's behind them.",
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "Match the limit to the bottleneck",
          text: "Set tokensPerTick a little under what the protected service can handle. Too high and the limiter is decorative; too low and you're rejecting traffic that could have succeeded.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Token bucket: refill = sustained rate, bucket = burst tolerance.",
    "Use it in front of a service that can't scale (third-party API, fragile downstream, expensive op).",
  ],
};

export const LESSON_12_CIRCUIT_BREAKER: Lesson = {
  tagline: "When the downstream is broken, fail fast — don't pile on.",
  sections: [
    {
      heading: "The cascading-failure problem",
      blocks: [
        {
          type: "p",
          text: "When a downstream slows down or starts failing, naive callers keep sending requests, hold connections waiting for responses that never come, and run out of resources themselves. One failing service brings down everything that depends on it.",
        },
      ],
    },
    {
      heading: "How a circuit breaker helps",
      blocks: [
        {
          type: "p",
          text: "A circuit breaker watches the recent error rate to a downstream. Three states: closed (normal), open (downstream is broken — reject immediately), half-open (cooldown elapsed, send one probe). Successful probe → closed. Failed probe → back to open.",
        },
        {
          type: "bullets",
          items: [
            "failureRateThreshold: drop ratio above which the breaker opens.",
            "windowTicks: how long a slice of recent history to consider.",
            "cooldownTicks: how long to stay open before probing again.",
          ],
        },
        {
          type: "callout",
          tone: "success",
          title: "The point isn't fewer drops",
          text: "When the downstream is down, drops are inevitable. The point is freeing your callers fast — they get an error in milliseconds instead of a hung connection.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Closed → open when error rate spikes; cooldown; half-open probe; success closes it.",
    "Pair with retries and timeouts. The breaker prevents the retries from making things worse.",
  ],
};

export const LESSON_13_DLQ: Lesson = {
  tagline: "Don't drop poison messages on the floor — keep them for later.",
  sections: [
    {
      heading: "The problem with silent drops",
      blocks: [
        {
          type: "p",
          text: "When a queue overflows, the simplest behavior is to drop new arrivals. But silent drops are a debugging nightmare: you can't see what was lost, can't replay it, and may not even know it happened.",
        },
      ],
    },
    {
      heading: "What a DLQ does",
      blocks: [
        {
          type: "p",
          text: "A dead-letter queue is a side-channel for messages that couldn't be processed. Overflows, poison pills, repeated failures — they all land here instead of being lost. Operators inspect, fix, and replay them.",
        },
        {
          type: "p",
          text: "In Flow, draw an edge from a queue to a target node, click the edge, and tick \"Dead-letter queue\". When the queue overflows, those messages land at the DLQ target instead of vanishing.",
        },
        {
          type: "callout",
          tone: "info",
          title: "DLQ is observability",
          text: "Even if you never replay anything from the DLQ, having it means you can answer 'how much did we drop and why?' — which beats 'I don't know' every time.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Mark a queue's overflow edge as DLQ to keep failed messages.",
    "DLQ depth is a key alert signal — a growing DLQ means something is broken upstream.",
  ],
};

export const LESSON_14_CACHE_THE_WORLD: Lesson = {
  tagline: "Most read traffic should never reach your origin. That's what edges are for.",
  sections: [
    {
      heading: "Why an edge cache",
      blocks: [
        {
          type: "p",
          text: "Read-heavy traffic — product pages, images, JS bundles, news articles — is mostly the same answer over and over. Asking your origin server for it every time wastes capacity you'll need for the unique requests (checkouts, personalised feeds, writes).",
        },
        {
          type: "p",
          text: "A CDN sits between your client and your origin. On a hit, it answers immediately and never calls back. On a miss, it forwards to the origin and caches the answer for next time.",
        },
      ],
    },
    {
      heading: "Hit rate is everything",
      blocks: [
        {
          type: "bullets",
          items: [
            "If 90% of traffic hits the CDN, your origin only sees 10% — capacity multiplied by 10×.",
            "Cacheable content is anything safe to share between users (with the right keying).",
            "Cache invalidation is the hard part — short TTLs are usually fine for v1.",
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "This level",
          text: "The origin server's capacity is well below the incoming traffic. Without a CDN, drops mount. Insert a CDN between client and server with a high hit rate and watch the origin breathe.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Put a CDN in front of any read-heavy, cache-friendly endpoint.",
    "The CDN's hit rate is your origin offload multiplier. 90% hit ⇒ 10× the headroom.",
  ],
};

export const LESSON_15_TWO_CONTINENTS: Lesson = {
  tagline: "Light is fast — but not THAT fast. Distance shows up in p95.",
  sections: [
    {
      heading: "The speed of light tax",
      blocks: [
        {
          type: "p",
          text: "Bits travel at roughly 200,000 km/s through fibre. London to New York and back is ~5,500 km × 2 ≈ 55ms of just-physics latency, before your server does anything. Add TCP handshakes, TLS, and a few hops — you're easily looking at 80–120ms per round trip.",
        },
        {
          type: "p",
          text: "Flow models this as cross-region transit cost: every time a request crosses from one region to another, the simulator adds 80ms (8 ticks). Same-region or unset-region transitions cost nothing extra.",
        },
      ],
    },
    {
      heading: "Edge caching to the rescue",
      blocks: [
        {
          type: "bullets",
          items: [
            "Place a CDN in the same region as your users. Most reads terminate locally, never crossing the ocean.",
            "Only cache misses pay the cross-region cost.",
            "p95 latency is dominated by the slowest 5% — exactly the requests that crossed the ocean.",
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "This level",
          text: "Your client lives in EU-West. Your origin server and database are in US-East. The SLA enforces a tight p95. Without an edge CDN in EU-West with a high hit rate, every request pays the Atlantic round-trip and you fail.",
        },
      ],
    },
  ],
  cheatsheet: [
    "If your users are far from your origin, a regional edge cache is not optional — it's required.",
    "p95 latency is what users feel. Cross-region hops blow it up disproportionately.",
  ],
};
