import type { Lesson } from "../../types/level";

export const LESSON_02_PERSISTENCE: Lesson = {
  tagline: "Servers handle logic; databases remember.",
  sections: [
    {
      heading: "Why servers need a database",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "client", eli5: "The program (browser, app) that sends requests to a server." },
            { term: "request", eli5: "A message asking a server to do something or return data." },
          ],
        },
        {
          type: "p",
          text: "A server is a stateless machine: it processes each request independently and remembers nothing between calls. That is a feature, not a bug: it means you can run ten identical servers simultaneously and it does not matter which one handles your request. But statelessness also means a server cannot hold onto data. Restart it, and everything it held in memory is gone.",
        },
        {
          type: "p",
          text: "A database is the opposite: stateful by design. It is the permanent record of everything your system knows, from user accounts to transaction histories. Separating compute (the server) from storage (the database) means you can scale each independently: add servers for processing power, scale the database for storage.",
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
          text: "Every node in your architecture has two fundamental numbers: capacity (how many requests can be in-flight at once) and latency (how long each request takes). When in-flight requests exceed a node's capacity, new arrivals are dropped. That is the overload condition you will spend this game learning to design around.",
        },
        {
          type: "definitions",
          items: [
            {
              term: "Server capacity ≈ 80 concurrent",
              description: "Servers process requests quickly but can't hold many at once. They're cheap and you can run lots of them in parallel.",
            },
            {
              term: "Database capacity ≈ 120 concurrent",
              description: "Databases handle more concurrent requests than a single server, but each request takes longer because disk I/O and transactions are expensive.",
            },
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "Spotting a bottleneck",
          text: "Watch for any node where peak in-flight equals its capacity AND new arrivals are being dropped. That's your bottleneck: the constraint limiting the whole system's throughput.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Servers compute; databases persist. Keep them separate so each can scale independently.",
    "The node where in-flight equals capacity with drops occurring is your bottleneck.",
  ],
};
