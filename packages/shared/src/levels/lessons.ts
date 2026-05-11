import type { Lesson } from "../types/level";

/**
 * Per-level concept lessons — narrative introductions to each system design
 * concept. Written in a conversational, explanatory tone with enough depth
 * to build intuition before the hands-on exercise.
 */

export const LESSON_01_HELLO_SERVER: Lesson = {
  tagline: "Every system starts the same way — a client asks, a server answers.",
  sections: [
    {
      heading: "The request/response cycle",
      blocks: [
        {
          type: "p",
          text: "At its core, every distributed system is built on a single primitive: one machine sends a message to another, and waits for a reply. The sender is called a client (it could be a browser, a mobile app, or another backend service), and the receiver is a server — a program that listens for incoming connections, does some work, and sends back a response.",
        },
        {
          type: "p",
          text: "On the canvas in this game, you'll see this represented as a directed edge from a client node to a server node. When you press Run, coloured dots travel along the edge in both directions: forward (the request being sent) and backward (the response coming back). The time from send to receive is the latency of that request, and until the response arrives the request is considered \"in flight\" — consuming a slot of the server's capacity.",
        },
      ],
    },
    {
      heading: "Why this matters",
      blocks: [
        {
          type: "p",
          text: "Every more-complex pattern you'll encounter in this game — caches, queues, shards, circuit breakers — is ultimately built on top of this simple request/response primitive. Understanding it deeply means understanding where things can go wrong: the network can delay or drop your message, the server can be overloaded, or it can simply be turned off. Each of these failure modes motivates a different architectural pattern in the levels ahead.",
        },
        {
          type: "definitions",
          items: [
            { term: "Latency", description: "Measured end-to-end: the total time from when the client sends a request to when it receives the response. Every additional hop between client and server adds latency." },
            { term: "In-flight requests", description: "Requests that have been sent but haven't received a response yet. If in-flight exceeds a server's capacity, new arrivals are dropped." },
          ],
        },
      ],
    },
  ],
  cheatsheet: ["Client → Server is the atom of every system you'll build in this game."],
};

