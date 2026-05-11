/**
 * Glossary of system design terms — displayed as interactive inline tooltips
 * throughout lesson content. Each entry provides a beginner-friendly definition,
 * why it matters, and an optional real-world analogy.
 */

export interface GlossaryEntry {
  /** The canonical display form of the term. */
  term: string;
  /** Beginner-friendly 1–2 sentence definition. */
  definition: string;
  /** Why this matters in production systems (1 sentence). */
  relevance: string;
  /** Optional real-world analogy to build intuition. */
  analogy?: string;
}

/**
 * All glossary entries. The key is the lowercase canonical form used for
 * matching. Matching is case-insensitive and supports common variations
 * (e.g., "load balancer" also matches "load balancers").
 */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  stateless: {
    term: "Stateless",
    definition:
      "A stateless service doesn't remember previous requests. Every request contains all the information needed to process it independently.",
    relevance:
      "Makes horizontal scaling trivial — any server can handle any request, so you just add more servers behind a load balancer.",
    analogy:
      "Like a vending machine: it doesn't know who you are or what you bought last time. You put in money and make a selection, and it dispenses.",
  },
  stateful: {
    term: "Stateful",
    definition:
      "A stateful service remembers information between requests — session data, in-progress transactions, or cached computation.",
    relevance:
      "Harder to scale because requests for the same state must route to the same instance, but sometimes necessary for performance or correctness.",
  },
  idempotent: {
    term: "Idempotent",
    definition:
      "An operation is idempotent if performing it multiple times produces the same result as performing it once.",
    relevance:
      "Critical for retry safety. If a network hiccup causes a duplicate request, an idempotent endpoint won't accidentally charge a user twice.",
    analogy:
      "Like pressing an elevator button — pressing it five times doesn't call five elevators.",
  },
  idempotency: {
    term: "Idempotency",
    definition:
      "The property of an operation where repeating it produces the same outcome as doing it once.",
    relevance:
      "Essential for safe retries in distributed systems. Network failures are inevitable; idempotent operations make retries harmless.",
    analogy:
      "Setting a thermostat to 72°F — doing it ten times still results in 72°F.",
  },
  "load balancer": {
    term: "Load Balancer",
    definition:
      "A component that distributes incoming requests across multiple backend servers, preventing any single server from becoming overwhelmed.",
    relevance:
      "The gateway to horizontal scaling. Without one, adding servers doesn't help because clients only know about one endpoint.",
    analogy:
      "Like a restaurant host who seats guests across all available tables instead of sending everyone to one waiter.",
  },
  "round-robin": {
    term: "Round-Robin",
    definition:
      "A distribution strategy that sends each new request to the next server in a rotating sequence: 1, 2, 3, 1, 2, 3...",
    relevance:
      "The simplest load-balancing policy. Works well when all servers are identical and requests take roughly the same time.",
  },
  sharding: {
    term: "Sharding",
    definition:
      "Splitting data across multiple databases by a key (like user ID), so each database holds only a slice of the total data.",
    relevance:
      "The primary way to scale write throughput beyond what a single database can handle. Aggregate capacity grows linearly with shard count.",
    analogy:
      "Like splitting a phone book into volumes A–M and N–Z — each volume is smaller and faster to search.",
  },
  shard: {
    term: "Shard",
    definition:
      "One partition in a sharded system — a database instance responsible for a subset of the total data.",
    relevance:
      "Each shard operates independently. If one shard is slow or down, only the users whose data lives on that shard are affected.",
  },
  "shard key": {
    term: "Shard Key",
    definition:
      "The field used to determine which shard a piece of data belongs to (e.g., hash of user_id modulo number of shards).",
    relevance:
      "Choosing a good shard key is one of the most consequential decisions in system design. Bad keys create hot spots.",
  },
  replication: {
    term: "Replication",
    definition:
      "Keeping copies of the same data on multiple nodes so that if one fails, others can continue serving requests.",
    relevance:
      "The primary mechanism for high availability. Without replicas, every database is one hardware failure away from downtime.",
    analogy:
      "Like keeping backup copies of important files on multiple USB drives.",
  },
  replica: {
    term: "Replica",
    definition:
      "A copy of a database that receives replicated writes from the primary and serves read traffic independently.",
    relevance:
      "Replicas multiply your read capacity and provide failover. The trade-off is replication lag — replicas may briefly show stale data.",
  },
  primary: {
    term: "Primary",
    definition:
      "The authoritative database instance in a replication set that accepts all write operations.",
    relevance:
      "All writes flow through the primary, making it a potential bottleneck and single point of failure until promotion is set up.",
  },
  "eventual consistency": {
    term: "Eventual Consistency",
    definition:
      "A consistency model where all replicas will converge to the same value eventually, but reads may temporarily return stale data.",
    relevance:
      "The trade-off you accept for higher availability and lower latency. Most social media, analytics, and notification systems are eventually consistent.",
    analogy:
      "Like updating your profile picture — friends on different servers might see the old one for a few seconds before it propagates everywhere.",
  },
  "strong consistency": {
    term: "Strong Consistency",
    definition:
      "A guarantee that after a write completes, all subsequent reads will return the updated value, no matter which replica they hit.",
    relevance:
      "Required for financial transactions and anything where reading stale data causes real harm. Costs more latency than eventual consistency.",
  },
  latency: {
    term: "Latency",
    definition:
      "The time between sending a request and receiving a response — the end-to-end delay a user actually experiences.",
    relevance:
      "The metric users feel most directly. Every additional network hop, queue wait, or computation adds latency.",
    analogy:
      "The time between clicking a button and seeing the result. Lower is better.",
  },
  throughput: {
    term: "Throughput",
    definition:
      "The number of requests a system can process per unit of time — its sustained capacity under load.",
    relevance:
      "Determines how many users you can serve simultaneously. Scale throughput by adding capacity at your bottleneck.",
  },
  "p95 latency": {
    term: "p95 Latency",
    definition:
      "The latency at the 95th percentile — 95% of requests are faster than this value. It captures the experience of your slowest typical users.",
    relevance:
      "More meaningful than average latency. A low average can hide a terrible experience for 1 in 20 users.",
    analogy:
      "Like saying \"95% of pizza deliveries arrive within 30 minutes\" — the p95 is 30 minutes.",
  },
  p99: {
    term: "p99",
    definition:
      "The 99th percentile latency — only 1% of requests are slower than this value.",
    relevance:
      "Used for strict SLAs. Improving p99 often requires eliminating tail-latency outliers like garbage collection pauses or cold cache misses.",
  },
  bottleneck: {
    term: "Bottleneck",
    definition:
      "The single component in a system that limits overall throughput — the constraint everything else is waiting on.",
    relevance:
      "Optimising anything other than the bottleneck is wasted effort. Find it first, fix it, then find the next one.",
    analogy:
      "The narrowest point in a funnel — widening anywhere else doesn't help water flow faster.",
  },
  capacity: {
    term: "Capacity",
    definition:
      "The maximum number of concurrent requests a component can handle before it starts dropping new arrivals.",
    relevance:
      "Every node has a capacity ceiling. When in-flight requests hit that ceiling, the system starts failing — that's when you need to scale.",
  },
  "cache hit": {
    term: "Cache Hit",
    definition:
      "When the requested data is found in the cache and returned immediately without querying the backend.",
    relevance:
      "Cache hits are fast and cheap. A high hit rate means your backend only handles the unique or freshly-changed requests.",
  },
  "cache miss": {
    term: "Cache Miss",
    definition:
      "When the requested data isn't in the cache, requiring a more expensive fetch from the database or origin server.",
    relevance:
      "Misses are expensive because you pay for both the cache lookup and the backend query. A system with a low hit rate may be worse off than no cache at all.",
  },
  "hit rate": {
    term: "Hit Rate",
    definition:
      "The percentage of requests served from cache. A 90% hit rate means only 10% of traffic reaches your backend.",
    relevance:
      "The single most important metric for any caching layer. It directly determines how much load you offload from your origin.",
  },
  "cache-aside": {
    term: "Cache-Aside",
    definition:
      "A caching pattern where the application checks the cache first, queries the database on miss, then stores the result in the cache.",
    relevance:
      "The most common pattern. The application controls what gets cached and when, giving you flexibility at the cost of more code.",
  },
  ttl: {
    term: "TTL (Time to Live)",
    definition:
      "How long a cached value is considered fresh before it expires and the next request triggers a refetch.",
    relevance:
      "Balances freshness vs performance. Short TTLs keep data current but reduce hit rate. Long TTLs maximise caching but risk stale data.",
  },
  queue: {
    term: "Queue",
    definition:
      "A buffer that accepts messages from producers and holds them until consumers are ready to process them, decoupling production rate from consumption rate.",
    relevance:
      "The primary tool for smoothing traffic spikes. Producers don't wait; consumers process at their own pace.",
    analogy:
      "Like a line at a coffee shop — customers arrive in bursts, but the barista serves them one at a time at a steady pace.",
  },
  "dead-letter queue": {
    term: "Dead-Letter Queue (DLQ)",
    definition:
      "A side-channel queue where messages that can't be processed (overflows, poison pills, repeated failures) are stored for later inspection.",
    relevance:
      "Prevents silent data loss. Instead of dropping messages forever, you can inspect why they failed and replay them when the issue is fixed.",
  },
  "token bucket": {
    term: "Token Bucket",
    definition:
      "A rate-limiting algorithm where tokens refill at a fixed rate and each request consumes one. Empty bucket = request rejected.",
    relevance:
      "The most common rate-limiting implementation. The refill rate sets your sustained limit; the bucket size sets your burst tolerance.",
    analogy:
      "Like a parking meter that adds time at a fixed rate — if you've used it all up, you can't park until more accrues.",
  },
  "rate limiting": {
    term: "Rate Limiting",
    definition:
      "Capping how many requests per unit of time a client or service can make, protecting downstream systems from overload.",
    relevance:
      "Essential for APIs exposed to the internet. Without it, one misbehaving client can exhaust resources for everyone.",
  },
  "circuit breaker": {
    term: "Circuit Breaker",
    definition:
      "A pattern that monitors downstream failures and trips open (rejecting requests immediately) when the error rate exceeds a threshold, preventing cascading failures.",
    relevance:
      "Protects the rest of your system when one dependency is down. Callers get fast errors instead of waiting for timeouts.",
    analogy:
      "Like an electrical circuit breaker — it cuts power to prevent a short circuit from starting a fire.",
  },
  "cascading failure": {
    term: "Cascading Failure",
    definition:
      "When one failing component causes its callers to back up and fail, which causes their callers to fail, propagating outages through the entire system.",
    relevance:
      "The most dangerous failure mode in microservices. Circuit breakers, timeouts, and bulkheads are your defences.",
  },
  cdn: {
    term: "CDN (Content Delivery Network)",
    definition:
      "A network of geographically distributed edge servers that cache and serve content close to users, reducing latency and origin load.",
    relevance:
      "For read-heavy traffic, a CDN can absorb 90%+ of requests before they ever reach your origin servers.",
  },
  "horizontal scaling": {
    term: "Horizontal Scaling",
    definition:
      "Adding more machines of the same size to handle increased load, rather than upgrading a single machine.",
    relevance:
      "The foundation of modern cloud architectures. Scales further than vertical, survives individual failures, and is the only path to practically unlimited capacity.",
  },
  "vertical scaling": {
    term: "Vertical Scaling",
    definition:
      "Upgrading a single machine with more CPU, memory, or storage to handle increased load.",
    relevance:
      "Simple but limited — there's a maximum machine size, it's expensive, and it creates a single point of failure.",
    analogy: "Buying a bigger truck instead of adding more trucks to your fleet.",
  },
  "single point of failure": {
    term: "Single Point of Failure",
    definition:
      "Any component whose failure brings down the entire system — a non-redundant link in the chain.",
    relevance:
      "Identifying and eliminating single points of failure is one of the first steps in making a system reliable.",
  },
  failover: {
    term: "Failover",
    definition:
      "Automatically switching to a backup component when the primary one fails, maintaining service continuity.",
    relevance:
      "The mechanism that makes replication useful for availability. Without failover, replicas are just expensive mirrors.",
  },
  "consistent hashing": {
    term: "Consistent Hashing",
    definition:
      "A hashing technique where adding or removing nodes only redistributes a small fraction of keys, unlike modular hashing which remaps almost everything.",
    relevance:
      "Makes adding shards or cache nodes feasible in production without causing a thundering herd of cache misses.",
  },
  "hot key": {
    term: "Hot Key",
    definition:
      "A shard key or cache key that receives disproportionately more traffic than others, creating an imbalanced load on one node.",
    relevance:
      "Even a perfectly sharded system can have bottlenecks if one key (like a celebrity's user ID) dominates traffic.",
  },
  "in-flight": {
    term: "In-Flight",
    definition:
      "Requests that have been sent but haven't received a response yet — they're consuming resources on the server while waiting to complete.",
    relevance:
      "The number of in-flight requests determines whether you're within a component's capacity or about to hit overload.",
  },
  backpressure: {
    term: "Backpressure",
    definition:
      "A mechanism where a slow consumer signals upstream to slow down, preventing unbounded queue growth and resource exhaustion.",
    relevance:
      "Without backpressure, fast producers can overwhelm slow consumers until memory runs out. Good systems propagate pressure signals upstream.",
  },
  "write-ahead log": {
    term: "Write-Ahead Log (WAL)",
    definition:
      "A technique where changes are written to an append-only log before being applied, providing crash recovery by replaying the log.",
    relevance:
      "How databases guarantee durability. If the server crashes mid-transaction, the WAL lets it recover to a consistent state on restart.",
  },
  "fan-out": {
    term: "Fan-Out",
    definition:
      "When a single request triggers multiple downstream requests — one input becomes many outputs.",
    relevance:
      "Common in notification systems and aggregation. Each level of fan-out multiplies load, so deep fan-out can be surprisingly expensive.",
  },
  cache: {
    term: "Cache",
    definition:
      "A fast, temporary storage layer that keeps copies of frequently accessed data so future requests can be served without hitting the slower backend.",
    relevance:
      "Dramatically reduces latency and backend load for read-heavy workloads. The trade-off is managing staleness — cached data may be out of date.",
    analogy:
      "Like keeping your most-used tools on your desk instead of walking to the supply closet every time.",
  },
  durability: {
    term: "Durability",
    definition:
      "The guarantee that once data is written and acknowledged, it won't be lost — even if the server crashes immediately after.",
    relevance:
      "Databases achieve durability through write-ahead logs and disk flushes. Sacrificing durability (e.g., async writes) trades safety for speed.",
  },
  acknowledge: {
    term: "Acknowledge (ACK)",
    definition:
      "A confirmation message sent back to the sender indicating that a request or message was received and accepted for processing.",
    relevance:
      "Defines the contract between sender and receiver. A fast ack (before processing) means speed but less safety; a late ack (after processing) means safety but more latency.",
  },
  producer: {
    term: "Producer",
    definition:
      "A component that generates messages or work items and sends them into a queue or message broker for later processing.",
    relevance:
      "In async architectures, producers fire and forget — they don't wait for the work to actually complete, only for the queue to accept it.",
  },
  consumer: {
    term: "Consumer",
    definition:
      "A component that pulls messages from a queue and processes them — the worker that actually does the job the producer requested.",
    relevance:
      "Consumers set the actual processing rate. If consumers are slower than producers, queues grow. Scale consumers to match sustained production rate.",
  },
  "read replica": {
    term: "Read Replica",
    definition:
      "A copy of the primary database that only serves read queries, receiving writes asynchronously via replication from the primary.",
    relevance:
      "Multiplies read throughput without affecting write performance. The trade-off is a small replication lag where reads may be slightly stale.",
  },
  "write-through": {
    term: "Write-Through",
    definition:
      "A caching strategy where every write updates both the cache and the database simultaneously before acknowledging success.",
    relevance:
      "Guarantees the cache is always consistent with the database, at the cost of slower writes since both stores must confirm.",
  },
  "write-behind": {
    term: "Write-Behind",
    definition:
      "A caching strategy where writes go to the cache first, then asynchronously flush to the database in the background.",
    relevance:
      "Extremely fast writes, but risks data loss if the cache crashes before flushing. Used when speed matters more than immediate durability.",
  },
  "write-around": {
    term: "Write-Around",
    definition:
      "A caching strategy where writes go directly to the database, bypassing the cache entirely. The cache fills on subsequent reads.",
    relevance:
      "Avoids polluting the cache with data that may never be read again. Good for write-heavy workloads with low read repetition.",
  },
  timeout: {
    term: "Timeout",
    definition:
      "A maximum time limit after which a waiting operation is cancelled and treated as a failure, freeing up resources.",
    relevance:
      "Without timeouts, slow or dead dependencies hold connections open indefinitely, eventually exhausting your system's resources.",
  },
  retry: {
    term: "Retry",
    definition:
      "Automatically re-attempting a failed operation, usually with a delay between attempts, hoping the transient issue has resolved.",
    relevance:
      "Essential for handling temporary failures (network blips, brief overloads). Must be combined with idempotency to be safe — otherwise retries can cause duplicate effects.",
  },
  "exponential backoff": {
    term: "Exponential Backoff",
    definition:
      "A retry strategy where the wait between attempts doubles each time (e.g., 1s, 2s, 4s, 8s), reducing pressure on an already-struggling system.",
    relevance:
      "Prevents retry storms — if many clients retry immediately and simultaneously, they can overwhelm a recovering system all over again.",
  },
  "connection pool": {
    term: "Connection Pool",
    definition:
      "A set of pre-established, reusable connections to a database or service, avoiding the overhead of creating a new connection for every request.",
    relevance:
      "Creating connections is expensive (TCP handshake, TLS, auth). Pools amortize that cost across many requests, but pool exhaustion can become a bottleneck.",
  },
  partition: {
    term: "Partition",
    definition:
      "A subset of data or infrastructure separated from others — either intentionally (sharding) or by failure (network partition).",
    relevance:
      "In distributed systems, network partitions are inevitable. The CAP theorem says you must choose between consistency and availability when one occurs.",
  },
  "network partition": {
    term: "Network Partition",
    definition:
      "When a network failure splits a system into groups of nodes that can talk to each other but not across groups.",
    relevance:
      "Forces a design choice: do you reject requests (stay consistent) or allow stale reads (stay available)? This is the core trade-off of the CAP theorem.",
  },
  availability: {
    term: "Availability",
    definition:
      "The percentage of time a system is operational and responding to requests — often expressed as \"nines\" (99.9% = three nines).",
    relevance:
      "Every nine you add requires exponentially more engineering effort. Going from 99.9% to 99.99% means cutting downtime from ~8 hours/year to ~52 minutes/year.",
  },
  sla: {
    term: "SLA (Service Level Agreement)",
    definition:
      "A formal commitment defining the minimum acceptable performance (uptime, latency, error rate) that a service promises to deliver.",
    relevance:
      "SLAs set the bar for your architecture decisions. A 99.99% uptime SLA requires redundancy, failover, and monitoring that a 99% SLA doesn't.",
  },
  "service discovery": {
    term: "Service Discovery",
    definition:
      "A mechanism that lets services find each other's network addresses dynamically, without hardcoding IPs or hostnames.",
    relevance:
      "In cloud environments where instances spin up and down constantly, static addresses don't work. Service discovery makes auto-scaling possible.",
  },
  orchestration: {
    term: "Orchestration",
    definition:
      "A central coordinator that directs the flow of work across multiple services, telling each one what to do and when.",
    relevance:
      "Simple to reason about and debug, but the orchestrator becomes a single point of failure and a potential bottleneck.",
  },
  choreography: {
    term: "Choreography",
    definition:
      "A decentralized approach where each service reacts to events independently, with no central coordinator directing the workflow.",
    relevance:
      "More resilient than orchestration (no single coordinator to fail) but harder to trace and debug since logic is spread across many services.",
  },
  "eventual durability": {
    term: "Eventual Durability",
    definition:
      "A model where writes are acknowledged before being persisted to durable storage — they'll be saved eventually, but not instantly.",
    relevance:
      "Used in async write patterns. The trade-off is clear: faster acknowledgement for the caller, but a window where data could be lost if the system crashes.",
  },
  decoupling: {
    term: "Decoupling",
    definition:
      "Designing components so they don't depend directly on each other's availability or timing — they communicate through intermediaries like queues or events.",
    relevance:
      "Decoupled systems are more resilient: if one component is slow or down, the others keep working. The trade-off is added complexity and eventual consistency.",
    analogy:
      "Like email vs phone calls — with email, both parties don't need to be available at the same time.",
  },
  "thundering herd": {
    term: "Thundering Herd",
    definition:
      "When many clients simultaneously retry or re-request after a failure or cache expiration, overwhelming the backend with a sudden spike.",
    relevance:
      "A common cause of outages during recovery. Mitigations include jittered retries, request coalescing, and staggered cache TTLs.",
  },
  "poison pill": {
    term: "Poison Pill",
    definition:
      "A malformed message in a queue that crashes the consumer every time it's processed, blocking all subsequent messages.",
    relevance:
      "Without dead-letter queues, a single poison pill can halt an entire processing pipeline. DLQs isolate bad messages so the rest keep flowing.",
  },
  "cold start": {
    term: "Cold Start",
    definition:
      "The initial delay when a service or cache is empty and must build up its state from scratch — no cached data, no warm connections.",
    relevance:
      "Causes latency spikes after deployments or scaling events. Pre-warming caches and connection pools mitigates the impact.",
  },
  "head-of-line blocking": {
    term: "Head-of-Line Blocking",
    definition:
      "When a slow or stuck request at the front of a queue prevents all requests behind it from being processed.",
    relevance:
      "Can turn one slow request into a system-wide outage. Solved by parallel processing, multiple queues, or timeouts that evict stuck items.",
  },
  microservice: {
    term: "Microservice",
    definition:
      "An independently deployable service that owns a single business capability, communicating with other services over the network.",
    relevance:
      "Enables teams to deploy independently and scale individual components, but adds operational complexity (networking, monitoring, consistency).",
  },
  monolith: {
    term: "Monolith",
    definition:
      "A single deployable unit containing all of an application's functionality — one codebase, one process, one deploy.",
    relevance:
      "Simpler to develop and debug initially, but becomes harder to scale and deploy independently as the team and system grow.",
  },
  "read-heavy": {
    term: "Read-Heavy",
    definition:
      "A workload where reads vastly outnumber writes — typically 90%+ of traffic is reading data rather than creating or updating it.",
    relevance:
      "Read-heavy workloads benefit enormously from caching and read replicas. Most web traffic (product pages, feeds, search) is read-heavy.",
  },
  "write-heavy": {
    term: "Write-Heavy",
    definition:
      "A workload where writes dominate — logging, analytics ingestion, IoT sensor data, or high-frequency transactions.",
    relevance:
      "Write-heavy workloads need queues for burst absorption and sharding for throughput. Caching helps less since data changes constantly.",
  },
  "fire-and-forget": {
    term: "Fire-and-Forget",
    definition:
      "Sending a message or request without waiting for confirmation that it was processed — just trusting it will eventually be handled.",
    relevance:
      "Maximizes speed for the sender but sacrifices delivery guarantees. Appropriate for analytics events, logs, and non-critical notifications.",
  },
  middleware: {
    term: "Middleware",
    definition:
      "Software that sits between components, adding cross-cutting functionality like authentication, logging, rate limiting, or request transformation.",
    relevance:
      "Keeps business logic clean by separating infrastructure concerns into reusable layers that all requests pass through.",
  },
  "health check": {
    term: "Health Check",
    definition:
      "An endpoint that reports whether a service is alive and ready to handle traffic — used by load balancers and orchestrators to route requests away from unhealthy instances.",
    relevance:
      "Without health checks, load balancers send traffic to dead instances. Health checks enable automatic recovery by routing around failures.",
  },
  "cap theorem": {
    term: "CAP Theorem",
    definition:
      "A principle stating that a distributed system can provide at most two of three guarantees simultaneously: Consistency, Availability, and Partition tolerance.",
    relevance:
      "Since network partitions are unavoidable, the real choice is between consistency (reject requests during partitions) and availability (serve potentially stale data).",
  },
  kafka: {
    term: "Kafka",
    definition:
      "A distributed event-streaming platform that stores ordered, durable logs of messages. Consumers read at their own pace without removing messages from the log.",
    relevance:
      "Used when you need high-throughput, durable message delivery with replay capability — event sourcing, analytics pipelines, and cross-service communication at scale.",
    analogy:
      "Like a newspaper archive: everyone can read back through old editions at their own pace, and nothing gets thrown away.",
  },
  sqs: {
    term: "SQS (Simple Queue Service)",
    definition:
      "Amazon's managed message queue that delivers messages at-least-once to consumers, handling infrastructure, scaling, and durability automatically.",
    relevance:
      "A common choice for decoupling microservices on AWS. Fully managed means no server maintenance, but less control over ordering and replay compared to Kafka.",
  },
  redis: {
    term: "Redis",
    definition:
      "An in-memory data store used as a cache, message broker, or lightweight database. Extremely fast because data lives in RAM rather than on disk.",
    relevance:
      "The go-to choice for caching layers, session stores, and rate-limiting counters in production. The trade-off is memory cost and limited durability.",
  },
  "message broker": {
    term: "Message Broker",
    definition:
      "Infrastructure that routes messages between producers and consumers — handling delivery, ordering, and persistence so applications don't have to.",
    relevance:
      "The backbone of event-driven architectures. Examples include Kafka, RabbitMQ, and SQS. Choosing the right broker depends on your ordering and durability needs.",
  },
  "at-least-once delivery": {
    term: "At-Least-Once Delivery",
    definition:
      "A messaging guarantee where every message is delivered to the consumer at least one time — possibly more in edge cases (retries, network issues).",
    relevance:
      "The most common delivery mode. Requires your consumers to be idempotent, since they may process the same message twice.",
  },
  "exactly-once delivery": {
    term: "Exactly-Once Delivery",
    definition:
      "A messaging guarantee where every message is processed exactly one time — no duplicates, no losses. Extremely hard to achieve in distributed systems.",
    relevance:
      "Often approximated rather than truly achieved. Systems that claim exactly-once usually combine at-least-once delivery with idempotent processing.",
  },
  "event sourcing": {
    term: "Event Sourcing",
    definition:
      "Storing every state change as an immutable event in an append-only log, then deriving current state by replaying those events.",
    relevance:
      "Provides a complete audit trail and allows replaying history to rebuild state or derive new views. The trade-off is complexity and storage cost.",
  },
  "pub/sub": {
    term: "Pub/Sub (Publish-Subscribe)",
    definition:
      "A messaging pattern where publishers emit events without knowing who receives them, and subscribers listen for events they care about without knowing who sent them.",
    relevance:
      "Enables loose coupling between services. Adding a new subscriber doesn't require changing the publisher — they're completely independent.",
  },
  "durable queue": {
    term: "Durable Queue",
    definition:
      "A queue that persists messages to disk so they survive crashes and restarts — messages are not lost even if the broker goes down.",
    relevance:
      "Critical for production systems where message loss is unacceptable. Kafka and SQS provide durability by default; in-memory queues do not.",
  },
  tcp: {
    term: "TCP (Transmission Control Protocol)",
    definition:
      "A reliable network protocol that guarantees data arrives in order and without loss, using acknowledgements and retransmission.",
    relevance:
      "The foundation of HTTP, database connections, and most service-to-service communication. Reliability comes at the cost of extra round trips for connection setup.",
  },
  tls: {
    term: "TLS (Transport Layer Security)",
    definition:
      "A cryptographic protocol that encrypts data in transit between two endpoints, preventing eavesdropping and tampering.",
    relevance:
      "Required for any production system handling sensitive data. Adds latency (extra handshake round trips) but is non-negotiable for security.",
  },
  "dns": {
    term: "DNS (Domain Name System)",
    definition:
      "The system that translates human-readable domain names (like google.com) into IP addresses that machines can route to.",
    relevance:
      "The first hop of almost every request. DNS failures or slow lookups can bring down an entire application even when all servers are healthy.",
  },
  "round trip": {
    term: "Round Trip",
    definition:
      "A complete request-response cycle between two endpoints — the time for a message to travel to the destination and for a reply to come back.",
    relevance:
      "Each round trip adds latency. Reducing the number of round trips (batching, caching, persistent connections) is a key performance optimization.",
  },
  "garbage collection": {
    term: "Garbage Collection (GC)",
    definition:
      "An automatic memory management process that identifies and frees unused memory. When it runs, it can briefly pause the application.",
    relevance:
      "GC pauses are a common source of p99 latency spikes. Long-lived objects and large heaps make pauses worse. Tuning GC is a common performance task.",
  },
  "load shedding": {
    term: "Load Shedding",
    definition:
      "Intentionally dropping excess requests during overload to protect the system's ability to serve the requests it does accept.",
    relevance:
      "Better to serve 80% of requests successfully than to accept everything and fail 100% due to resource exhaustion. Rate limiters and circuit breakers implement this.",
  },
  "service mesh": {
    term: "Service Mesh",
    definition:
      "An infrastructure layer that handles service-to-service communication — routing, load balancing, encryption, and observability — without changing application code.",
    relevance:
      "Offloads networking concerns to sidecar proxies so developers focus on business logic. Adds operational complexity but provides consistent cross-cutting behaviour.",
  },
  observability: {
    term: "Observability",
    definition:
      "The ability to understand a system's internal state from its external outputs — logs, metrics, and traces collected from running services.",
    relevance:
      "You can't fix what you can't see. Observability tells you what's broken, where, and why. Without it, debugging distributed systems is guesswork.",
  },
  "blue-green deployment": {
    term: "Blue-Green Deployment",
    definition:
      "A release strategy with two identical environments (blue and green). New code deploys to the idle one, then traffic switches over instantly.",
    relevance:
      "Enables zero-downtime deployments with instant rollback — if the new version has issues, switch traffic back to the old environment immediately.",
  },
  "canary deployment": {
    term: "Canary Deployment",
    definition:
      "Rolling out a new version to a small percentage of traffic first, monitoring for issues before gradually expanding to all users.",
    relevance:
      "Limits blast radius. If the new version has a bug, only a small fraction of users are affected, and you can roll back before wider impact.",
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
