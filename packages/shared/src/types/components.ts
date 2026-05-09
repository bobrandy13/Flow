/**
 * The kinds of components a player can place on the canvas.
 * Mirrored exactly in the simulation engine semantics (see plan §1.1).
 */
export const COMPONENT_KINDS = [
  "client",
  "server",
  "database",
  "cache",
  "load_balancer",
  "queue",
  "shard",
  "rate_limiter",
  "circuit_breaker",
] as const;

export type ComponentKind = (typeof COMPONENT_KINDS)[number];

/** Fan-out policies a load balancer or shard can use.
 *  - round_robin / random / least_loaded: classic load balancing.
 *  - consistent_hash: deterministic per-request routing — the same requestId
 *    always lands on the same downstream. Used by shards. */
export const FAN_OUT_POLICIES = [
  "round_robin",
  "random",
  "least_loaded",
  "consistent_hash",
] as const;
export type FanOutPolicy = (typeof FAN_OUT_POLICIES)[number];

/**
 * Per-kind defaults. Concrete numbers are tunable; the shape is what matters.
 * - `baseLatency` is in ticks (or ms, interpreted by the engine).
 * - `jitter` is a fraction in [0, 0.5]: actual = base * (1 + uniform(-j, +j)).
 * - `capacity` is the max simultaneous in-flight requests; over-capacity → drop.
 */
export interface ComponentSpec {
  kind: ComponentKind;
  label: string;
  baseLatency: number;
  jitter: number;
  capacity: number;
}

/** Per-node config that the player can edit at runtime. */
export interface LoadBalancerConfig {
  fanOut: FanOutPolicy;
}

/** Discriminated union of node-kind-specific config. Extend as new kinds gain knobs. */
export type NodeConfig =
  | { kind: "load_balancer"; config: LoadBalancerConfig }
  | { kind: "queue"; config: { bufferSize: number } }
  | { kind: "rate_limiter"; config: { tokensPerTick: number; bucketSize: number } }
  | {
      kind: "circuit_breaker";
      config: {
        /** Drop ratio over the recent window above which the breaker opens. */
        failureRateThreshold: number;
        /** Sliding-window length in ticks the breaker uses for the ratio. */
        windowTicks: number;
        /** Ticks the breaker stays open before allowing a half-open probe. */
        cooldownTicks: number;
      };
    };
