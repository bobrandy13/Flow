import type { Lesson } from "../../types/level";

export const LESSON_15_TWO_CONTINENTS: Lesson = {
  tagline: "Light is fast — but not THAT fast. Distance shows up in your p95.",
  sections: [
    {
      heading: "The speed of light tax",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "cdn", eli5: "A network of edge servers that cache content near users." },
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "p95 latency", eli5: "The response time that 95% of requests complete within." },
            { term: "cross-region transit", eli5: "A request travelling between two geographically distant data centres." },
          ],
        },
        {
          type: "p",
          text: "Bits travel through fibre optic cables at roughly 200,000 km/s. London to New York and back is about 11,000 km of cable — that is 55ms of pure physics before your server even begins processing. Add TCP handshakes, TLS negotiation, routing hops, and switch queuing, and a cross-ocean round trip is easily 80–120ms. That is not something you can optimise away with better code.",
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
          text: "The solution to the speed-of-light problem is simple: do not cross the ocean for requests you do not have to. Place a CDN in the same region as your users, and most read traffic terminates locally. Only cache misses pay the cross-region cost, and if your hit rate is high, that is a tiny fraction of total traffic.",
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
          text: "Your clients are in EU-West. Your origin and database are in US-East. The SLA enforces a tight p95 latency constraint. Without an edge CDN in EU-West with a high hit rate, every request pays the Atlantic round-trip and you will fail the SLA.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Users far from your origin? A regional edge cache isn't optional — it's required for p95.",
    "Cross-region hops blow up p95 latency disproportionately. Minimise them.",
  ],
};
