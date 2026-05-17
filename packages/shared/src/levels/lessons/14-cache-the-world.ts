import type { Lesson } from "../../types/level";

export const LESSON_14_CACHE_THE_WORLD: Lesson = {
  tagline: "Most read traffic should never reach your origin — that's what edge caches are for.",
  sections: [
    {
      heading: "Why an edge cache",
      blocks: [
        {
          type: "prereq",
          items: [
            { term: "server", eli5: "A computer that runs all day waiting to answer requests." },
            { term: "database", eli5: "Permanent storage that saves data even when the server restarts." },
            { term: "cdn", eli5: "A network of edge servers that cache content near users." },
            { term: "cache hit rate", eli5: "The fraction of requests answered from cache without hitting the origin." },
          ],
        },
        {
          type: "p",
          text: "Read-heavy traffic — product pages, images, JavaScript bundles, news articles — is overwhelmingly the same answer being served over and over to different users. Asking your origin server to recompute or refetch that answer every single time wastes the capacity you need for requests that actually require fresh computation: checkouts, personalised feeds, writes.",
        },
        {
          type: "p",
          text: "A CDN (Content Delivery Network) is like a chain of convenience stores stocked from a central warehouse. On a cache hit, the CDN answers from its local stock — the warehouse (your origin) never sees the request. On a miss, it restocks from the origin, caches the result, and serves it directly for all subsequent requests. Your origin only sees the requests it truly needs to handle.",
        },
      ],
    },
    {
      heading: "Hit rate is everything",
      blocks: [
        {
          type: "p",
          text: "The effectiveness of a CDN comes down to one number: hit rate. If 90% of traffic is served from the CDN, your origin sees only 10% of total requests — you have effectively multiplied your origin's capacity by 10× without adding a single server. The key ingredients are cacheable content (safe to share between users) and sensible TTLs (how long the cached copy stays fresh).",
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
