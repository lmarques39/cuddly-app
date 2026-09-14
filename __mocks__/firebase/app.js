// Manual mock: firebase/app is ESM and would otherwise crash Jest's
// transform. Any node_modules package with a file here at
// __mocks__/<path> gets this automatically for every test, no
// jest.mock() call needed — see https://jestjs.io/docs/manual-mocks.
module.exports = {
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
  initializeApp: jest.fn(() => ({})),
};
