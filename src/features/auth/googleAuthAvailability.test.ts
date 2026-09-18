import { isGoogleSignInAvailable } from './googleAuthAvailability';

describe('isGoogleSignInAvailable', () => {
  it('requires androidClientId on Android, ignoring webClientId', () => {
    expect(isGoogleSignInAvailable('android', { android: 'abc', web: 'xyz' })).toBe(true);
    expect(isGoogleSignInAvailable('android', { android: undefined, web: 'xyz' })).toBe(false);
  });

  it('requires webClientId on any other platform (web, ios), ignoring androidClientId', () => {
    expect(isGoogleSignInAvailable('web', { android: undefined, web: 'xyz' })).toBe(true);
    expect(isGoogleSignInAvailable('web', { android: 'abc', web: undefined })).toBe(false);
    expect(isGoogleSignInAvailable('ios', { android: undefined, web: 'xyz' })).toBe(true);
  });
});
