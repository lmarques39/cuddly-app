// Separate from the main Jest config on purpose: these tests need the real
// firebase/firestore SDK talking to a local emulator, not the __mocks__/firebase/
// stand-ins the rest of the suite uses. Scoping `roots` to firestore-tests/
// keeps Jest's manual-mock discovery from finding the top-level __mocks__
// folder at all, and transformIgnorePatterns lets the real (ESM) SDK through.
module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/firestore-tests'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    // No project-wide babel.config.js exists (jest-expo's preset handles that
    // internally for the main suite) — this config isn't jest-expo, so it
    // needs its own, minimal: just enough to strip TS types for a plain
    // Node test, no React/JSX/RN transforms required here.
    '^.+\\.tsx?$': [
      'babel-jest',
      { presets: ['@babel/preset-typescript'], plugins: ['@babel/plugin-transform-modules-commonjs'] },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(firebase|@firebase)/)'],
};
