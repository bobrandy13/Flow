import type { ChapterQuiz } from "../types/quiz";

export const CHAPTER_QUIZZES: ChapterQuiz[] = [
  {
    chapter: "Basics",
    slug: "basics",
    title: "Basics Capstone",
    description: "Clients, servers, databases, load balancers, and caches.",
    questions: [
      {
        id: "basics-1",
        type: "true_false",
        question: "A single server can handle unlimited traffic as long as it has enough memory.",
        answer: false,
        explanation:
          "Every server has a finite capacity (concurrent request slots). Once full, new requests are dropped — adding memory doesn't change the concurrency limit.",
      },
      {
        id: "basics-2",
        type: "multiple_choice",
        question: "What is the main purpose of adding a database to your architecture?",
        options: [
          "Speed up HTTP responses",
          "Persist data so it survives a server restart",
          "Distribute traffic across multiple servers",
          "Cache frequently read data at the edge",
        ],
        answer: "Persist data so it survives a server restart",
        explanation:
          "Servers are stateless — in-memory state is lost on restart. A database persists writes durably so your data outlives any individual server process.",
      },
      {
        id: "basics-3",
        type: "true_false",
        question: "A load balancer distributes incoming requests across multiple backend servers.",
        answer: true,
        explanation:
          "A load balancer sits in front of a server pool and routes each request to a server, spreading load evenly so no single server becomes the bottleneck.",
      },
      {
        id: "basics-4",
        type: "multiple_choice",
        question: "Where should a cache be placed to reduce the number of reads hitting the database?",
        options: [
          "Between the client and the load balancer",
          "After the database",
          "Between the server and the database",
          "In place of the load balancer",
        ],
        answer: "Between the server and the database",
        explanation:
          "A cache in front of the database intercepts repeated read requests: on a hit the response comes from fast in-memory storage; only misses continue to the (slower) database.",
      },
      {
        id: "basics-5",
        type: "true_false",
        question: "Clients should communicate directly with the database for the best read performance.",
        answer: false,
        explanation:
          "Clients should talk to servers, not databases directly. Servers enforce business logic and security; exposing the database to clients creates security risks and makes it a shared bottleneck.",
      },
    ],
  },
  {
    chapter: "Scaling",
    slug: "scaling",
    title: "Scaling Capstone",
    description: "Queues, async writes, and database sharding.",
    questions: [
      {
        id: "scaling-1",
        type: "true_false",
        question: "A message queue lets a producer send work without waiting for the consumer to finish processing it.",
        answer: true,
        explanation:
          "Queues decouple producers from consumers. The producer enqueues a job and moves on; the consumer drains the queue at its own sustainable pace.",
      },
      {
        id: "scaling-2",
        type: "multiple_choice",
        question: "What problem does database sharding primarily solve?",
        options: [
          "Slow cache hit rates",
          "A single database becoming a write throughput bottleneck",
          "Cross-region network latency",
          "Client-side request rate limits",
        ],
        answer: "A single database becoming a write throughput bottleneck",
        explanation:
          "Sharding partitions data by key across multiple databases so each shard handles a fraction of the total write load, multiplying aggregate throughput.",
      },
      {
        id: "scaling-3",
        type: "true_false",
        question: "With async writes, the client receives an acknowledgment before the data is fully persisted to the database.",
        answer: true,
        explanation:
          "Async writes decouple acknowledgment from persistence: the server says 'received' and enqueues the write; the database drains the queue later. The trade-off is eventual (not immediate) durability.",
      },
      {
        id: "scaling-4",
        type: "multiple_choice",
        question: "Which pattern is most effective at absorbing sudden traffic bursts without dropping write requests?",
        options: [
          "Adding a CDN in front of the origin",
          "Adding a circuit breaker between servers",
          "Adding a queue between the server and the database",
          "Replicating the database across multiple nodes",
        ],
        answer: "Adding a queue between the server and the database",
        explanation:
          "A queue buffers burst writes so the database never sees a spike — it drains messages at its own pace. CDNs and circuit breakers serve different problems.",
      },
      {
        id: "scaling-5",
        type: "true_false",
        question: "Sharding increases total database write throughput by spreading data across multiple database nodes.",
        answer: true,
        explanation:
          "Each shard is an independent database handling a subset of keys, so aggregate throughput scales roughly linearly with the number of shards.",
      },
    ],
  },
  {
    chapter: "Composition",
    slug: "composition",
    title: "Composition Capstone",
    description: "Combining read/write patterns into real-world topologies.",
    questions: [
      {
        id: "comp-1",
        type: "true_false",
        question: "In a read/write split architecture, read requests are served from a cache while write requests are queued for the database.",
        answer: true,
        explanation:
          "Separating read and write paths lets each be independently optimized: a cache short-circuits expensive read round-trips, while a queue smooths write bursts.",
      },
      {
        id: "comp-2",
        type: "multiple_choice",
        question: "What is the primary benefit of combining a cache (read path) and a queue (write path) in one system?",
        options: [
          "It eliminates the need for a database entirely",
          "Reads are fast from cache; writes are buffered and smoothed by the queue",
          "It reduces the number of servers needed",
          "It makes circuit breakers unnecessary",
        ],
        answer: "Reads are fast from cache; writes are buffered and smoothed by the queue",
        explanation:
          "The cache handles read load cheaply; the queue decouples write bursts from the database's capacity. Together they handle high-concurrency mixed workloads without either path becoming a bottleneck.",
      },
      {
        id: "comp-3",
        type: "true_false",
        question: "Every system design problem has exactly one correct solution.",
        answer: false,
        explanation:
          "Most architectures have many valid topologies. Trade-offs — cost, complexity, consistency, latency — drive the right choice for a specific workload. The simulation is the judge, not a rule list.",
      },
      {
        id: "comp-4",
        type: "multiple_choice",
        question: "What is the main cost of adding more components to an architecture?",
        options: [
          "Throughput always decreases",
          "Increased operational complexity and more failure surfaces",
          "Cache hit rates always drop",
          "Debugging always becomes easier",
        ],
        answer: "Increased operational complexity and more failure surfaces",
        explanation:
          "Each new component adds a failure surface, monitoring overhead, and on-call burden. Add only what the workload demands.",
      },
      {
        id: "comp-5",
        type: "true_false",
        question: "A load balancer alone is sufficient to handle sudden write bursts to a slow database.",
        answer: false,
        explanation:
          "A load balancer spreads requests across servers but doesn't buffer them. Without a queue in front of the database, a write burst still lands at the database all at once.",
      },
    ],
  },
  {
    chapter: "Reliability",
    slug: "reliability",
    title: "Reliability Capstone",
    description: "Replication, rate limiting, circuit breakers, and dead-letter queues.",
    questions: [
      {
        id: "rel-1",
        type: "true_false",
        question: "Database replication allows reads to continue even if the primary database node fails.",
        answer: true,
        explanation:
          "A replica holds a copy of the data and can serve reads while the primary is unavailable, keeping the system operational during an outage.",
      },
      {
        id: "rel-2",
        type: "multiple_choice",
        question: "What does a rate limiter do when traffic exceeds the configured threshold?",
        options: [
          "Stores excess requests in a queue for later processing",
          "Drops or immediately rejects requests above the threshold",
          "Reroutes requests to a backup database",
          "Increases server capacity automatically",
        ],
        answer: "Drops or immediately rejects requests above the threshold",
        explanation:
          "Rate limiters protect downstream services by actively shedding excess load. The dropped requests return an error to the caller rather than piling up silently.",
      },
      {
        id: "rel-3",
        type: "true_false",
        question: "A circuit breaker prevents a slow downstream service from exhausting all server threads.",
        answer: true,
        explanation:
          "When the circuit is open, requests fast-fail instantly instead of blocking threads waiting for a slow (or down) dependency. This keeps the server responsive for other traffic.",
      },
      {
        id: "rel-4",
        type: "multiple_choice",
        question: "What is the purpose of a dead-letter queue (DLQ)?",
        options: [
          "To speed up normal message throughput",
          "To capture and preserve messages that could not be delivered or processed",
          "To act as a replica for the primary queue",
          "To rate-limit queue consumers",
        ],
        answer: "To capture and preserve messages that could not be delivered or processed",
        explanation:
          "A DLQ is the safety net for failed messages: instead of silently dropping them, they land in the DLQ for inspection, alerting, and retry — preventing invisible data loss.",
      },
      {
        id: "rel-5",
        type: "true_false",
        question: "Without a circuit breaker, a flaky downstream database can cause cascading failure across all server threads.",
        answer: true,
        explanation:
          "If threads hang waiting on a slow database, the server's thread pool fills up and it stops accepting new requests entirely — a cascading failure from a single slow dependency.",
      },
    ],
  },
  {
    chapter: "Edge",
    slug: "edge",
    title: "Edge Capstone",
    description: "CDNs, edge caching, and the speed-of-light tax.",
    questions: [
      {
        id: "edge-1",
        type: "true_false",
        question: "A CDN caches content at geographically distributed edge nodes close to users.",
        answer: true,
        explanation:
          "CDNs operate a global network of Points of Presence (PoPs). Requests are routed to the nearest PoP, which serves cached responses without the round-trip to the origin.",
      },
      {
        id: "edge-2",
        type: "multiple_choice",
        question: "For a read-heavy workload, what is the primary benefit of a CDN?",
        options: [
          "Faster database write speeds",
          "Most read requests are served from the edge without reaching the origin server",
          "Automatic database sharding",
          "Reduced server memory usage only",
        ],
        answer: "Most read requests are served from the edge without reaching the origin server",
        explanation:
          "With a high cache hit rate, the origin receives only a fraction of total traffic. A 90% hit rate means the origin sees 10× less load — effectively a 10× capacity multiplier.",
      },
      {
        id: "edge-3",
        type: "true_false",
        question: "Every request handled by a CDN still hits the origin server before responding to the user.",
        answer: false,
        explanation:
          "Cache hits are served directly from the edge PoP. Only cache misses (and requests that bypass the CDN) ever reach the origin server.",
      },
      {
        id: "edge-4",
        type: "multiple_choice",
        question: "Why does placing a CDN in the same region as users significantly reduce p95 latency?",
        options: [
          "CDNs compress responses more aggressively than origin servers",
          "It eliminates expensive cross-continent round trips for cached content",
          "CDNs have faster disk I/O than origin servers",
          "The CDN replaces the origin database",
        ],
        answer: "It eliminates expensive cross-continent round trips for cached content",
        explanation:
          "Cross-continental TCP round trips add 80–150 ms of physics-imposed latency. A regional edge cache removes that entirely for cache hits, keeping p95 inside SLA.",
      },
      {
        id: "edge-5",
        type: "true_false",
        question: "A CDN with a high cache hit rate can dramatically reduce load on the origin server.",
        answer: true,
        explanation:
          "If 90% of reads hit the edge cache, the origin sees only 10% of the total traffic. That's a 10× effective capacity multiplier without changing origin infrastructure.",
      },
    ],
  },
];

export const QUIZZES_BY_SLUG: Record<string, ChapterQuiz> = Object.fromEntries(
  CHAPTER_QUIZZES.map((q) => [q.slug, q]),
);
