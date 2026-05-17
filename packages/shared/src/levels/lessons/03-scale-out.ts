import type { Lesson } from "../../types/level";

export const LESSON_03_SCALE_OUT: Lesson = {
  tagline: "When one server isn't enough, add more — and a load balancer to spread traffic.",
  sections: [
    {
      heading: "When one server isn't enough",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "client", eli5: "The program (browser, app) that sends requests to a server." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "request", eli5: "A message asking a server to do something or return data." },
          ],
        },
        {
          type: "p",
          text: "Your server has a capacity ceiling. When requests pile in faster than it can process them, the excess gets dropped and users see errors. The obvious fix is to upgrade to a bigger, more powerful machine — more CPU, more RAM. But that only gets you so far, costs a lot, and leaves you with one machine that, if it fails, takes everything down with it.",
        },
        {
          type: "p",
          text: "The better answer is to add more machines of the same size and split the work between them. This is horizontal scaling. It has no hard ceiling, and if one server goes away the others keep running. The catch is you need something in front to decide which server gets each incoming request.",
        },
      ],
    },
    {
      heading: "Load balancers",
      blocks: [
        {
          type: "p",
          text: "A load balancer is the traffic cop that stands in front of your servers. Think of the maître d' at a busy restaurant: every diner gets routed to an available table rather than crowding the same one. Every client request arrives at the load balancer, and it forwards it to one of the backend servers — round-robin by default, but it can also choose the server with the fewest in-flight requests.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Effective capacity",
          text: "With N identical servers behind a load balancer, your steady-state capacity is roughly N × per-server capacity. The LB itself has very high capacity (~500) and adds minimal latency (~1 tick), so it is almost never the bottleneck — it just distributes work.",
        },
      ],
    },
  ],
  cheatsheet: [
    "More traffic → more servers behind a load balancer.",
    "An LB has ~500 capacity and ~1 tick latency — it's almost never your bottleneck.",
  ],
};
