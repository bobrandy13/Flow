import type { Lesson } from "../../types/level";

export const LESSON_01_HELLO_SERVER: Lesson = {
  tagline: "Every system starts the same way — a client asks, a server answers.",
  sections: [
    {
      heading: "The request/response cycle",
      blocks: [
        {
          type: "p",
          text: "A server is just a computer that stays on all day, listening for connections and running code to answer them. Think of it like a restaurant kitchen: orders come in through the pass, the kitchen does the work, and plates go back out. The thing placing the order is the client — a browser, a mobile app, or another backend service.",
        },
        {
          type: "p",
          text: "On the canvas you will see this as a directed edge from a client node to a server node. When you press Run, coloured dots travel the edge in both directions: forward as the request, backward as the response. The time between send and receive is the latency of that request, and while the response is pending the request is in-flight — occupying a slot of the server's capacity.",
        },
      ],
    },
    {
      heading: "Why this matters",
      blocks: [
        {
          type: "p",
          text: "Every pattern you will meet in this game — caches, queues, shards, circuit breakers — is built on top of this simple request/response primitive. Knowing it deeply means knowing where things go wrong: the network can delay or drop a message, the server can be overloaded, or it can simply be turned off. Each failure mode motivates a different architectural pattern in the levels ahead.",
        },
        {
          type: "definitions",
          items: [
            {
              term: "Latency",
              description: "End-to-end time from when the client sends a request to when it receives the response. Every additional hop between client and server adds latency.",
            },
            {
              term: "In-flight requests",
              description: "Requests that have been sent but have not yet received a response. If in-flight count exceeds a server's capacity, new arrivals are dropped.",
            },
          ],
        },
      ],
    },
  ],
  cheatsheet: [
    "Client → Server is the atom of every system you'll build in this game.",
    "A server has finite capacity — too many in-flight requests and new arrivals are dropped.",
  ],
};