export const LESSON_02_PERSISTENCE: Lesson = {
  tagline: "Servers handle logic; databases remember.",
  sections: [
    {
      heading: "Why separate the database",
      blocks: [
        {
          type: "p",
          text: "Servers are designed to be stateless and disposable — you can spin up ten copies of the same server and it shouldn't matter which one handles your request, because none of them remember anything between calls. Databases, on the other hand, are stateful by nature: they hold the canonical record of what your system knows, from user accounts to transaction histories. This separation is fundamental because it lets you scale the compute layer independently from the storage layer.",
        },
        {
          type: "p",
          text: "A typical request now has a longer journey: the client hits the server, the server queries the database for the data it needs, the database responds, and then the server assembles a response back to the client. The server orchestrates; the database answers the question \"what does the data say?\".",
        },
        {
          type: "code",
          text: "client → server → database → server → client",
        },
      ],
    },
    {
      heading: "Capacity and latency",
      blocks: [
        {
          type: "p",
          text: "Every node in your architecture has two fundamental numbers: capacity (how many requests can be in flight at once) and latency (how long each request takes to process). When the number of in-flight requests exceeds a node's capacity, new arrivals get dropped — that's the overload condition you'll learn to design around throughout this game.",
        },
        {
          type: "definitions",
          items: [
            { term: "Server capacity ≈ 80 concurrent", description: "Servers process requests quickly but can't hold many at once. They're cheap and you can have lots of them." },
            { term: "Database capacity ≈ 120 concurrent", description: "Databases handle more concurrent requests than a single server, but each request takes longer because disk I/O and transactions are expensive." },
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "Spotting a bottleneck",
          text: "Watch for any node where peak in-flight equals its capacity AND new arrivals are being dropped. That's your bottleneck — the constraint that limits the whole system's throughput.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Servers compute; databases persist. Keep them separate so each can scale independently.",
    "Look for the node where in-flight = capacity with drops happening. That's your bottleneck.",
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
          text: "There are two ways to handle more traffic. Vertical scaling means upgrading to a bigger machine with more CPU and RAM — simple, but you'll hit a ceiling quickly and it leaves you with a single point of failure. Horizontal scaling means adding more machines of the same size. It scales further, survives individual node failures, and is the approach almost all production systems eventually adopt. The trade-off is that you need something sitting in front of those machines to decide which one handles each request.",
        },
      ],
    },
    {
      heading: "Load balancers",
      blocks: [
        {
          type: "p",
          text: "A load balancer is that \"something in front\" — it accepts every incoming client request and forwards it to one of the backend servers. The most common distribution policy is round-robin (server 1, then 2, then 3, then back to 1), but production systems also support least-connections (pick the server with the fewest in-flight requests) and hash-based routing (always send the same user to the same server for session stickiness).",
        },
        {
          type: "callout",
          tone: "info",
          title: "Effective capacity",
          text: "With N identical servers behind a load balancer, your steady-state capacity is roughly N × per-server capacity. The LB itself has very high capacity (~500) and adds minimal latency (~1 tick), so it's almost never the bottleneck — it just distributes work.",
        },
      ],
    },
  ],
  cheatsheet: [
    "More traffic → more servers behind a load balancer.",
    "An LB has ~500 capacity and ~1 tick latency — it's almost never your bottleneck.",
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
          text: "A cache stores the results of recent work so that when the same question comes in again, you can return the answer immediately without re-computing it or re-fetching it from the database. Think of it as a memory of \"what did we just answer?\" — and because memory lookups are orders of magnitude faster than database queries, a good cache can dramatically reduce both latency and load on your backend.",
        },
        {
          type: "definitions",
          items: [
            { term: "Cache hit", description: "The answer is already in the cache. Return it immediately — very cheap, very fast." },
            { term: "Cache miss", description: "The answer isn't cached. Fall through to the database, retrieve it, then store a copy in the cache for next time. This request is expensive, but the next one won't be." },
            { term: "Hit rate", description: "The percentage of requests served from cache. Higher is better — a 90% hit rate means only 10% of requests actually reach your database." },
          ],
        },
      ],
    },
    {
      heading: "Read patterns",
      blocks: [
        {
          type: "p",
          text: "There are two common approaches to reading through a cache, and the difference matters for how your system behaves under load:",
        },
        {
          type: "callout",
          tone: "info",
          title: "Cache-aside (most common)",
          text: "The server checks the cache first. On a miss, it queries the database directly and writes the result back into the cache. The application code owns the caching logic — it decides what to cache and when.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Read-through",
          text: "The server always asks the cache, and the cache itself is responsible for fetching from the database on a miss. The server doesn't even know the database exists — the cache abstracts it away entirely.",
        },
      ],
    },
    {
      heading: "Write patterns",
      blocks: [
        {
          type: "p",
          text: "How you handle writes determines the consistency trade-offs in your system. Each pattern optimizes for a different priority:",
        },
        {
          type: "bullets",
          items: [
            "Write-through — write to the cache and database simultaneously. Guarantees strong consistency at the cost of slower writes, since both must succeed.",
            "Write-behind — write to the cache immediately, then flush to the database asynchronously in the background. Extremely fast writes, but you risk data loss if the cache crashes before flushing.",
            "Write-around — write only to the database, and let the cache fill naturally on the next read. Avoids polluting the cache with data that might never be read again.",
          ],
        },
      ],
    },
    {
      heading: "When caching helps (and when it doesn't)",
      blocks: [
        {
          type: "p",
          text: "Caches work brilliantly when the same answer is requested many times — read-heavy workloads with \"hot keys\" that repeat frequently. They don't help when every request is unique (nothing to cache), and they can actually hurt performance if the hit rate is low, because you're paying for the cache lookup on every request AND still hitting the database on most of them.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Cache reads; the database stays the source of truth.",
    "On the canvas, set the edge's cache hit rate to model your workload's read locality.",
    "Low hit rate = cache isn't helping. Try a different lever.",
  ],
};

export const LESSON_05_QUEUE_BURST: Lesson = {
  tagline: "Real traffic isn't smooth — queues turn spikes into a steady drip.",
  sections: [
    {
      heading: "The problem with bursts",
      blocks: [
        {
          type: "p",
          text: "Production traffic is inherently spiky. A marketing email goes out and thousands of users arrive simultaneously. A batch job kicks off at midnight. A retry storm hits after a brief outage. Servers and databases have fixed concurrent capacity, and when a burst arrives — say, five times your normal traffic for just a few seconds — a synchronous architecture collapses: in-flight requests pile past capacity, new arrivals are dropped, and users see errors. The frustrating part is that if you could just spread those requests over a slightly longer window, every single one would succeed.",
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
          text: "A queue accepts incoming work immediately (acknowledging to the producer that it's been received) and stores it until a consumer is ready to process it. The producer doesn't wait for the consumer, and the consumer pulls work at its own pace. This decoupling is the key insight: the rate of production and the rate of consumption become independent of each other.",
        },
        {
          type: "definitions",
          items: [
            { term: "High capacity (~200 in flight)", description: "Queues can buffer enormous amounts of work. They also have a large pending buffer for messages waiting to be processed." },
            { term: "Low service latency (~1 tick)", description: "The queue itself is just storing and forwarding — the actual processing time comes from whatever consumes from it." },
            { term: "Decoupling", description: "Producers and consumers run at their own pace. A spike at the producer side becomes a smooth drip at the consumer side." },
          ],
        },
      ],
    },
    {
      heading: "Smoothing in practice",
      blocks: [
        {
          type: "p",
          text: "During a traffic spike, the queue absorbs the excess — you'll see its pending depth grow as messages pile up waiting to be processed. When the spike passes, the consumer keeps draining at its steady rate until the backlog clears. Individual request latency goes up briefly (messages waited in the queue), but critically, nothing is dropped. If the pending depth grows and never shrinks back down, that's a different problem: your consumer is permanently too slow, not just bursty, and you need to scale the consumer itself.",
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

export const LESSON_06_ASYNC_WRITES: Lesson = {
  tagline: "Not every write needs the database to confirm before you reply.",
  sections: [
    {
      heading: "Sync vs async writes",
      blocks: [
        {
          type: "p",
          text: "In a synchronous write flow, the server receives a request, writes to the database, waits for the database to confirm the write landed safely, and only then responds to the client. This gives you a strong durability guarantee — if the client got an \"OK\", the data is persisted — but it means the client waits for the slowest hop in the chain.",
        },
        {
          type: "p",
          text: "An asynchronous write flips that trade-off. The server receives the request, drops the write into a queue, and immediately responds to the client with \"got it.\" A background consumer later drains the queue and actually persists the data into the database. The client gets a fast acknowledgement, but the data isn't truly durable until the consumer processes it — which might be milliseconds later, or might be seconds if there's a backlog.",
        },
        {
          type: "code",
          text: "Sync:  client → server → DB (wait) → server → client\nAsync: client → server → queue (ack) → client\n                         └→ consumer → DB (background)",
        },
      ],
    },
    {
      heading: "When async is the right call",
      blocks: [
        {
          type: "p",
          text: "Async writes make sense when the client doesn't need the persisted result to continue — it just needs confirmation that the write was accepted. Think of it like dropping a letter in a mailbox: you don't wait at the mailbox until the letter is delivered, you trust the postal system. Here are the classic use cases:",
        },
        {
          type: "bullets",
          items: [
            "Fire-and-forget actions — \"like\" buttons, analytics events, notification dispatches, audit logs.",
            "Bursty write traffic that would overwhelm the database if processed synchronously.",
            "Any scenario where you can tolerate a small window of eventual consistency (the queue might crash before draining, losing those writes).",
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "The trade-off",
          text: "If the consumer or queue crashes before draining, those writes are lost. In production, durable queues (Kafka, SQS) mitigate this, but the fundamental trade-off remains: you're trading guaranteed immediate durability for speed and throughput.",
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
          text: "A single database has a maximum throughput — there's only so much you can squeeze out of one machine, no matter how powerful. Read replicas help with read-heavy workloads (serve reads from copies of the data), but every write still needs to land on the primary. At some point, if your write volume keeps growing, you hit a wall that no amount of vertical scaling can break through.",
        },
      ],
    },
    {
      heading: "What sharding is",
      blocks: [
        {
          type: "p",
          text: "Sharding partitions your data across multiple independent databases by a shard key — typically a hash of the user ID, account ID, or whatever your requests are naturally keyed on. A shard router (sometimes called a coordinator) sits in front of the shards. Given a request's key, it computes the hash, determines which shard owns that key, and forwards the request there. Each shard is responsible for a slice of the overall data, and the aggregate throughput scales nearly linearly with the number of shards.",
        },
        {
          type: "code",
          text: "request(key) → hash(key) % N → shard[N] → response",
        },
      ],
    },
    {
      heading: "Trade-offs",
      blocks: [
        {
          type: "p",
          text: "Sharding isn't free — it introduces real operational complexity. Cross-shard queries (aggregations that need data from multiple shards) are expensive because you have to fan out to every shard and merge the results. Resharding (adding or removing shards) is painful because it means redistributing data. And hot keys — one user generating disproportionate traffic — can saturate a single shard even when the rest are underutilized.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Consistent hashing",
          text: "Naive hashing (key % N) breaks catastrophically when N changes — almost every key remaps to a different shard. Production systems use consistent hashing rings, where adding a shard only moves a small fraction of keys. This makes scaling up or down far less disruptive.",
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
          text: "Most real-world systems are dramatically read-heavy: 90% or more of traffic is reads, with the remainder being writes. This asymmetry matters because reads and writes benefit from completely different optimizations. Reads love caching (the same answer served over and over) and replication (serve from any copy). Writes benefit from queueing (smooth out bursts, decouple acknowledgement from durability).",
        },
      ],
    },
    {
      heading: "The composite pattern",
      blocks: [
        {
          type: "p",
          text: "The mature architecture for a read-write mixed workload combines everything you've learned so far into a single coherent design. A load balancer sits in front of multiple servers. Each server checks a cache for reads, falling through to the database only on misses. For writes, each server pushes into a queue, and a consumer drains that queue into the database in the background. Two independent paths, one shared database — each optimized for its traffic shape.",
        },
        {
          type: "code",
          text: "Read path:  client → LB → server → cache → (DB on miss) → response\nWrite path: client → LB → server → queue (ack) → consumer → DB",
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
          text: "Real architectures aren't a single pattern — they're a stack of small, well-understood patterns layered on top of each other, each one chosen because it removes a specific bottleneck. Recognizing which lever to pull on which path is the core skill of system design.",
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
          text: "This level is a capstone: heavy traffic, a bursty workload, and a mix of reads and writes. Every tool you've learned so far is on the table — load balancers, caches, queues, shards — and there are multiple valid solutions. The goal isn't to find the \"right\" answer but to build something that meets the SLA by methodically identifying and eliminating bottlenecks.",
        },
        {
          type: "bullets",
          items: [
            "Scale out with load balancers wherever a single node would saturate.",
            "Cache anywhere reads dominate and the same data is requested repeatedly.",
            "Queue anywhere a fast producer hits a slow consumer, especially for writes.",
            "Shard the database if its capacity is the ceiling even after caching and queueing.",
          ],
        },
      ],
    },
    {
      heading: "How to approach it",
      blocks: [
        {
          type: "p",
          text: "Resist the urge to design the whole thing upfront. Start with the simplest possible architecture (client → server → database), run the simulation, and watch what happens. Find the bottleneck — the node where requests are dropping. Apply the smallest change that addresses it. Then run again. This iterative approach is exactly how real production systems evolve: you don't build for Google scale on day one; you solve the problem in front of you and re-evaluate.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Iterate, don't over-engineer",
          text: "Start simple. Run the sim. Find the bottleneck. Apply the smallest fix. Repeat. The simulation logs tell you exactly which node is hurting — use them.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Bottleneck → matching pattern → smallest fix → re-run.",
    "The simulation logs tell you exactly which node is dropping. Read them.",
  ],
};

export const LESSON_10_REPLICATE_FAILOVER: Lesson = {
  tagline: "One database is one outage waiting to happen — replicate to survive.",
  sections: [
    {
      heading: "Why replication",
      blocks: [
        {
          type: "p",
          text: "A single database is a single point of failure: when it goes down, every read and write fails with it. Replication keeps copies of the same data on multiple nodes so that if one disappears, the others can keep serving traffic. It's the difference between \"the database crashed, everything is broken\" and \"the database crashed, most users didn't notice.\"",
        },
        {
          type: "p",
          text: "In Flow, you can click a database in the inspector and press Replicate. The original becomes the primary (handles writes), and new copies become replicas (serve reads). They share a group badge indicating they're a replication set. Reads spread across all healthy members; writes go only to the primary.",
        },
      ],
    },
    {
      heading: "What you get (and what you don't)",
      blocks: [
        {
          type: "definitions",
          items: [
            { term: "Aggregate read capacity", description: "The sum of all healthy members. Three replicas means 3× the read throughput of a single node." },
            { term: "Partial availability", description: "If the primary fails, replicas keep serving reads — your app stays partially up rather than completely dead." },
            { term: "Write limitation", description: "Writes still go to the primary. During a primary outage, writes fail until promotion happens (a replica becomes the new primary)." },
            { term: "Replication lag", description: "Every write has to propagate from primary to replicas. There's always some delay, meaning a replica might briefly serve a slightly stale value." },
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "This level: scheduled outage",
          text: "The primary database fails for a window mid-simulation. Without replicas, success rate craters. With replicas, reads continue flowing and your SLA holds through the outage.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Replicate any database that holds important reads — even one extra copy buys survivability.",
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
          text: "A rate limiter caps how fast traffic flows to downstream services. The most common implementation is a token bucket: tokens refill at a fixed rate (say, 30 per tick), each incoming request consumes one token, and arrivals that find an empty bucket are rejected immediately. The bucket has a maximum size that determines burst tolerance — a full bucket lets a short spike through, but sustained overload above the refill rate gets throttled.",
        },
      ],
    },
    {
      heading: "Tokens vs bucket size",
      blocks: [
        {
          type: "definitions",
          items: [
            { term: "tokensPerTick", description: "The sustained throughput rate — how many requests per tick your downstream can reliably handle. This is your steady-state limit." },
            { term: "bucketSize", description: "The burst tolerance — how many tokens can accumulate when traffic is below the limit. A larger bucket lets short spikes through without dropping." },
            { term: "Intentional drops", description: "Drops at the rate limiter are by design — they protect what's behind them from overload. A rate limiter that never drops isn't doing anything." },
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "Match the limit to the bottleneck",
          text: "Set tokensPerTick slightly under what the protected service can actually handle. Too high and the limiter is decorative — traffic still overwhelms the backend. Too low and you're rejecting requests that could have succeeded.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Token bucket: refill rate = sustained limit, bucket size = burst tolerance.",
    "Place in front of a service that can't scale (third-party APIs, fragile downstreams, expensive ops).",
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
          text: "When a downstream service slows down or starts returning errors, naive callers keep sending requests, hold connections open waiting for responses that never come, and eventually run out of resources themselves. This creates a domino effect: one service fails, its callers back up and fail, their callers back up and fail — and suddenly your entire system is down because of a single broken component at the bottom of the stack.",
        },
      ],
    },
    {
      heading: "How a circuit breaker helps",
      blocks: [
        {
          type: "p",
          text: "A circuit breaker monitors the recent error rate to a downstream service and transitions between three states. In the closed state, everything works normally — requests flow through. If the error rate exceeds a threshold, the breaker trips to open: all requests are immediately rejected without even attempting the downstream call. After a cooldown period, the breaker moves to half-open: it lets a single probe request through. If the probe succeeds, the breaker closes and normal traffic resumes. If the probe fails, back to open.",
        },
        {
          type: "definitions",
          items: [
            { term: "failureRateThreshold", description: "The drop/error ratio above which the breaker opens. Typically 50% or higher — you want to be confident the downstream is genuinely broken, not just having a bad moment." },
            { term: "windowTicks", description: "How long a window of recent history to consider when calculating the failure rate." },
            { term: "cooldownTicks", description: "How long to stay open (rejecting everything) before sending a probe to check if the downstream has recovered." },
          ],
        },
        {
          type: "callout",
          tone: "success",
          title: "The point isn't fewer drops",
          text: "When the downstream is truly down, drops are inevitable either way. The circuit breaker's value is freeing your callers fast — they get an error in milliseconds instead of holding a connection for seconds waiting for a timeout. This keeps the rest of your system healthy while the broken part recovers.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Closed → open when error rate spikes. Cooldown. Half-open probe. Success closes it.",
    "Pair with retries and timeouts — the breaker prevents retries from making things worse.",
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
          text: "When a queue overflows, the simplest behaviour is to drop new arrivals and move on. But silent drops are an operational nightmare: you can't see what was lost, you can't replay those messages, and you might not even know it happened until a user complains that their action never took effect. In production, \"I don't know what we lost\" is one of the scariest sentences an engineer can say during an incident.",
        },
      ],
    },
    {
      heading: "What a dead-letter queue does",
      blocks: [
        {
          type: "p",
          text: "A dead-letter queue (DLQ) is a side-channel for messages that couldn't be processed normally. Overflows, poison pills (messages that crash the consumer), repeated processing failures — instead of being silently dropped, they land in the DLQ where operators can inspect them, understand why they failed, fix the underlying issue, and replay them when the system is healthy again.",
        },
        {
          type: "p",
          text: "In Flow, you can draw an edge from a queue to a target node, click the edge, and mark it as a dead-letter queue. When the source queue overflows, messages that would have been dropped are instead routed to the DLQ target.",
        },
        {
          type: "callout",
          tone: "info",
          title: "DLQ as observability",
          text: "Even if you never replay a single message from the DLQ, having one means you can answer the question \"how much did we lose and why?\" — which is infinitely better than \"I don't know\" during an incident review.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Mark a queue's overflow edge as DLQ to capture failed messages instead of losing them.",
    "DLQ depth is a key alert signal — a growing DLQ means something is broken upstream.",
  ],
};

export const LESSON_14_CACHE_THE_WORLD: Lesson = {
  tagline: "Most read traffic should never reach your origin — that's what edge caches are for.",
  sections: [
    {
      heading: "Why an edge cache",
      blocks: [
        {
          type: "p",
          text: "Read-heavy traffic — product pages, images, JavaScript bundles, news articles — is overwhelmingly the same answer being served over and over to different users. Asking your origin server to recompute or refetch that answer every single time wastes capacity you'll need for the requests that actually require fresh computation: checkouts, personalised feeds, writes, and other inherently unique operations.",
        },
        {
          type: "p",
          text: "A CDN (Content Delivery Network) sits between your clients and your origin. On a cache hit, it answers immediately from its local copy and never calls back to the origin at all. On a miss, it forwards the request to the origin, caches the response, and serves it directly for all subsequent requests. The effect is dramatic: your origin only sees the unique requests, not the repeated ones.",
        },
      ],
    },
    {
      heading: "Hit rate is everything",
      blocks: [
        {
          type: "p",
          text: "The effectiveness of a CDN comes down to one number: its hit rate. If 90% of traffic hits the CDN, your origin only sees 10% of total requests — you've effectively multiplied your origin's capacity by 10× without adding a single server. The key to a high hit rate is having cacheable content (safe to share between users, keyed correctly) and sensible TTLs (time-to-live — how long the cached copy is considered fresh).",
        },
        {
          type: "callout",
          tone: "info",
          title: "This level",
          text: "Your origin server's capacity is well below the incoming traffic. Without a CDN, drops mount rapidly. Insert a CDN between client and server with a high hit rate and watch your origin breathe — most traffic never reaches it.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Put a CDN in front of any read-heavy, cache-friendly endpoint.",
    "CDN hit rate is your origin offload multiplier. 90% hit rate ⇒ 10× the headroom.",
  ],
};

export const LESSON_15_TWO_CONTINENTS: Lesson = {
  tagline: "Light is fast — but not THAT fast. Distance shows up in your p95.",
  sections: [
    {
      heading: "The speed of light tax",
      blocks: [
        {
          type: "p",
          text: "Bits travel through fibre optic cables at roughly 200,000 km/s. London to New York and back is about 11,000 km of cable — that's 55ms of pure physics latency before your server even begins processing the request. Add TCP handshakes, TLS negotiation, routing hops, and switch queuing, and you're easily looking at 80–120ms per cross-ocean round trip. That's not something you can optimize away with better code; it's a fundamental constraint of the physical universe.",
        },
        {
          type: "p",
          text: "In Flow, the simulator models this as a cross-region transit cost: every time a request crosses from one geographic region to another, the simulator adds 80ms (8 ticks) of latency. Requests that stay within the same region pay nothing extra.",
        },
      ],
    },
    {
      heading: "Edge caching to the rescue",
      blocks: [
        {
          type: "p",
          text: "The solution to the speed-of-light problem is deceptively simple: don't cross the ocean for requests you don't have to. Place a CDN in the same region as your users, and most read traffic terminates locally — it never even leaves the continent. Only cache misses pay the cross-region cost, and if your hit rate is high, that's a tiny fraction of total traffic.",
        },
        {
          type: "bullets",
          items: [
            "p95 latency is dominated by the slowest 5% of requests — exactly the ones that crossed the ocean.",
            "A high CDN hit rate in the user's region means most requests never cross, keeping p95 tight.",
            "Only cache misses and writes need to traverse the cross-region link.",
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "This level",
          text: "Your clients are in EU-West. Your origin and database are in US-East. The SLA enforces a tight p95 latency constraint. Without an edge CDN in EU-West with a high hit rate, every request pays the Atlantic round-trip and you'll fail the SLA.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Users far from your origin? A regional edge cache isn't optional — it's required for p95.",
    "Cross-region hops blow up p95 latency disproportionately. Minimize them.",
  ],
};
