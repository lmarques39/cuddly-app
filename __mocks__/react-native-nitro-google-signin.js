// Native module — not available under Jest. Every call resolves as if the
// user cancelled, which is enough for screens that only render the button.
module.exports = {
  GoogleOneTapSignIn: {
    configure: jest.fn(),
    checkPlayServices: jest.fn(() => Promise.resolve()),
    presentExplicitSignIn: jest.fn(() => Promise.resolve({ type: 'cancelled', data: null })),
    signOut: jest.fn(() => Promise.resolve()),
  },
  isSuccessResponse: (r) => r.type === 'success' && !!r.data,
  isCancelledResponse: (r) => r.type === 'cancelled',
  isErrorWithCode: (e) => !!e && typeof e === 'object' && 'code' in e,
  statusCodes: {
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    IN_PROGRESS: 'IN_PROGRESS',
    DEVELOPER_ERROR: 'DEVELOPER_ERROR',
  },
};
