import type { Lesson } from "../../types/level";

export const LESSON_13_DLQ: Lesson = {
  tagline: "Don't drop failed messages on the floor: keep them for later.",
  sections: [
    {
      heading: "The problem with silent drops",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "queue", eli5: "A waiting line that holds work until a consumer is ready." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "dead-letter queue", eli5: "A side channel for messages that failed to process normally." },
          ],
        },
        {
          type: "p",
          text: "When a queue overflows or a consumer repeatedly fails to process a message, the simplest behaviour is to drop it and move on. But silent drops are an operational nightmare: you cannot see what was lost, you cannot replay it, and you might not even know it happened until a user complains that their action never took effect. During an incident, 'I don't know what we lost' is one of the scariest sentences an engineer can say.",
        },
      ],
    },
    {
      heading: "What a dead-letter queue does",
      blocks: [
        {
          type: "p",
          text: "A dead-letter queue (DLQ) is a side channel for messages that could not be processed normally. Overflows, repeated processing failures, malformed messages: instead of disappearing, they land in the DLQ where operators can inspect them, understand why they failed, fix the underlying issue, and replay them when the system is healthy again.",
        },
        {
          type: "p",
          text: "In Flow, draw an edge from a queue to a target node, click the edge, and mark it as a dead-letter route. When the source queue overflows, messages that would have been dropped are instead routed to the DLQ target: typically a separate database kept for inspection.",
        },
        {
          type: "callout",
          tone: "info",
          title: "DLQ as observability",
          text: "Even if you never replay a single message, having a DLQ means you can answer 'how much did we lose and why?': which is infinitely better than 'I don't know' during an incident review.",
        },
      ],
    },
  ],
  cheatsheet: [
    "Mark a queue's overflow edge as DLQ to capture failed messages instead of losing them.",
    "DLQ depth is a key alert signal: a growing DLQ means something is broken upstream.",
  ],
};
