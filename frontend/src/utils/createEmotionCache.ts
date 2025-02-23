import createCache from '@emotion/cache';

const isBrowser = typeof document !== 'undefined';

export default function createEmotionCache() {
  let insertionPoint: HTMLElement | undefined;

  if (isBrowser) {
    const emotionInsertionPoint = document.querySelector<HTMLMetaElement>(
      'meta[name="emotion-insertion-point"]'
    );
    insertionPoint = emotionInsertionPoint ?? undefined;
  }

  // Only include insertionPoint if it exists
  const cacheOptions: { key: string; insertionPoint?: HTMLElement } = { key: 'css' };
  if (insertionPoint) {
    cacheOptions.insertionPoint = insertionPoint;
  }

  return createCache(cacheOptions);
}