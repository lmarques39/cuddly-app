# Contributing to Cuddly

Cuddly is a 4-person capstone project for IEFP UC00507. This guide covers how we work day to day.

## Team

| Name | Role |
|---|---|
| Luís | Team / Mobile Lead |
| Sara | Backend / Data + QA Lead |
| Eliseu | UX/UI Lead |
| Beatriz | Docs Lead |

## Workflow

1. Pick up (or create) an issue from the [project board](../../projects) — move it to **In Progress** and assign yourself.
2. Branch off `main`: `git checkout -b <type>/<short-description>` (e.g. `feat/contraction-timer`, `fix/onboarding-crash`, `docs/readme-setup`).
3. Commit as you go; keep commits scoped and messages descriptive.
4. Open a pull request into `main` early (draft is fine) and link the issue it closes (`Closes #<n>`).
5. Fill in the PR checklist (tests, accessibility, screenshots for UI changes, breaking changes called out).
6. Move the issue to **Review** once the PR is ready.
7. **Reviews required:** at least 1 approval for normal changes, **2 approvals for anything touching auth, data storage, or family/health data**.
8. CI (lint, typecheck, tests) must pass before merge — `main` is protected and blocks direct pushes.
9. Merge with squash (default), delete the branch (done automatically), move the issue to **Done**.

## Local setup

```bash
npm install
npm run start        # Expo dev server
npm run android       # or: npm run ios / npm run web
npm run typecheck
npm run lint
npm test
```

See `AGENTS.md` for Expo SDK version notes before touching Expo APIs.

## Commit / branch conventions

- Branch prefixes: `feat/`, `fix/`, `docs/`, `test/`, `chore/`.
- No secrets, `.env` files, or real family/health data in commits — see [`SECURITY.md`](SECURITY.md). Demo data must be synthetic.

## Issue labels

`bug`, `feature`, `documentation`, `good-first-issue`, `security`.
