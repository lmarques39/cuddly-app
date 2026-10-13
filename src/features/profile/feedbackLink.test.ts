import { feedbackUrl } from './feedbackLink';

it('points at the feedback page in the app language, with the version filled in (#132)', () => {
  expect(feedbackUrl('pt', '2.0.1')).toBe('https://lmarques39.github.io/cuddly-app/feedback.html?v=2.0.1');
  expect(feedbackUrl('en', '2.0.1')).toBe('https://lmarques39.github.io/cuddly-app/en/feedback.html?v=2.0.1');
  expect(feedbackUrl('pt', undefined)).toBe('https://lmarques39.github.io/cuddly-app/feedback.html');
});
