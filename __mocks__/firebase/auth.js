// Manual mock — see app.js in this folder for why.
const authState = { currentUser: null };

module.exports = {
  getAuth: jest.fn(() => authState),
  initializeAuth: jest.fn(() => authState),
  getReactNativePersistence: jest.fn(),
};
