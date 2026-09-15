// Manual mock — see app.js in this folder for why.
let autoIdCounter = 0;

module.exports = {
  getFirestore: jest.fn(() => ({})),
  initializeFirestore: jest.fn(() => ({})),
  collection: jest.fn((...segments) => ({ segments })),
  // doc(db, 'a', 'id') -> last segment is the given id. doc(collectionRef)
  // (no id) is Firestore's auto-id form — mimic that with a unique fake id
  // instead of a fixed string, or every call in a test would collide.
  doc: jest.fn((...segments) => {
    const last = segments[segments.length - 1];
    const id = typeof last === 'string' ? last : `mock-auto-id-${++autoIdCounter}`;
    return { id, segments };
  }),
  setDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => undefined })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  onSnapshot: jest.fn(() => () => {}), // no-op unsubscribe by default; override per-test as needed
  serverTimestamp: jest.fn(() => 'mock-server-timestamp'),
};
