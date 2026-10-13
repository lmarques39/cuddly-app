const SITE = 'https://lmarques39.github.io/cuddly-app/';

/**
 * The site's feedback form (#132), in the app's language, with the app
 * version already filled in — testers rarely know which build they have.
 */
export function feedbackUrl(lang: string, appVersion: string | null | undefined): string {
  const page = `${SITE}${lang === 'en' ? 'en/' : ''}feedback.html`;
  return appVersion ? `${page}?v=${encodeURIComponent(appVersion)}` : page;
}
