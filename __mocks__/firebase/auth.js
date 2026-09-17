// Manual mock — see app.js in this folder for why.
const authState = { currentUser: null };

module.exports = {
  getAuth: jest.fn(() => authState),
  initializeAuth: jest.fn(() => authState),
  getReactNativePersistence: jest.fn(),
  // No-op by default (like onSnapshot below) — override per-test if a test
  // needs to simulate a real auth state change firing.
  onAuthStateChanged: jest.fn(() => () => {}),
  signOut: jest.fn(() => Promise.resolve()),
};
