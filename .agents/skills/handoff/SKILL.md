---
description: Compact the current conversation into a handoff document for another agent to pick up.
metadata:
    author: Matt Pocock
    author_url: https://github.com/mattpocock
    github-path: skills/productivity/handoff
    github-ref: refs/heads/main
    github-repo: https://github.com/mattpocock/skills
    github-tree-sha: e74f0061bb67222181640effa98c675bdb2fdaa7
name: handoff
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save it to a path produced by `mktemp -t handoff-XXXXXX.md` (read the file before you write to it).

Suggest the skills to be used, if any, by the next session.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
