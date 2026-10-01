---
name: firestore-rules-testing
description: How to run or extend the Firestore security-rules test suite (npm run test:rules) in the cuddly-app project — the local emulator setup, the Java dependency, and why it needs its own Jest/TS config separate from the main suite. Use whenever firestore.rules changes, or when asked to verify/audit the rules.
---

# Testing firestore.rules against a real local emulator

This project verifies `firestore.rules` with `@firebase/rules-unit-testing` against
an actual local Firestore emulator — not by inspection, and not mocked. Tests live
in `firestore-tests/rules.test.ts`.

## Running it

```bash
npm run test:rules
```

This runs `firebase emulators:exec --only firestore "jest --config jest.rules.config.js"` —
it boots a real emulator, runs the tests against it, then shuts it down.

## One-time machine setup (per developer, not per repo)

The emulator is a Java process. Not bundled with the repo — each machine needs its
own JDK.

- **macOS**: `brew install openjdk`. It's keg-only, so it won't be on `PATH`
  automatically — run `export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"` in the
  shell you run `npm run test:rules` from (or add it to `~/.zshrc` yourself if you
  want it permanent — don't do that silently on someone else's machine).
- **Windows** (this is what Sara needs, see the `feedback-windows-teammate-support`
  memory): `winget install Microsoft.OpenJDK.21`, or the installer from
  adoptium.net if winget isn't set up.

`npm test` (the normal suite) does **not** need Java — only `npm run test:rules`
does. That's deliberate; don't merge the two.

## Why this needed its own config (the non-obvious part)

Three separate problems had to be solved together, in this order:

1. **`firebase/firestore` is ESM and Jest can't parse it by default.** The main
   suite avoids this entirely with manual mocks at `__mocks__/firebase/{app,auth,firestore}.js`
   (Jest's node_modules manual-mock convention — these apply automatically, no
   `jest.mock()` call needed, as long as the config's `roots` includes the
   top-level directory those mocks live under).

2. **The rules test needs the *real* SDK, not those mocks** — it has to actually
   talk to the emulator. So it can't just reuse the main Jest config. The fix:
   `jest.rules.config.js` sets `roots: ['<rootDir>/firestore-tests']`. Jest's
   manual-mock discovery is scoped to `roots` — pointing `roots` away from the
   repo root means it never finds `__mocks__/firebase/`, so `import ... from
   'firebase/firestore'` resolves to the real package for this config only.

3. **With the real SDK now loading, Jest still needs to transform it.** There's
   no project-wide `babel.config.js` (the main suite gets its transform from the
   `jest-expo` preset internally) — so this separate config needs its own,
   minimal one:
   ```js
   transform: {
     '^.+\\.tsx?$': [
       'babel-jest',
       { presets: ['@babel/preset-typescript'], plugins: ['@babel/plugin-transform-modules-commonjs'] },
     ],
   },
   transformIgnorePatterns: ['node_modules/(?!(firebase|@firebase)/)'],
   ```
   Both the TS-stripping preset and the ESM→CJS plugin are required — one alone
   isn't enough (confirmed by hitting each failure mode in turn while building this).

4. **Type-checking**: the main `tsconfig.json` excludes `firestore-tests/`
   entirely (`"exclude": ["node_modules", "firestore-tests"]`) rather than adding
   Node's ambient types (`fs`, etc.) to the whole React Native app's scope.
   `firestore-tests/tsconfig.json` extends `expo/tsconfig.base` with
   `"types": ["node", "jest"]` instead — check both configs together if editor
   red squiggles show up in either main app files or `firestore-tests/`.

## Writing a new rules test

Pattern (see `firestore-tests/rules.test.ts` for the full file):

```ts
const alice = testEnv.authenticatedContext('alice');
const bob = testEnv.authenticatedContext('bob');
await setDoc(doc(alice.firestore(), 'families', 'famA'), { createdAt: Date.now() });
await setDoc(doc(alice.firestore(), 'families', 'famA', 'members', 'alice'), { name: 'Alice' });

await assertFails(getDoc(doc(bob.firestore(), 'families', 'famA'))); // cross-family read denied
```

Reset state between tests with `afterEach(() => testEnv.clearFirestore())` — already
set up in the file. `firebase.json` pins the emulator to port 8090 (avoids clashing
with the default 8080 some other local tooling might use).
