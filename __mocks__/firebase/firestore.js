// Manual mock — see app.js in this folder for why.
module.exports = {
  getFirestore: jest.fn(() => ({})),
  initializeFirestore: jest.fn(() => ({})),
  collection: jest.fn((...segments) => ({ segments })),
  doc: jest.fn((...segments) => ({ id: segments[segments.length - 1] ?? 'mock-doc-id', segments })),
  setDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => undefined })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  onSnapshot: jest.fn(() => () => {}), // no-op unsubscribe by default; override per-test as needed
  serverTimestamp: jest.fn(() => 'mock-server-timestamp'),
};
