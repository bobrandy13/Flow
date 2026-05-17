/**
 * Glossary of system design terms: displayed as interactive inline tooltips
 * throughout lesson content. Each entry provides a beginner-friendly definition,
 * why it matters, and an optional real-world analogy.
 */

export type GlossaryCategory = "component" | "concept" | "pattern";

export interface GlossaryEntry {
  /** The canonical display form of the term. */
  term: string;
  /** Short plain-English one-liner, distinct from the longer definition. Max ~15 words. */
  eli5: string;
  /** Beginner-friendly 1–2 sentence definition (existing field, keep it). */
  definition: string;
  /** Why it matters in production systems (existing field, keep it). */
  relevance: string;
  /** Optional real-world analogy (existing field, keep it). */
  analogy?: string;
  /** Category for the glossary panel tabs. */
  category: GlossaryCategory;
  /** 2–4 bullet strings: "When to use X". */
  whenToUse: string[];
  /** Optional inline SVG string for the panel diagram. Keep under ~4KB. */
  diagramSvg?: string;
}

/**
 * All glossary entries. The key is the lowercase canonical form used for
 * matching. Matching is case-insensitive and supports common variations
 * (e.g., "load balancer" also matches "load balancers").
 */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  "stateless": {
    term: "Stateless",
    eli5: "A service with no memory: every request carries all the info it needs.",
    definition:
      "A stateless service doesn't remember previous requests. Every request contains all the information needed to process it independently.",
    relevance:
      "Makes horizontal scaling trivial: any server can handle any request, so you just add more servers behind a load balancer.",
    analogy:
      "Like a vending machine: it doesn't know who you are or what you bought last time. You put in money and make a selection, and it dispenses.",
    category: "concept",
    whenToUse: [
      "You need to scale horizontally by adding more servers",
      "Requests are independent and carry their own context",
      "You want any server to handle any request without sticky routing",
    ],
  },
  "stateful": {
    term: "Stateful",
    eli5: "A service that remembers past interactions with a user or session.",
    definition:
      "A stateful service remembers information between requests: session data, in-progress transactions, or cached computation.",
    relevance:
      "Harder to scale because requests for the same state must route to the same instance, but sometimes necessary for performance or correctness.",
    category: "concept",
    whenToUse: [
      "Maintaining long-running sessions like multiplayer games or checkouts",
      "In-progress transaction tracking requires shared state",
      "Performance demands caching computation results per user",
    ],
  },
  "idempotent": {
    term: "Idempotent",
    eli5: "Doing something once or a hundred times gives you exactly the same result.",
    definition:
      "An operation is idempotent if performing it multiple times produces the same result as performing it once.",
    relevance:
      "Critical for retry safety. If a network hiccup causes a duplicate request, an idempotent endpoint won't accidentally charge a user twice.",
    analogy:
      "Like pressing an elevator button: pressing it five times doesn't call five elevators.",
    category: "concept",
    whenToUse: [
      "Building APIs that clients will retry on failure",
      "Processing payments where duplicates would cause double-charges",
      "Writing queue consumers that may receive the same message twice",
    ],
  },
  "idempotency": {
    term: "Idempotency",
    eli5: "The property that makes doing something twice as safe as doing it once.",
    definition:
      "The property of an operation where repeating it produces the same outcome as doing it once.",
    relevance:
      "Essential for safe retries in distributed systems. Network failures are inevitable; idempotent operations make retries harmless.",
    analogy:
      "Setting a thermostat to 72°F: doing it ten times still results in 72°F.",
    category: "concept",
    whenToUse: [
      "Designing retry-safe endpoints and operations",
      "Building reliable distributed workflows that tolerate duplicates",
      "Handling at-least-once message delivery safely",
    ],
  },
  "load balancer": {
    term: "Load Balancer",
    eli5: "A traffic cop that splits incoming requests evenly across multiple servers.",
    definition:
      "A component that distributes incoming requests across multiple backend servers, preventing any single server from becoming overwhelmed.",
    relevance:
      "The gateway to horizontal scaling. Without one, adding servers doesn't help because clients only know about one endpoint.",
    analogy:
      "Like a restaurant host who seats guests across all available tables instead of sending everyone to one waiter.",
    category: "component",
    whenToUse: [
      "You have multiple backend servers and need to distribute traffic",
      "You want to remove servers for maintenance without downtime",
      "You need to automatically route around unhealthy instances",
      "A single server is the throughput bottleneck",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="10" y="65" width="64" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="42" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Client</text><line x1="74" y1="80" x2="118" y2="80" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="120" y="55" width="80" height="50" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="160" y="77" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Load</text><text x="160" y="92" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Balancer</text><line x1="200" y1="68" x2="238" y2="38" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="200" y1="80" x2="238" y2="80" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="200" y1="92" x2="238" y2="122" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="240" y="22" width="70" height="28" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="275" y="40" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Server 1</text><rect x="240" y="66" width="70" height="28" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="275" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Server 2</text><rect x="240" y="110" width="70" height="28" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="275" y="128" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Server 3</text></svg>`,
  },
  "round-robin": {
    term: "Round-Robin",
    eli5: "Take turns: send request 1 to Server A, request 2 to Server B, and repeat.",
    definition:
      "A distribution strategy that sends each new request to the next server in a rotating sequence: 1, 2, 3, 1, 2, 3...",
    relevance:
      "The simplest load-balancing policy. Works well when all servers are identical and requests take roughly the same time.",
    category: "pattern",
    whenToUse: [
      "All servers are identical in capacity and performance",
      "Requests take roughly the same time to process",
      "You want the simplest possible distribution strategy",
    ],
  },
  "sharding": {
    term: "Sharding",
    eli5: "Split a huge database into smaller pieces, each holding a different slice of data.",
    definition:
      "Splitting data across multiple databases by a key (like user ID), so each database holds only a slice of the total data.",
    relevance:
      "The primary way to scale write throughput beyond what a single database can handle. Aggregate capacity grows linearly with shard count.",
    analogy:
      "Like splitting a phone book into volumes A–M and N–Z: each volume is smaller and faster to search.",
    category: "pattern",
    whenToUse: [
      "Your single database can't handle the write throughput you need",
      "Your dataset is too large for one machine",
      "You need to scale storage or compute independently per data subset",
      "Different user segments access disjoint slices of data",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="14" y="65" width="60" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="44" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">App</text><line x1="74" y1="80" x2="110" y2="80" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="112" y="52" width="78" height="56" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="151" y="75" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Shard</text><text x="151" y="91" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Router</text><line x1="190" y1="65" x2="228" y2="32" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="190" y1="80" x2="228" y2="80" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="190" y1="95" x2="228" y2="128" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="230" y="16" width="80" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="270" y="35" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Shard A</text><rect x="230" y="65" width="80" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="270" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Shard B</text><rect x="230" y="114" width="80" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="270" y="133" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Shard C</text></svg>`,
  },
  "shard": {
    term: "Shard",
    eli5: "One slice of a split database: a node that holds its own piece of the data.",
    definition:
      "One partition in a sharded system: a database instance responsible for a subset of the total data.",
    relevance:
      "Each shard operates independently. If one shard is slow or down, only the users whose data lives on that shard are affected.",
    category: "component",
    whenToUse: [
      "You need horizontal write scaling beyond a single database node",
      "You want isolated failure domains per data subset",
      "Your query patterns mostly access a single partition at a time",
    ],
  },
  "shard key": {
    term: "Shard Key",
    eli5: "The field that decides which database slice stores each piece of data.",
    definition:
      "The field used to determine which shard a piece of data belongs to (e.g., hash of user_id modulo number of shards).",
    relevance:
      "Choosing a good shard key is one of the most consequential decisions in system design. Bad keys create hot spots.",
    category: "concept",
    whenToUse: [
      "Designing a sharded database schema",
      "Choosing which column routes writes to each partition",
      "Avoiding hot spots by selecting a high-cardinality field",
    ],
  },
  "replication": {
    term: "Replication",
    eli5: "Make exact copies of your database on multiple machines so nothing is lost if one breaks.",
    definition:
      "Keeping copies of the same data on multiple nodes so that if one fails, others can continue serving requests.",
    relevance:
      "The primary mechanism for high availability. Without replicas, every database is one hardware failure away from downtime.",
    analogy:
      "Like keeping backup copies of important files on multiple USB drives.",
    category: "pattern",
    whenToUse: [
      "You need high availability and cannot tolerate data-loss on hardware failure",
      "You want to spread read traffic across multiple nodes",
      "You need a fast failover path when the primary fails",
      "Geographic distribution requires nearby copies of data",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="110" y="16" width="100" height="44" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="160" y="36" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Primary</text><text x="160" y="52" text-anchor="middle" fill="#7adfff" font-family="ui-monospace,monospace" font-size="9">(writes)</text><line x1="130" y1="60" x2="76" y2="98" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="190" y1="60" x2="244" y2="98" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="18" y="100" width="116" height="44" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="76" y="120" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Replica 1</text><text x="76" y="135" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(reads)</text><rect x="186" y="100" width="116" height="44" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="244" y="120" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Replica 2</text><text x="244" y="135" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(reads)</text><text x="160" y="156" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="8">async replication</text></svg>`,
  },
  "replica": {
    term: "Replica",
    eli5: "A copy of a database that can serve reads and take over if the primary fails.",
    definition:
      "A copy of a database that receives replicated writes from the primary and serves read traffic independently.",
    relevance:
      "Replicas multiply your read capacity and provide failover. The trade-off is replication lag: replicas may briefly show stale data.",
    category: "component",
    whenToUse: [
      "You need extra read throughput beyond what one database can serve",
      "You want a warm standby ready for immediate failover",
      "You need a geographically close data copy for lower latency",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="110" y="16" width="100" height="44" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="160" y="36" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Primary</text><text x="160" y="52" text-anchor="middle" fill="#7adfff" font-family="ui-monospace,monospace" font-size="9">(writes)</text><line x1="130" y1="60" x2="76" y2="98" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="190" y1="60" x2="244" y2="98" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="18" y="100" width="116" height="44" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="76" y="120" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Replica 1</text><text x="76" y="135" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(reads)</text><rect x="186" y="100" width="116" height="44" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="244" y="120" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Replica 2</text><text x="244" y="135" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(reads)</text><text x="160" y="156" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="8">async replication</text></svg>`,
  },
  "primary": {
    term: "Primary",
    eli5: "The main database that accepts all write operations and leads replication.",
    definition:
      "The authoritative database instance in a replication set that accepts all write operations.",
    relevance:
      "All writes flow through the primary, making it a potential bottleneck and single point of failure until promotion is set up.",
    category: "component",
    whenToUse: [
      "Every replicated system needs exactly one primary to accept writes",
      "You need a single authoritative source of truth for updates",
      "You are setting up a primary-replica topology for read scaling",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="110" y="16" width="100" height="44" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="160" y="36" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Primary</text><text x="160" y="52" text-anchor="middle" fill="#7adfff" font-family="ui-monospace,monospace" font-size="9">(writes)</text><line x1="130" y1="60" x2="76" y2="98" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="190" y1="60" x2="244" y2="98" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="18" y="100" width="116" height="44" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="76" y="120" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Replica 1</text><text x="76" y="135" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(reads)</text><rect x="186" y="100" width="116" height="44" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="244" y="120" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Replica 2</text><text x="244" y="135" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(reads)</text><text x="160" y="156" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="8">async replication</text></svg>`,
  },
  "eventual consistency": {
    term: "Eventual Consistency",
    eli5: "All copies of your data will agree eventually: just not necessarily right now.",
    definition:
      "A consistency model where all replicas will converge to the same value eventually, but reads may temporarily return stale data.",
    relevance:
      "The trade-off you accept for higher availability and lower latency. Most social media, analytics, and notification systems are eventually consistent.",
    analogy:
      "Like updating your profile picture: friends on different servers might see the old one for a few seconds before it propagates everywhere.",
    category: "concept",
    whenToUse: [
      "High availability matters more than instant consistency",
      "Building social feeds, analytics, or notification systems",
      "Network partitions must not stop the system from responding",
    ],
  },
  "strong consistency": {
    term: "Strong Consistency",
    eli5: "After you write data, every reader instantly sees your change: no exceptions.",
    definition:
      "A guarantee that after a write completes, all subsequent reads will return the updated value, no matter which replica they hit.",
    relevance:
      "Required for financial transactions and anything where reading stale data causes real harm. Costs more latency than eventual consistency.",
    category: "concept",
    whenToUse: [
      "Handling financial transactions or inventory counts",
      "Reading stale data would cause real harm to users",
      "Correctness is more important than availability or latency",
    ],
  },
  "latency": {
    term: "Latency",
    eli5: "How long it takes from clicking a button to seeing the result on screen.",
    definition:
      "The time between sending a request and receiving a response: the end-to-end delay a user actually experiences.",
    relevance:
      "The metric users feel most directly. Every additional network hop, queue wait, or computation adds latency.",
    analogy:
      "The time between clicking a button and seeing the result. Lower is better.",
    category: "concept",
    whenToUse: [
      "Setting SLAs for user-facing request response time",
      "Deciding which component to optimize first",
      "Comparing the cost of extra network hops versus caching",
    ],
  },
  "throughput": {
    term: "Throughput",
    eli5: "How many requests your system can handle per second at full capacity.",
    definition:
      "The number of requests a system can process per unit of time: its sustained capacity under load.",
    relevance:
      "Determines how many users you can serve simultaneously. Scale throughput by adding capacity at your bottleneck.",
    category: "concept",
    whenToUse: [
      "Planning how many servers you need for a given traffic level",
      "Identifying the bottleneck limiting overall system capacity",
      "Comparing horizontal versus vertical scaling strategies",
    ],
  },
  "p95 latency": {
    term: "p95 Latency",
    eli5: "The slowest response time that 95% of your users experience.",
    definition:
      "The latency at the 95th percentile: 95% of requests are faster than this value. It captures the experience of your slowest typical users.",
    relevance:
      "More meaningful than average latency. A low average can hide a terrible experience for 1 in 20 users.",
    analogy:
      "Like saying \"95% of pizza deliveries arrive within 30 minutes\": the p95 is 30 minutes.",
    category: "concept",
    whenToUse: [
      "Setting SLOs that represent the typical user experience",
      "Identifying tail-latency issues affecting a significant minority",
      "Monitoring service health beyond just average response time",
    ],
  },
  "p99": {
    term: "p99",
    eli5: "Only 1% of requests are slower than this: your worst typical performance.",
    definition:
      "The 99th percentile latency: only 1% of requests are slower than this value.",
    relevance:
      "Used for strict SLAs. Improving p99 often requires eliminating tail-latency outliers like garbage collection pauses or cold cache misses.",
    category: "concept",
    whenToUse: [
      "Defining strict latency SLAs for critical services",
      "Hunting down GC pauses, cold cache misses, or other outliers",
      "Reporting on tail latency in dashboards and alerts",
    ],
  },
  "bottleneck": {
    term: "Bottleneck",
    eli5: "The one slow part of your system that makes everything else wait.",
    definition:
      "The single component in a system that limits overall throughput: the constraint everything else is waiting on.",
    relevance:
      "Optimising anything other than the bottleneck is wasted effort. Find it first, fix it, then find the next one.",
    analogy:
      "The narrowest point in a funnel: widening anywhere else doesn't help water flow faster.",
    category: "concept",
    whenToUse: [
      "Before adding capacity anywhere, find this constraint first",
      "When system performance plateaus despite adding more servers",
      "Profiling to find where optimization will have real impact",
    ],
  },
  "capacity": {
    term: "Capacity",
    eli5: "The maximum load a component can handle before it starts dropping requests.",
    definition:
      "The maximum number of concurrent requests a component can handle before it starts dropping new arrivals.",
    relevance:
      "Every node has a capacity ceiling. When in-flight requests hit that ceiling, the system starts failing: that's when you need to scale.",
    category: "concept",
    whenToUse: [
      "Planning headroom before expected scaling events",
      "Setting rate limits based on actual downstream service limits",
      "Sizing queues and connection pools appropriately",
    ],
  },
  "cache hit": {
    term: "Cache Hit",
    eli5: "You asked the cache and it had the answer: fast, cheap, and instant.",
    definition:
      "When the requested data is found in the cache and returned immediately without querying the backend.",
    relevance:
      "Cache hits are fast and cheap. A high hit rate means your backend only handles the unique or freshly-changed requests.",
    category: "concept",
    whenToUse: [
      "Measuring whether your caching strategy is effective",
      "Setting cache hit rate targets in your SLOs",
      "Deciding when to add more cache capacity",
    ],
  },
  "cache miss": {
    term: "Cache Miss",
    eli5: "The cache didn't have the answer, so you had to ask the slower database.",
    definition:
      "When the requested data isn't in the cache, requiring a more expensive fetch from the database or origin server.",
    relevance:
      "Misses are expensive because you pay for both the cache lookup and the backend query. A system with a low hit rate may be worse off than no cache at all.",
    category: "concept",
    whenToUse: [
      "Diagnosing why your cache isn't reducing backend load",
      "Understanding the worst-case latency path through the system",
      "Planning for cache warm-up strategies after deployments",
    ],
  },
  "hit rate": {
    term: "Hit Rate",
    eli5: "What percentage of requests your cache answers without touching the database.",
    definition:
      "The percentage of requests served from cache. A 90% hit rate means only 10% of traffic reaches your backend.",
    relevance:
      "The single most important metric for any caching layer. It directly determines how much load you offload from your origin.",
    category: "concept",
    whenToUse: [
      "Measuring cache effectiveness and return on investment",
      "Deciding whether to expand cache size or change eviction policy",
      "Diagnosing performance regressions after cache config changes",
    ],
  },
  "cache-aside": {
    term: "Cache-Aside",
    eli5: "Check cache first; on miss, fetch from DB and store the result for next time.",
    definition:
      "A caching pattern where the application checks the cache first, queries the database on miss, then stores the result in the cache.",
    relevance:
      "The most common pattern. The application controls what gets cached and when, giving you flexibility at the cost of more code.",
    category: "pattern",
    whenToUse: [
      "Your data is read far more often than it is written",
      "The application should control exactly what gets cached",
      "You can tolerate a brief window of stale data after a write",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="14" y="65" width="64" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="46" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">App</text><rect x="128" y="52" width="64" height="56" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="160" y="74" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Cache</text><text x="160" y="90" text-anchor="middle" fill="#7adfff" font-family="ui-monospace,monospace" font-size="8">check first</text><rect x="242" y="52" width="64" height="56" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="274" y="74" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">DB</text><text x="274" y="90" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="8">source of truth</text><line x1="78" y1="76" x2="128" y2="76" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="128" y1="90" x2="78" y2="90" stroke="#9be36b" stroke-width="1.5" marker-end="url(#a)"/><text x="103" y="112" text-anchor="middle" fill="#9be36b" font-family="ui-monospace,monospace" font-size="8">HIT: return</text><line x1="192" y1="72" x2="242" y2="72" stroke="#ff5c5c" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#a)"/><text x="217" y="66" text-anchor="middle" fill="#ff5c5c" font-family="ui-monospace,monospace" font-size="8">MISS</text><line x1="242" y1="92" x2="192" y2="92" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><text x="217" y="110" text-anchor="middle" fill="#60a5fa" font-family="ui-monospace,monospace" font-size="8">store</text></svg>`,
  },
  "ttl": {
    term: "TTL (Time to Live)",
    eli5: "An expiry timer on cached data: after this many seconds, throw it out and refetch.",
    definition:
      "How long a cached value is considered fresh before it expires and the next request triggers a refetch.",
    relevance:
      "Balances freshness vs performance. Short TTLs keep data current but reduce hit rate. Long TTLs maximise caching but risk stale data.",
    category: "concept",
    whenToUse: [
      "Setting freshness guarantees on cached or computed data",
      "Balancing staleness tolerance against cache hit rate",
      "Preventing stale data from living in cache indefinitely",
    ],
  },
  "queue": {
    term: "Queue",
    eli5: "A waiting line where tasks sit until a worker is free to handle them.",
    definition:
      "A buffer that accepts messages from producers and holds them until consumers are ready to process them, decoupling production rate from consumption rate.",
    relevance:
      "The primary tool for smoothing traffic spikes. Producers don't wait; consumers process at their own pace.",
    analogy:
      "Like a line at a coffee shop: customers arrive in bursts, but the barista serves them one at a time at a steady pace.",
    category: "component",
    whenToUse: [
      "Traffic spikes need absorbing without dropping requests",
      "You want to decouple producer speed from consumer speed",
      "Processing can be deferred and need not happen synchronously",
      "You need to buffer work between services of different throughput",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="10" y="65" width="72" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="46" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Producer</text><line x1="82" y1="80" x2="108" y2="80" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="110" y="55" width="100" height="50" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="160" y="75" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Queue</text><rect x="118" y="82" width="18" height="14" rx="2" fill="#13243a" stroke="#22405f"/><rect x="140" y="82" width="18" height="14" rx="2" fill="#13243a" stroke="#22405f"/><rect x="162" y="82" width="18" height="14" rx="2" fill="#13243a" stroke="#22405f"/><rect x="184" y="82" width="16" height="14" rx="2" fill="#13243a" stroke="#22405f"/><line x1="210" y1="80" x2="236" y2="80" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="238" y="65" width="72" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="274" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Consumer</text></svg>`,
  },
  "dead-letter queue": {
    term: "Dead-Letter Queue (DLQ)",
    eli5: "A separate queue where failed or unprocessable messages get parked for inspection.",
    definition:
      "A side-channel queue where messages that can't be processed (overflows, poison pills, repeated failures) are stored for later inspection.",
    relevance:
      "Prevents silent data loss. Instead of dropping messages forever, you can inspect why they failed and replay them when the issue is fixed.",
    category: "component",
    whenToUse: [
      "You cannot afford to silently drop failed messages",
      "You need to debug why certain messages keep failing",
      "You want to replay fixed messages after a bug is resolved",
    ],
  },
  "token bucket": {
    term: "Token Bucket",
    eli5: "Tokens refill at a fixed rate; each request spends one: run out and get rejected.",
    definition:
      "A rate-limiting algorithm where tokens refill at a fixed rate and each request consumes one. Empty bucket = request rejected.",
    relevance:
      "The most common rate-limiting implementation. The refill rate sets your sustained limit; the bucket size sets your burst tolerance.",
    analogy:
      "Like a parking meter that adds time at a fixed rate: if you've used it all up, you can't park until more accrues.",
    category: "concept",
    whenToUse: [
      "Implementing rate limiting with burst tolerance",
      "You want sustained rate limits but allow short traffic bursts",
      "Tracking per-client usage quotas in your API gateway",
    ],
  },
  "rate limiting": {
    term: "Rate Limiting",
    eli5: "Putting a cap on how many requests a client can make in a given time window.",
    definition:
      "Capping how many requests per unit of time a client or service can make, protecting downstream systems from overload.",
    relevance:
      "Essential for APIs exposed to the internet. Without it, one misbehaving client can exhaust resources for everyone.",
    category: "concept",
    whenToUse: [
      "Protecting public APIs from abusive or misbehaving clients",
      "Preventing one noisy neighbour from starving other tenants",
      "Enforcing fair usage policies in multi-tenant systems",
    ],
  },
  "circuit breaker": {
    term: "Circuit Breaker",
    eli5: "A switch that trips open when a downstream service fails too much, stopping the bleeding.",
    definition:
      "A pattern that monitors downstream failures and trips open (rejecting requests immediately) when the error rate exceeds a threshold, preventing cascading failures.",
    relevance:
      "Protects the rest of your system when one dependency is down. Callers get fast errors instead of waiting for timeouts.",
    analogy:
      "Like an electrical circuit breaker: it cuts power to prevent a short circuit from starting a fire.",
    category: "component",
    whenToUse: [
      "Calling an external or unreliable dependency",
      "Preventing cascading failures from propagating through your system",
      "You want fast failure responses instead of waiting for timeouts",
      "After failures stabilise, you need automatic recovery probing",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="10" y="58" width="82" height="44" rx="6" fill="#0e1a2b" stroke="#9be36b"/><text x="51" y="78" text-anchor="middle" fill="#9be36b" font-family="ui-monospace,monospace" font-size="11">CLOSED</text><text x="51" y="94" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(normal)</text><rect x="228" y="58" width="82" height="44" rx="6" fill="#0e1a2b" stroke="#ff5c5c"/><text x="269" y="78" text-anchor="middle" fill="#ff5c5c" font-family="ui-monospace,monospace" font-size="11">OPEN</text><text x="269" y="94" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(rejecting)</text><rect x="119" y="108" width="82" height="44" rx="6" fill="#0e1a2b" stroke="#ffb547"/><text x="160" y="127" text-anchor="middle" fill="#ffb547" font-family="ui-monospace,monospace" font-size="10">HALF-OPEN</text><text x="160" y="143" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(probing)</text><line x1="92" y1="70" x2="228" y2="70" stroke="#ff5c5c" stroke-width="1.5" marker-end="url(#a)"/><text x="160" y="65" text-anchor="middle" fill="#ff5c5c" font-family="ui-monospace,monospace" font-size="8">failures &gt; threshold</text><line x1="264" y1="102" x2="200" y2="110" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><text x="248" y="110" text-anchor="middle" fill="#60a5fa" font-family="ui-monospace,monospace" font-size="8">timeout</text><line x1="119" y1="122" x2="52" y2="102" stroke="#9be36b" stroke-width="1.5" marker-end="url(#a)"/><text x="74" y="120" text-anchor="middle" fill="#9be36b" font-family="ui-monospace,monospace" font-size="8">success</text></svg>`,
  },
  "cascading failure": {
    term: "Cascading Failure",
    eli5: "One failing service causes its callers to fail, which causes their callers to fail: dominos.",
    definition:
      "When one failing component causes its callers to back up and fail, which causes their callers to fail, propagating outages through the entire system.",
    relevance:
      "The most dangerous failure mode in microservices. Circuit breakers, timeouts, and bulkheads are your defences.",
    category: "concept",
    whenToUse: [
      "Understanding the blast radius when a critical dependency has an outage",
      "Designing circuit breakers and bulkheads to contain failures",
      "Planning failure injection tests to validate isolation",
    ],
  },
  "cdn": {
    term: "CDN (Content Delivery Network)",
    eli5: "Copies of your content cached at servers close to users around the world.",
    definition:
      "A network of geographically distributed edge servers that cache and serve content close to users, reducing latency and origin load.",
    relevance:
      "For read-heavy traffic, a CDN can absorb 90%+ of requests before they ever reach your origin servers.",
    category: "component",
    whenToUse: [
      "Serving static assets, images, or videos to a global audience",
      "Your origin server is too far away for acceptable latency",
      "You want to reduce bandwidth and compute load on origin servers",
      "You need DDoS mitigation at the network edge",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="10" y="65" width="60" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="40" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">User</text><line x1="70" y1="80" x2="110" y2="80" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="112" y="52" width="84" height="56" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="154" y="74" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Edge</text><text x="154" y="89" text-anchor="middle" fill="#7adfff" font-family="ui-monospace,monospace" font-size="9">CDN PoP</text><line x1="112" y1="92" x2="70" y2="92" stroke="#9be36b" stroke-width="1.5" marker-end="url(#a)"/><text x="91" y="112" text-anchor="middle" fill="#9be36b" font-family="ui-monospace,monospace" font-size="8">cache hit</text><line x1="196" y1="72" x2="240" y2="72" stroke="#60a5fa" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#a)"/><text x="218" y="66" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="8">miss</text><rect x="242" y="52" width="68" height="56" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="276" y="74" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Origin</text><text x="276" y="89" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">Server</text><line x1="242" y1="92" x2="196" y2="92" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/></svg>`,
  },
  "horizontal scaling": {
    term: "Horizontal Scaling",
    eli5: "Add more machines instead of making one machine bigger.",
    definition:
      "Adding more machines of the same size to handle increased load, rather than upgrading a single machine.",
    relevance:
      "The foundation of modern cloud architectures. Scales further than vertical, survives individual failures, and is the only path to practically unlimited capacity.",
    category: "concept",
    whenToUse: [
      "Your single server is at its resource ceiling",
      "You need fault tolerance so no single server is critical",
      "You want to scale cost-linearly with traffic growth",
      "Your workload is stateless and easily distributable",
    ],
  },
  "vertical scaling": {
    term: "Vertical Scaling",
    eli5: "Upgrade one machine to be bigger and faster instead of adding more machines.",
    definition:
      "Upgrading a single machine with more CPU, memory, or storage to handle increased load.",
    relevance:
      "Simple but limited: there's a maximum machine size, it's expensive, and it creates a single point of failure.",
    analogy:
      "Upgrading to a single bigger server instead of adding more servers.",
    category: "concept",
    whenToUse: [
      "Your workload cannot easily be distributed across multiple machines",
      "You need a quick short-term capacity increase",
      "The operational complexity of multiple nodes is not worth it yet",
    ],
  },
  "single point of failure": {
    term: "Single Point of Failure",
    eli5: "One component whose failure brings the entire system to its knees.",
    definition:
      "Any component whose failure brings down the entire system: a non-redundant link in the chain.",
    relevance:
      "Identifying and eliminating single points of failure is one of the first steps in making a system reliable.",
    category: "concept",
    whenToUse: [
      "Auditing your architecture for reliability risks",
      "Deciding where to add redundancy first",
      "Justifying the cost of replication, load balancing, or failover",
    ],
  },
  "failover": {
    term: "Failover",
    eli5: "Automatically switching to a backup when the main component breaks.",
    definition:
      "Automatically switching to a backup component when the primary one fails, maintaining service continuity.",
    relevance:
      "The mechanism that makes replication useful for availability. Without failover, replicas are just expensive mirrors.",
    category: "pattern",
    whenToUse: [
      "Your primary must recover automatically without human intervention",
      "You have a replica already running and need automatic promotion",
      "Your SLA requires near-zero downtime during hardware outages",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="14" y="28" width="90" height="44" rx="6" fill="#0e1a2b" stroke="#ff5c5c"/><text x="59" y="48" text-anchor="middle" fill="#ff5c5c" font-family="ui-monospace,monospace" font-size="11">Primary</text><text x="59" y="63" text-anchor="middle" fill="#ff5c5c" font-family="ui-monospace,monospace" font-size="9">&#x2715; failed</text><rect x="14" y="98" width="90" height="44" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="59" y="118" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Replica</text><text x="59" y="133" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(standby)</text><line x1="104" y1="120" x2="212" y2="120" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><text x="158" y="113" text-anchor="middle" fill="#60a5fa" font-family="ui-monospace,monospace" font-size="9">promote</text><rect x="214" y="88" width="92" height="54" rx="6" fill="#0e1a2b" stroke="#9be36b"/><text x="260" y="110" text-anchor="middle" fill="#9be36b" font-family="ui-monospace,monospace" font-size="10">New Primary</text><text x="260" y="128" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="9">(serving writes)</text></svg>`,
  },
  "consistent hashing": {
    term: "Consistent Hashing",
    eli5: "A way to map keys to nodes so adding or removing a node only moves a little data.",
    definition:
      "A hashing technique where adding or removing nodes only redistributes a small fraction of keys, unlike modular hashing which remaps almost everything.",
    relevance:
      "Makes adding shards or cache nodes feasible in production without causing a thundering herd of cache misses.",
    category: "pattern",
    whenToUse: [
      "Adding or removing cache nodes without invalidating most cached data",
      "Distributing keys across a dynamically changing set of shards",
      "Avoiding thundering herds during cluster re-sharding events",
    ],
  },
  "hot key": {
    term: "Hot Key",
    eli5: "One cache or shard key that gets hammered with requests while all others sit idle.",
    definition:
      "A shard key or cache key that receives disproportionately more traffic than others, creating an imbalanced load on one node.",
    relevance:
      "Even a perfectly sharded system can have bottlenecks if one key (like a celebrity's user ID) dominates traffic.",
    category: "concept",
    whenToUse: [
      "Designing shard key selection to avoid imbalanced load",
      "Diagnosing why one shard or cache node is overloaded",
      "Deciding whether to replicate a hot key across multiple nodes",
    ],
  },
  "in-flight": {
    term: "In-Flight",
    eli5: "Requests that have been sent but are still waiting for a reply.",
    definition:
      "Requests that have been sent but haven't received a response yet: they're consuming resources on the server while waiting to complete.",
    relevance:
      "The number of in-flight requests determines whether you're within a component's capacity or about to hit overload.",
    category: "concept",
    whenToUse: [
      "Monitoring server-side concurrency levels",
      "Setting connection pool sizes based on concurrent request load",
      "Deciding when a component is approaching its capacity ceiling",
    ],
  },
  "backpressure": {
    term: "Backpressure",
    eli5: "A slow consumer signalling producers to slow down before the queue explodes.",
    definition:
      "A mechanism where a slow consumer signals upstream to slow down, preventing unbounded queue growth and resource exhaustion.",
    relevance:
      "Without backpressure, fast producers can overwhelm slow consumers until memory runs out. Good systems propagate pressure signals upstream.",
    category: "concept",
    whenToUse: [
      "Your consumer processes messages slower than producers generate them",
      "You want to avoid unbounded queue growth exhausting memory",
      "Designing streaming data pipelines with controlled flow rates",
    ],
  },
  "write-ahead log": {
    term: "Write-Ahead Log (WAL)",
    eli5: "Write changes to a log before applying them so crashes can be recovered from.",
    definition:
      "A technique where changes are written to an append-only log before being applied, providing crash recovery by replaying the log.",
    relevance:
      "How databases guarantee durability. If the server crashes mid-transaction, the WAL lets it recover to a consistent state on restart.",
    category: "concept",
    whenToUse: [
      "Implementing crash recovery in a database or storage system",
      "Providing a complete audit trail of every change to a dataset",
      "Replicating changes from primary to replicas via log streaming",
    ],
  },
  "fan-out": {
    term: "Fan-Out",
    eli5: "One event triggers writes or notifications to many different services at once.",
    definition:
      "When a single request triggers multiple downstream requests: one input becomes many outputs.",
    relevance:
      "Common in notification systems and aggregation. Each level of fan-out multiplies load, so deep fan-out can be surprisingly expensive.",
    category: "pattern",
    whenToUse: [
      "Building notification systems that broadcast to many users",
      "Aggregating data from one source into multiple derived views",
      "Event-driven architectures where many consumers react to one event",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="14" y="65" width="70" height="30" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="49" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Event</text><line x1="84" y1="72" x2="198" y2="26" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="84" y1="77" x2="198" y2="64" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="84" y1="83" x2="198" y2="102" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="84" y1="88" x2="198" y2="140" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="200" y="12" width="106" height="26" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="253" y="29" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Email Service</text><rect x="200" y="50" width="106" height="26" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="253" y="67" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Push Notify</text><rect x="200" y="88" width="106" height="26" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="253" y="105" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Analytics</text><rect x="200" y="126" width="106" height="26" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="253" y="143" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="10">Feed Update</text></svg>`,
  },
  "cache": {
    term: "Cache",
    eli5: "A sticky-note pad that remembers recent answers so you don't look them up again.",
    definition:
      "A fast, temporary storage layer that keeps copies of frequently accessed data so future requests can be served without hitting the slower backend.",
    relevance:
      "Dramatically reduces latency and backend load for read-heavy workloads. The trade-off is managing staleness: cached data may be out of date.",
    analogy:
      "Like keeping your most-used tools on your desk instead of walking to the supply closet every time.",
    category: "component",
    whenToUse: [
      "Your data is read far more often than it changes",
      "The same expensive query is repeated by many different users",
      "You can tolerate serving slightly stale data for better speed",
      "Database load is the bottleneck for your read-heavy service",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="14" y="65" width="64" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="46" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">App</text><rect x="128" y="55" width="64" height="50" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="160" y="77" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Cache</text><rect x="242" y="65" width="64" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="274" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">DB</text><line x1="78" y1="76" x2="128" y2="76" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="128" y1="88" x2="78" y2="88" stroke="#9be36b" stroke-width="1.5" marker-end="url(#a)"/><text x="103" y="110" text-anchor="middle" fill="#9be36b" font-family="ui-monospace,monospace" font-size="9">HIT</text><line x1="192" y1="76" x2="242" y2="76" stroke="#60a5fa" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#a)"/><text x="217" y="70" text-anchor="middle" fill="#ff5c5c" font-family="ui-monospace,monospace" font-size="9">MISS</text><line x1="242" y1="88" x2="192" y2="88" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/></svg>`,
  },
  "durability": {
    term: "Durability",
    eli5: "Once data is saved, it stays saved: even if the server crashes a second later.",
    definition:
      "The guarantee that once data is written and acknowledged, it won't be lost: even if the server crashes immediately after.",
    relevance:
      "Databases achieve durability through write-ahead logs and disk flushes. Sacrificing durability (e.g., async writes) trades safety for speed.",
    category: "concept",
    whenToUse: [
      "Designing storage for financial or other critical data",
      "Evaluating the risk of async write patterns",
      "Choosing between in-memory and disk-based storage layers",
    ],
  },
  "acknowledge": {
    term: "Acknowledge (ACK)",
    eli5: "A reply that says 'I got your message': the signal that work was accepted.",
    definition:
      "A confirmation message sent back to the sender indicating that a request or message was received and accepted for processing.",
    relevance:
      "Defines the contract between sender and receiver. A fast ack (before processing) means speed but less safety; a late ack (after processing) means safety but more latency.",
    category: "concept",
    whenToUse: [
      "Defining at what point in processing a message is considered received",
      "Designing reliable messaging with delivery confirmation",
      "Balancing speed versus safety in producer-consumer workflows",
    ],
  },
  "producer": {
    term: "Producer",
    eli5: "The part of the system that generates work and drops it into a queue.",
    definition:
      "A component that generates messages or work items and sends them into a queue or message broker for later processing.",
    relevance:
      "In async architectures, producers fire and forget: they don't wait for the work to actually complete, only for the queue to accept it.",
    category: "concept",
    whenToUse: [
      "Building async workflows where work generation is separate from processing",
      "You need to decouple the rate of work creation from consumption",
      "Designing event-driven pipelines with multiple downstream consumers",
    ],
  },
  "consumer": {
    term: "Consumer",
    eli5: "The worker that pulls tasks from a queue and actually processes them.",
    definition:
      "A component that pulls messages from a queue and processes them: the worker that actually does the job the producer requested.",
    relevance:
      "Consumers set the actual processing rate. If consumers are slower than producers, queues grow. Scale consumers to match sustained production rate.",
    category: "concept",
    whenToUse: [
      "Scaling processing workers independently from the producer",
      "You have variable processing rates and need flexible scaling",
      "Multiple consumers can compete for tasks from one shared queue",
    ],
  },
  "read replica": {
    term: "Read Replica",
    eli5: "A database copy that only handles reads, taking pressure off the write primary.",
    definition:
      "A copy of the primary database that only serves read queries, receiving writes asynchronously via replication from the primary.",
    relevance:
      "Multiplies read throughput without affecting write performance. The trade-off is a small replication lag where reads may be slightly stale.",
    category: "component",
    whenToUse: [
      "Your read traffic is overwhelming the primary database",
      "You want to serve analytics queries without impacting write performance",
      "Geographic latency requires a nearby read-only copy",
    ],
  },
  "write-through": {
    term: "Write-Through",
    eli5: "Write to both cache and database at the same time: both always agree.",
    definition:
      "A caching strategy where every write updates both the cache and the database simultaneously before acknowledging success.",
    relevance:
      "Guarantees the cache is always consistent with the database, at the cost of slower writes since both stores must confirm.",
    category: "pattern",
    whenToUse: [
      "Cache consistency is critical and stale reads are unacceptable",
      "Writes are infrequent enough that double-write latency is acceptable",
      "You want to guarantee the cache always holds the latest data",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="20" y="65" width="64" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="52" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">App</text><text x="52" y="55" text-anchor="middle" fill="#60a5fa" font-family="ui-monospace,monospace" font-size="9">write</text><line x1="84" y1="72" x2="178" y2="40" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="84" y1="88" x2="178" y2="120" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><rect x="180" y="22" width="80" height="32" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="220" y="42" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Cache</text><rect x="180" y="106" width="80" height="32" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="220" y="126" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">DB</text><text x="220" y="86" text-anchor="middle" fill="#9be36b" font-family="ui-monospace,monospace" font-size="9">sync write</text><line x1="180" y1="44" x2="84" y2="80" stroke="#9be36b" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#a)"/><line x1="180" y1="118" x2="84" y2="92" stroke="#9be36b" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#a)"/><text x="290" y="78" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="8">ACK</text><text x="290" y="90" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="8">both</text></svg>`,
  },
  "write-behind": {
    term: "Write-Behind",
    eli5: "Write to cache instantly, then sync to database later in the background.",
    definition:
      "A caching strategy where writes go to the cache first, then asynchronously flush to the database in the background.",
    relevance:
      "Extremely fast writes, but risks data loss if the cache crashes before flushing. Used when speed matters more than immediate durability.",
    category: "pattern",
    whenToUse: [
      "Write throughput is the bottleneck and you need sub-millisecond acks",
      "Data loss in a short crash window is acceptable for your use case",
      "You have high write volume with bursty patterns",
    ],
    diagramSvg: `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L0,7 L7,3.5 z" fill="#60a5fa"/></marker></defs><rect x="14" y="65" width="64" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="46" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">App</text><rect x="128" y="52" width="64" height="56" rx="6" fill="#0e1a2b" stroke="#60a5fa"/><text x="160" y="74" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">Cache</text><rect x="242" y="65" width="64" height="30" rx="6" fill="#0e1a2b" stroke="#22405f"/><text x="274" y="84" text-anchor="middle" fill="#f5efd6" font-family="ui-monospace,monospace" font-size="11">DB</text><line x1="78" y1="76" x2="128" y2="76" stroke="#60a5fa" stroke-width="1.5" marker-end="url(#a)"/><line x1="128" y1="88" x2="78" y2="88" stroke="#9be36b" stroke-width="1.5" marker-end="url(#a)"/><text x="103" y="108" text-anchor="middle" fill="#9be36b" font-family="ui-monospace,monospace" font-size="8">ACK fast</text><line x1="192" y1="80" x2="242" y2="80" stroke="#ffb547" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#a)"/><text x="217" y="70" text-anchor="middle" fill="#ffb547" font-family="ui-monospace,monospace" font-size="8">async flush</text></svg>`,
  },
  "write-around": {
    term: "Write-Around",
    eli5: "Skip the cache on writes: go straight to the database, let reads fill the cache.",
    definition:
      "A caching strategy where writes go directly to the database, bypassing the cache entirely. The cache fills on subsequent reads.",
    relevance:
      "Avoids polluting the cache with data that may never be read again. Good for write-heavy workloads with low read repetition.",
    category: "pattern",
    whenToUse: [
      "Data is written once and rarely read back (logs, audit trails)",
      "You don't want to pollute cache with rarely-accessed write data",
      "Writes are bulk uploads where caching would not help",
    ],
  },
  "timeout": {
    term: "Timeout",
    eli5: "Give up waiting for a slow response after a fixed amount of time.",
    definition:
      "A maximum time limit after which a waiting operation is cancelled and treated as a failure, freeing up resources.",
    relevance:
      "Without timeouts, slow or dead dependencies hold connections open indefinitely, eventually exhausting your system's resources.",
    category: "concept",
    whenToUse: [
      "Calling any external service or database that might hang",
      "Preventing slow dependencies from holding all your connections",
      "Protecting user-facing latency from a stalling downstream service",
    ],
  },
  "retry": {
    term: "Retry",
    eli5: "Try again if the first attempt fails: transient issues often resolve themselves.",
    definition:
      "Automatically re-attempting a failed operation, usually with a delay between attempts, hoping the transient issue has resolved.",
    relevance:
      "Essential for handling temporary failures (network blips, brief overloads). Must be combined with idempotency to be safe: otherwise retries can cause duplicate effects.",
    category: "concept",
    whenToUse: [
      "Network calls that fail transiently and are idempotent",
      "Queue consumers that hit temporary downstream errors",
      "Combined with exponential backoff to avoid overwhelming a recovering service",
    ],
  },
  "exponential backoff": {
    term: "Exponential Backoff",
    eli5: "Wait longer after each failed retry: 1 s, then 2 s, then 4 s, then 8 s.",
    definition:
      "A retry strategy where the wait between attempts doubles each time (e.g., 1s, 2s, 4s, 8s), reducing pressure on an already-struggling system.",
    relevance:
      "Prevents retry storms: if many clients retry immediately and simultaneously, they can overwhelm a recovering system all over again.",
    category: "pattern",
    whenToUse: [
      "Retrying requests to a system that is struggling under load",
      "Preventing retry storms from overwhelming a recovering service",
      "Any retry loop where immediate re-attempts would make things worse",
    ],
  },
  "connection pool": {
    term: "Connection Pool",
    eli5: "A pre-made set of database connections ready to reuse instead of making new ones.",
    definition:
      "A set of pre-established, reusable connections to a database or service, avoiding the overhead of creating a new connection for every request.",
    relevance:
      "Creating connections is expensive (TCP handshake, TLS, auth). Pools amortize that cost across many requests, but pool exhaustion can become a bottleneck.",
    category: "concept",
    whenToUse: [
      "Your service makes many short database queries per request",
      "Connection establishment latency is adding up noticeably",
      "You need to limit total concurrent connections to a downstream service",
    ],
  },
  "partition": {
    term: "Partition",
    eli5: "A segment of data or infrastructure separated from others: by design or failure.",
    definition:
      "A subset of data or infrastructure separated from others: either intentionally (sharding) or by failure (network partition).",
    relevance:
      "In distributed systems, network partitions are inevitable. The CAP theorem says you must choose between consistency and availability when one occurs.",
    category: "concept",
    whenToUse: [
      "Designing data layouts for sharded systems",
      "Understanding CAP theorem trade-offs during a network split",
      "Isolating failure domains in large distributed systems",
    ],
  },
  "network partition": {
    term: "Network Partition",
    eli5: "A network split where some nodes can't talk to others for a period of time.",
    definition:
      "When a network failure splits a system into groups of nodes that can talk to each other but not across groups.",
    relevance:
      "Forces a design choice: do you reject requests (stay consistent) or allow stale reads (stay available)? This is the core trade-off of the CAP theorem.",
    category: "concept",
    whenToUse: [
      "Designing systems that must choose between consistency and availability",
      "Testing failure scenarios in distributed system acceptance tests",
      "Understanding why eventual consistency exists as a fundamental trade-off",
    ],
  },
  "availability": {
    term: "Availability",
    eli5: "What percentage of time your system is up and serving requests correctly.",
    definition:
      "The percentage of time a system is operational and responding to requests: often expressed as \"nines\" (99.9% = three nines).",
    relevance:
      "Every nine you add requires exponentially more engineering effort. Going from 99.9% to 99.99% means cutting downtime from ~8 hours/year to ~52 minutes/year.",
    category: "concept",
    whenToUse: [
      "Setting uptime SLAs for production services",
      "Calculating the cost of redundancy to achieve another nine of uptime",
      "Deciding how much failover investment is warranted for your SLA",
    ],
  },
  "sla": {
    term: "SLA (Service Level Agreement)",
    eli5: "A written promise about how reliable and fast your service will be.",
    definition:
      "A formal commitment defining the minimum acceptable performance (uptime, latency, error rate) that a service promises to deliver.",
    relevance:
      "SLAs set the bar for your architecture decisions. A 99.99% uptime SLA requires redundancy, failover, and monitoring that a 99% SLA doesn't.",
    category: "concept",
    whenToUse: [
      "Defining commitments to customers or internal teams",
      "Driving architecture decisions about redundancy and latency targets",
      "Measuring whether your system is meeting its reliability goals",
    ],
  },
  "service discovery": {
    term: "Service Discovery",
    eli5: "A registry that lets services find each other's addresses as they scale up and down.",
    definition:
      "A mechanism that lets services find each other's network addresses dynamically, without hardcoding IPs or hostnames.",
    relevance:
      "In cloud environments where instances spin up and down constantly, static addresses don't work. Service discovery makes auto-scaling possible.",
    category: "concept",
    whenToUse: [
      "Running in cloud environments where instance IPs change constantly",
      "Auto-scaling where new instances need to register and be found",
      "Microservices that call each other by name rather than hardcoded IP",
    ],
  },
  "orchestration": {
    term: "Orchestration",
    eli5: "A central controller tells each service what to do and in what order.",
    definition:
      "A central coordinator that directs the flow of work across multiple services, telling each one what to do and when.",
    relevance:
      "Simple to reason about and debug, but the orchestrator becomes a single point of failure and a potential bottleneck.",
    category: "pattern",
    whenToUse: [
      "Workflows where a central coordinator must sequence steps reliably",
      "You need clear visibility into workflow state in one place",
      "Error handling and compensation logic is complex and centralised",
    ],
  },
  "choreography": {
    term: "Choreography",
    eli5: "Services react to events on their own: no conductor, just musicians watching each other.",
    definition:
      "A decentralized approach where each service reacts to events independently, with no central coordinator directing the workflow.",
    relevance:
      "More resilient than orchestration (no single coordinator to fail) but harder to trace and debug since logic is spread across many services.",
    category: "pattern",
    whenToUse: [
      "Loose coupling is essential and no service should depend on a central coordinator",
      "You want to add subscribers to an event without changing publishers",
      "Services need to evolve independently without coordinating changes",
    ],
  },
  "eventual durability": {
    term: "Eventual Durability",
    eli5: "Your write is acknowledged before it hits disk: it will be saved soon, just not yet.",
    definition:
      "A model where writes are acknowledged before being persisted to durable storage: they'll be saved eventually, but not instantly.",
    relevance:
      "Used in async write patterns. The trade-off is clear: faster acknowledgement for the caller, but a window where data could be lost if the system crashes.",
    category: "concept",
    whenToUse: [
      "Write speed is paramount and a small data-loss window is acceptable",
      "Using write-behind caching or async write patterns",
      "You understand and explicitly accept the durability trade-off",
    ],
  },
  "decoupling": {
    term: "Decoupling",
    eli5: "Components that don't depend on each other's availability to do their jobs.",
    definition:
      "Designing components so they don't depend directly on each other's availability or timing: they communicate through intermediaries like queues or events.",
    relevance:
      "Decoupled systems are more resilient: if one component is slow or down, the others keep working. The trade-off is added complexity and eventual consistency.",
    analogy:
      "Like email vs phone calls: with email, both parties don't need to be available at the same time.",
    category: "concept",
    whenToUse: [
      "You want one service to continue when another is slow or down",
      "Absorbing traffic spikes without cascading pressure downstream",
      "Allowing teams to deploy services independently without coordination",
    ],
  },
  "thundering herd": {
    term: "Thundering Herd",
    eli5: "Thousands of clients all retry at exactly the same moment, creating a stampede.",
    definition:
      "When many clients simultaneously retry or re-request after a failure or cache expiration, overwhelming the backend with a sudden spike.",
    relevance:
      "A common cause of outages during recovery. Mitigations include jittered retries, request coalescing, and staggered cache TTLs.",
    category: "concept",
    whenToUse: [
      "Adding jitter to retry delays to spread load after outages",
      "Staggering TTL expiry so caches don't all expire simultaneously",
      "Designing cache warm-up strategies after deployment or failover",
    ],
  },
  "poison pill": {
    term: "Poison Pill",
    eli5: "A bad message that crashes every consumer that tries to process it.",
    definition:
      "A malformed message in a queue that crashes the consumer every time it's processed, blocking all subsequent messages.",
    relevance:
      "Without dead-letter queues, a single poison pill can halt an entire processing pipeline. DLQs isolate bad messages so the rest keep flowing.",
    category: "concept",
    whenToUse: [
      "Configuring dead-letter queues to catch repeatedly failing messages",
      "Adding schema validation before enqueuing to prevent malformed messages",
      "Setting max retry counts to avoid consumers getting stuck forever",
    ],
  },
  "cold start": {
    term: "Cold Start",
    eli5: "The slow startup when a service or cache has no warm state yet.",
    definition:
      "The initial delay when a service or cache is empty and must build up its state from scratch: no cached data, no warm connections.",
    relevance:
      "Causes latency spikes after deployments or scaling events. Pre-warming caches and connection pools mitigates the impact.",
    category: "concept",
    whenToUse: [
      "Pre-warming caches before traffic is cut over to a new deployment",
      "Sizing connection pools to handle cold startup burst connections",
      "Understanding why latency spikes after auto-scaling adds new instances",
    ],
  },
  "head-of-line blocking": {
    term: "Head-of-Line Blocking",
    eli5: "One stuck request at the front of the line holds up everyone waiting behind it.",
    definition:
      "When a slow or stuck request at the front of a queue prevents all requests behind it from being processed.",
    relevance:
      "Can turn one slow request into a system-wide outage. Solved by parallel processing, multiple queues, or timeouts that evict stuck items.",
    category: "concept",
    whenToUse: [
      "Diagnosing latency spikes caused by one slow or stuck request",
      "Deciding to use parallel processing queues instead of a single queue",
      "Evaluating HTTP/2 multiplexing versus HTTP/1.1 to reduce this risk",
    ],
  },
  "microservice": {
    term: "Microservice",
    eli5: "A small, independently deployable service that owns one business function.",
    definition:
      "An independently deployable service that owns a single business capability, communicating with other services over the network.",
    relevance:
      "Enables teams to deploy independently and scale individual components, but adds operational complexity (networking, monitoring, consistency).",
    category: "concept",
    whenToUse: [
      "Different parts of your system need to scale or deploy independently",
      "Multiple teams need to ship features without coordinating deploys",
      "You want to isolate failures to individual capabilities",
    ],
  },
  "monolith": {
    term: "Monolith",
    eli5: "One big application that does everything: one codebase, one deploy.",
    definition:
      "A single deployable unit containing all of an application's functionality: one codebase, one process, one deploy.",
    relevance:
      "Simpler to develop and debug initially, but becomes harder to scale and deploy independently as the team and system grow.",
    category: "concept",
    whenToUse: [
      "Starting a new project where operational simplicity matters most",
      "Your team is small and inter-service complexity would slow you down",
      "You want to defer architecture decisions until you understand the domain",
    ],
  },
  "read-heavy": {
    term: "Read-Heavy",
    eli5: "Your system handles way more reads than writes: think 99% read, 1% write.",
    definition:
      "A workload where reads vastly outnumber writes: typically 90%+ of traffic is reading data rather than creating or updating it.",
    relevance:
      "Read-heavy workloads benefit enormously from caching and read replicas. Most web traffic (product pages, feeds, search) is read-heavy.",
    category: "concept",
    whenToUse: [
      "Justifying a caching layer to absorb repeated reads",
      "Adding read replicas to scale beyond one database instance",
      "Optimising for read latency first in your performance work",
    ],
  },
  "write-heavy": {
    term: "Write-Heavy",
    eli5: "Your system writes data constantly: think logging, metrics, or IoT sensor streams.",
    definition:
      "A workload where writes dominate: logging, analytics ingestion, IoT sensor data, or high-frequency transactions.",
    relevance:
      "Write-heavy workloads need queues for burst absorption and sharding for throughput. Caching helps less since data changes constantly.",
    category: "concept",
    whenToUse: [
      "Designing append-only or time-series storage for high-write workloads",
      "Using sharding to distribute write load across many nodes",
      "Choosing queues to absorb write bursts before persisting to disk",
    ],
  },
  "fire-and-forget": {
    term: "Fire-and-Forget",
    eli5: "Send a message and don't wait: assume it will be processed eventually.",
    definition:
      "Sending a message or request without waiting for confirmation that it was processed: just trusting it will eventually be handled.",
    relevance:
      "Maximizes speed for the sender but sacrifices delivery guarantees. Appropriate for analytics events, logs, and non-critical notifications.",
    category: "pattern",
    whenToUse: [
      "Sending analytics events, logs, or non-critical notifications",
      "Throughput matters more than knowing whether the operation succeeded",
      "You are okay with occasional message loss in exchange for speed",
    ],
  },
  "middleware": {
    term: "Middleware",
    eli5: "Software that sits between your app and the world, handling common plumbing tasks.",
    definition:
      "Software that sits between components, adding cross-cutting functionality like authentication, logging, rate limiting, or request transformation.",
    relevance:
      "Keeps business logic clean by separating infrastructure concerns into reusable layers that all requests pass through.",
    category: "concept",
    whenToUse: [
      "Adding auth, logging, or rate limiting to all routes without touching each handler",
      "Cross-cutting concerns that every request should pass through",
      "Building reusable request handling pipelines",
    ],
  },
  "health check": {
    term: "Health Check",
    eli5: "An endpoint that tells load balancers whether a server is ready to take traffic.",
    definition:
      "An endpoint that reports whether a service is alive and ready to handle traffic: used by load balancers and orchestrators to route requests away from unhealthy instances.",
    relevance:
      "Without health checks, load balancers send traffic to dead instances. Health checks enable automatic recovery by routing around failures.",
    category: "concept",
    whenToUse: [
      "Every service behind a load balancer or ingress needs one",
      "Kubernetes uses it to restart unhealthy containers automatically",
      "Canary deployments use it to verify the new version before routing traffic",
    ],
  },
  "cap theorem": {
    term: "CAP Theorem",
    eli5: "You can only have two of three: consistency, availability, and partition tolerance.",
    definition:
      "A principle stating that a distributed system can provide at most two of three guarantees simultaneously: Consistency, Availability, and Partition tolerance.",
    relevance:
      "Since network partitions are unavoidable, the real choice is between consistency (reject requests during partitions) and availability (serve potentially stale data).",
    category: "concept",
    whenToUse: [
      "Choosing a database for a distributed system (CP vs AP trade-off)",
      "Explaining trade-offs when network partitions force a design decision",
      "Evaluating whether to sacrifice consistency for availability",
    ],
  },
  "kafka": {
    term: "Kafka",
    eli5: "A durable, ordered message log that many consumers can read independently.",
    definition:
      "A distributed event-streaming platform that stores ordered, durable logs of messages. Consumers read at their own pace without removing messages from the log.",
    relevance:
      "Used when you need high-throughput, durable message delivery with replay capability: event sourcing, analytics pipelines, and cross-service communication at scale.",
    analogy:
      "Like a newspaper archive: everyone can read back through old editions at their own pace, and nothing gets thrown away.",
    category: "component",
    whenToUse: [
      "You need durable, replayable event streams at high throughput",
      "Multiple downstream services must consume the same event stream independently",
      "You want event sourcing or a complete audit log of all changes",
      "Processing order matters within a partition",
    ],
  },
  "sqs": {
    term: "SQS (Simple Queue Service)",
    eli5: "Amazon's managed queue service: produce messages, let workers pull and process them.",
    definition:
      "Amazon's managed message queue that delivers messages at-least-once to consumers, handling infrastructure, scaling, and durability automatically.",
    relevance:
      "A common choice for decoupling microservices on AWS. Fully managed means no server maintenance, but less control over ordering and replay compared to Kafka.",
    category: "component",
    whenToUse: [
      "Decoupling AWS microservices without managing your own queue infrastructure",
      "You need at-least-once delivery with automatic dead-letter queue support",
      "Simple job queues where message ordering is not critical",
    ],
  },
  "redis": {
    term: "Redis",
    eli5: "An in-memory data store that is extremely fast for caches, counters, and sessions.",
    definition:
      "An in-memory data store used as a cache, message broker, or lightweight database. Extremely fast because data lives in RAM rather than on disk.",
    relevance:
      "The go-to choice for caching layers, session stores, and rate-limiting counters in production. The trade-off is memory cost and limited durability.",
    category: "component",
    whenToUse: [
      "Implementing a caching layer for frequently-read, slow-to-compute data",
      "Storing session tokens or rate-limit counters with TTL expiry",
      "Pub/sub or lightweight queuing needs alongside your caching layer",
    ],
  },
  "message broker": {
    term: "Message Broker",
    eli5: "Middleware that routes messages between services so they don't talk directly.",
    definition:
      "Infrastructure that routes messages between producers and consumers: handling delivery, ordering, and persistence so applications don't have to.",
    relevance:
      "The backbone of event-driven architectures. Examples include Kafka, RabbitMQ, and SQS. Choosing the right broker depends on your ordering and durability needs.",
    category: "component",
    whenToUse: [
      "Services need to communicate without knowing each other's location or availability",
      "You need durable, ordered, or guaranteed message delivery",
      "Building event-driven architectures with multiple publishers and subscribers",
    ],
  },
  "at-least-once delivery": {
    term: "At-Least-Once Delivery",
    eli5: "Every message arrives at least once, but sometimes twice, so handle that.",
    definition:
      "A messaging guarantee where every message is delivered to the consumer at least one time: possibly more in edge cases (retries, network issues).",
    relevance:
      "The most common delivery mode. Requires your consumers to be idempotent, since they may process the same message twice.",
    category: "concept",
    whenToUse: [
      "Your consumers are idempotent and can safely handle duplicates",
      "Message loss is unacceptable and occasional duplicates are tolerable",
      "Using standard message queues like SQS or Kafka",
    ],
  },
  "exactly-once delivery": {
    term: "Exactly-Once Delivery",
    eli5: "Every message arrives exactly one time: no duplicates, no losses.",
    definition:
      "A messaging guarantee where every message is processed exactly one time: no duplicates, no losses. Extremely hard to achieve in distributed systems.",
    relevance:
      "Often approximated rather than truly achieved. Systems that claim exactly-once usually combine at-least-once delivery with idempotent processing.",
    category: "concept",
    whenToUse: [
      "Payment processing or inventory updates where duplicates cause real harm",
      "You need transactional guarantees spanning your messaging system",
      "When the complexity cost is worth the correctness guarantee",
    ],
  },
  "event sourcing": {
    term: "Event Sourcing",
    eli5: "Store every change as an event log, then rebuild state by replaying those events.",
    definition:
      "Storing every state change as an immutable event in an append-only log, then deriving current state by replaying those events.",
    relevance:
      "Provides a complete audit trail and allows replaying history to rebuild state or derive new views. The trade-off is complexity and storage cost.",
    category: "pattern",
    whenToUse: [
      "You need a complete audit trail of all state changes",
      "Rebuilding or migrating data by replaying history to a new model",
      "Multiple services need derived views of the same underlying events",
    ],
  },
  "pub/sub": {
    term: "Pub/Sub (Publish-Subscribe)",
    eli5: "Publishers broadcast events; subscribers listen for only the events they care about.",
    definition:
      "A messaging pattern where publishers emit events without knowing who receives them, and subscribers listen for events they care about without knowing who sent them.",
    relevance:
      "Enables loose coupling between services. Adding a new subscriber doesn't require changing the publisher: they're completely independent.",
    category: "pattern",
    whenToUse: [
      "Services need to react to events without being directly called",
      "Adding new consumers without changing the publisher",
      "Building notification pipelines or event-driven microservices",
    ],
  },
  "durable queue": {
    term: "Durable Queue",
    eli5: "A queue that writes messages to disk so they survive crashes and restarts.",
    definition:
      "A queue that persists messages to disk so they survive crashes and restarts: messages are not lost even if the broker goes down.",
    relevance:
      "Critical for production systems where message loss is unacceptable. Kafka and SQS provide durability by default; in-memory queues do not.",
    category: "component",
    whenToUse: [
      "Messages cannot be lost if the broker goes down",
      "Processing is critical enough that crashes must not cause gaps",
      "You need guaranteed delivery semantics from your queue layer",
    ],
  },
  "tcp": {
    term: "TCP (Transmission Control Protocol)",
    eli5: "The reliable internet delivery protocol that guarantees packets arrive in order.",
    definition:
      "A reliable network protocol that guarantees data arrives in order and without loss, using acknowledgements and retransmission.",
    relevance:
      "The foundation of HTTP, database connections, and most service-to-service communication. Reliability comes at the cost of extra round trips for connection setup.",
    category: "concept",
    whenToUse: [
      "Any application where data integrity and ordering are required",
      "Database connections, HTTP, and most service-to-service calls use this by default",
      "When you need error recovery and retransmission handled automatically",
    ],
  },
  "tls": {
    term: "TLS (Transport Layer Security)",
    eli5: "Encryption for data in transit so nobody can eavesdrop on your network calls.",
    definition:
      "A cryptographic protocol that encrypts data in transit between two endpoints, preventing eavesdropping and tampering.",
    relevance:
      "Required for any production system handling sensitive data. Adds latency (extra handshake round trips) but is non-negotiable for security.",
    category: "concept",
    whenToUse: [
      "Any production service handling user data or credentials",
      "Service-to-service communication over untrusted networks",
      "Compliance requirements (GDPR, PCI-DSS) mandate encrypted transit",
    ],
  },
  "dns": {
    term: "DNS (Domain Name System)",
    eli5: "The internet's phone book: turns 'api.myapp.com' into an IP address.",
    definition:
      "The system that translates human-readable domain names (like google.com) into IP addresses that machines can route to.",
    relevance:
      "The first hop of almost every request. DNS failures or slow lookups can bring down an entire application even when all servers are healthy.",
    category: "concept",
    whenToUse: [
      "Every service accessed by name needs this configured",
      "Service discovery in Kubernetes or cloud environments relies on DNS",
      "Using DNS-based load balancing or blue-green traffic routing",
    ],
  },
  "round trip": {
    term: "Round Trip",
    eli5: "The time for a message to travel to a server and for the reply to come back.",
    definition:
      "A complete request-response cycle between two endpoints: the time for a message to travel to the destination and for a reply to come back.",
    relevance:
      "Each round trip adds latency. Reducing the number of round trips (batching, caching, persistent connections) is a key performance optimization.",
    category: "concept",
    whenToUse: [
      "Counting network hops to understand request latency budgets",
      "Deciding whether to batch requests to reduce total round trips",
      "Evaluating whether persistent connections save meaningful latency",
    ],
  },
  "garbage collection": {
    term: "Garbage Collection (GC)",
    eli5: "Automatic cleanup of unused memory, but it can pause your app while running.",
    definition:
      "An automatic memory management process that identifies and frees unused memory. When it runs, it can briefly pause the application.",
    relevance:
      "GC pauses are a common source of p99 latency spikes. Long-lived objects and large heaps make pauses worse. Tuning GC is a common performance task.",
    category: "concept",
    whenToUse: [
      "Profiling p99 latency spikes in JVM or Go services",
      "Tuning heap sizes and GC settings for latency-sensitive workloads",
      "Understanding why throughput drops periodically in your service",
    ],
  },
  "load shedding": {
    term: "Load Shedding",
    eli5: "Deliberately dropping some requests during overload so the rest can succeed.",
    definition:
      "Intentionally dropping excess requests during overload to protect the system's ability to serve the requests it does accept.",
    relevance:
      "Better to serve 80% of requests successfully than to accept everything and fail 100% due to resource exhaustion. Rate limiters and circuit breakers implement this.",
    category: "concept",
    whenToUse: [
      "Your system is near capacity and accepting all requests would fail all of them",
      "You prefer graceful degradation over total failure",
      "Rate limiters and circuit breakers are your implementation tools",
    ],
  },
  "service mesh": {
    term: "Service Mesh",
    eli5: "A sidecar layer that handles networking between services: routing, retries, and TLS.",
    definition:
      "An infrastructure layer that handles service-to-service communication (routing, load balancing, encryption, and observability) without changing application code.",
    relevance:
      "Offloads networking concerns to sidecar proxies so developers focus on business logic. Adds operational complexity but provides consistent cross-cutting behaviour.",
    category: "component",
    whenToUse: [
      "You have many microservices and want consistent network policy without code changes",
      "You need detailed cross-service observability and distributed tracing",
      "Enforcing mutual TLS between all services automatically",
    ],
  },
  "observability": {
    term: "Observability",
    eli5: "Being able to look inside your running system and understand what is happening.",
    definition:
      "The ability to understand a system's internal state from its external outputs: logs, metrics, and traces collected from running services.",
    relevance:
      "You can't fix what you can't see. Observability tells you what's broken, where, and why. Without it, debugging distributed systems is guesswork.",
    category: "concept",
    whenToUse: [
      "Debugging incidents in production where you cannot attach a debugger",
      "Correlating metrics, logs, and traces to understand a regression",
      "Proving your system meets its SLAs with data, not guesswork",
    ],
  },
  "blue-green deployment": {
    term: "Blue-Green Deployment",
    eli5: "Deploy to a second identical environment, then flip all traffic to it instantly.",
    definition:
      "A release strategy with two identical environments (blue and green). New code deploys to the idle one, then traffic switches over instantly.",
    relevance:
      "Enables zero-downtime deployments with instant rollback: if the new version has issues, switch traffic back to the old environment immediately.",
    category: "pattern",
    whenToUse: [
      "You need zero-downtime deployments with an instant rollback option",
      "The new version must be fully deployed before any traffic hits it",
      "Deployment risk is high enough to keep the old version running in parallel",
    ],
  },
  "canary deployment": {
    term: "Canary Deployment",
    eli5: "Send 5% of traffic to the new version first and watch for problems before going all-in.",
    definition:
      "Rolling out a new version to a small percentage of traffic first, monitoring for issues before gradually expanding to all users.",
    relevance:
      "Limits blast radius. If the new version has a bug, only a small fraction of users are affected, and you can roll back before wider impact.",
    category: "pattern",
    whenToUse: [
      "You want to limit blast radius of a bad deploy to a small user percentage",
      "You need real production traffic to validate the new version",
      "Gradual rollouts with automated rollback based on error rate thresholds",
    ],
  },
};

/**
 * Build a lookup-friendly list of patterns sorted by length (longest first)
 * so that multi-word terms like "load balancer" match before "load".
 */
export const GLOSSARY_PATTERNS: { key: string; regex: RegExp }[] = Object.keys(GLOSSARY)
  .sort((a, b) => b.length - a.length)
  .map((key) => ({
    key,
    regex: new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "gi"),
  }));
