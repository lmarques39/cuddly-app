---
name: cuddly-github-workflow
description: How this project (lmarques39/cuddly-app) organizes GitHub issues and its Project board — exact gh CLI commands and field/option IDs for moving cards, plus the sub-issue-per-layer pattern for breaking down a dev feature issue. Use when creating, closing, or re-triaging issues, or moving cards on the board.
---

# Cuddly's GitHub issue + board workflow

The team's single source of truth is the GitHub Project board — **"Cuddly"**,
`https://github.com/users/lmarques39/projects/3` (project number 3, owner
`lmarques39`). Two conventions make this work smoothly; both are non-obvious
enough to relearn each time without this written down.

## Board IDs (needed for every `gh project item-edit` call)

`gh project item-edit` needs raw GraphQL node IDs, not human labels. These are
stable for this project — reuse them instead of re-discovering via
`gh api graphql` introspection each session:

```
PROJECT_ID    = PVT_kwHOA8pCjM4BjKJD
STATUS_FIELD  = PVTSSF_lAHOA8pCjM4BjKJDzhh_ing

Status options:
  Backlog            = f75ad846
  Ready              = 579f99a8
  In Progress        = 47fc9ee4
  Review             = a240595d
  Revisão de Design  = 421c08b0   (added 2026-09-14 — see below)
  Done               = 98236657
```

If these ever stop working (e.g. someone edits the board's fields), re-fetch with:
```bash
gh project field-list 3 --owner lmarques39 --format json
```

### Moving a card

1. Find its item ID: `gh project item-list 3 --owner lmarques39 --format json --limit 80`
   (filter the JSON for `content.number == <issue>`, take `.id`).
2. Set status:
   ```bash
   gh project item-edit --id <ITEM_ID> --field-id "$STATUS_FIELD" \
     --project-id "$PROJECT_ID" --single-select-option-id <OPTION_ID>
   ```

### Board automations

"Item closed → Done" and "Auto-add to project" are enabled (Project → `⋯` menu →
Workflows). Closing an issue via `gh issue close` or a merged PR with `Closes #N`
moves its card to Done automatically — no manual `item-edit` needed for that case.
New issues need `--project "Cuddly"` on `gh issue create` to land on the board at
all (auto-add only catches issues matching its filter going forward, not always
reliably for issues created via API — verify with `item-list` after creating).

### Review before Done — every code issue, regardless of assignee

**Never `gh issue close` a code issue as soon as the code is written, even a
Luis-only one.** Closing auto-moves the card to Done (see automations below),
which skips the one step that actually matters: Sara gets a look before
anything is considered finished. She doesn't use AI support, so "implemented
and typechecks" isn't the same as "actually works" — and even on issues she
isn't formally assigned to, she should still get to glance at what shipped.
(Settled 2026-09-15, after #40/#41 got closed straight to Done with no review
at all — first walked back as a joint-assignee-only rule, then the user
broadened it to *every* code issue, solo ones included.)

Instead, once the code is implemented and passes typecheck/lint:
```bash
gh issue comment <N> --repo lmarques39/cuddly-app --body "<what was implemented>"
gh project item-edit --id <ITEM_ID> --field-id "$STATUS_FIELD" \
  --project-id "$PROJECT_ID" --single-select-option-id a240595d   # Review
```
Leave the issue **open**. Only close it (which then auto-moves to Done) once
Sara (or the user, on her behalf) has actually had a look and confirmed it.
This applies to every dev issue on the board — not just ones assigned to both
`lmarques39` and `saraladeiro`.

### The "Revisão de Design" column

Added specifically so a dev issue can be marked "implemented, not yet checked
against the real Figma" without blocking on design up front. Eliseu/Beatriz
(design-only, see `project-cuddly-team` memory) do that check and either fix the
Figma or flag the code — see their `design`-labeled QA issues (#37, #38) for the
pattern of what such an issue's body should look like.

## Breaking a feature issue into sub-issues

For any issue that's "build tracker X" or similarly layered, cut it into GitHub
**native sub-issues** (not just a checklist) so pieces can be picked up
independently — this mattered a lot for Sara, who works without AI support and
benefits from bite-sized, clearly-scoped units instead of one big issue.

```bash
gh issue create --repo lmarques39/cuddly-app \
  --title "<Feature>: <layer>" \
  --label "feature" --assignee "<login>" --parent <PARENT_ISSUE_NUMBER> \
  --project "Cuddly" \
  --body "..."
```

`--parent` requires GitHub's sub-issues feature (already enabled on this repo);
verify linkage with `gh api repos/lmarques39/cuddly-app/issues/<parent>/sub_issues`.

**Standard layer split** (used for #10→#40-44, #12→#46-50, #39→#56-60):
1. Data model / type + storage key — never blocked, always start here.
2. Hook (business logic) — depends on 1, still not blocked by design.
3. **Hook test — write it right after the hook, same pass, before touching the screen.**
   Not "TDD-strict" (test-first) since the app's still young, but hook logic
   is stable/high-value and shouldn't wait for the screen+nav to exist first
   (settled 2026-09-15 — the old order left tests as the literal last
   sub-issue, e.g. #44 waiting on the screen/nav that don't even exist yet
   for #36-blocked trackers; moved up so a hook never ships un-tested just
   because its screen is stuck on Figma).
4. Screen (UI) — often blocked on a design issue if the Figma frame doesn't
   exist yet (check first — several trackers were missing their frame).
   **Don't test-first here** — the design is still moving (Figma catching
   up), so a screen test written before the shape is settled just gets
   rewritten; add screen/component tests after, once the UI has stabilized.
5. Wire into navigation — depends on 4.

Mark 1-2 (and any design/rules-audit sibling with no code dependency) **Ready**
immediately; leave the rest **Backlog** until their blocker closes, then flip
them to **Ready** by hand (closing a sub-issue does not auto-unblock siblings).
The hook-test sub-issue (3) only depends on the hook (2) — never make it wait
on the screen/nav sub-issues the way #44 originally did.

Each sub-issue's body should follow the project's "porquê" template: **O que é**,
**Padrão a seguir** (which existing file to clone), **Depende de** /
**Bloqueada por**, **Fora de âmbito**. This is what lets Sara work from the issue
alone without needing to ask Luis/Claude "why is it built this way."
