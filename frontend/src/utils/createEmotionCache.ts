// utils/createEmotionCache.ts
import { EmotionCache } from '@emotion/cache';
import createCache from '@emotion/cache';

const isBrowser = typeof document !== 'undefined';

export default function createEmotionCache(): EmotionCache {
  let insertionPoint: HTMLElement | undefined;

  if (isBrowser) {
    const emotionInsertionPoint = document.querySelector<HTMLMetaElement>(
      'meta[name="emotion-insertion-point"]'
    );
    insertionPoint = emotionInsertionPoint ?? undefined;
  }

  const cacheOptions: { key: string; insertionPoint?: HTMLElement } = {
    key: 'css',
    ...(insertionPoint && { insertionPoint }),
  };

  return createCache(cacheOptions);
}
