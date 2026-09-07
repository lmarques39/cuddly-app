# Security Policy

Cuddly is a student capstone project (IEFP UC00507). It runs against synthetic demo data only — no real family or health data should ever be committed, seeded, or used in demos.

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities. Instead, report privately:

- Use GitHub's [private vulnerability reporting](../../security/advisories/new) for this repository, or
- Contact the maintainer directly: Luís Marques ([@lmarques39](https://github.com/lmarques39)).

Include steps to reproduce, the affected area (auth, data storage, dependencies, etc.), and potential impact if known. We aim to acknowledge reports within a few days given this is a coursework project with limited on-call capacity.

## Scope

Given the app deals with pregnancy/postpartum family data, priority areas for review are:

- Authentication and session handling (Firebase Auth, Google OAuth).
- Local data storage (AsyncStorage / SQLite) and what it persists.
- Any endpoint or Firebase security rule controlling who can read/write family data.

## Supported versions

This project does not yet have tagged releases; security fixes land on `main`.
