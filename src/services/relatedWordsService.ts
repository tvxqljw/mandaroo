import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  RelatedWord,
  RelatedWordMap,
  relatedWordFallbacks,
} from '../data/relatedWords';

const REMOTE_WORD_DATA_URL =
  'https://raw.githubusercontent.com/tvxqljw/mandaroo/master/src/data/related-words.json';
const CACHE_PREFIX = 'mandaroo.related-words.';

let remoteWordMapPromise: Promise<RelatedWordMap> | null = null;

function cacheKey(hanzi: string) {
  return `${CACHE_PREFIX}${hanzi}`;
}

async function loadCachedWords(hanzi: string): Promise<RelatedWord[] | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(hanzi));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as RelatedWord[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function saveCachedWords(hanzi: string, words: RelatedWord[]) {
  try {
    await AsyncStorage.setItem(cacheKey(hanzi), JSON.stringify(words));
  } catch {
    // ignore storage failures in MVP
  }
}

async function loadRemoteWordMap(): Promise<RelatedWordMap> {
  if (!remoteWordMapPromise) {
    remoteWordMapPromise = fetch(REMOTE_WORD_DATA_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load related words: ${response.status}`);
        }

        return (await response.json()) as RelatedWordMap;
      })
      .catch(() => relatedWordFallbacks);
  }

  return remoteWordMapPromise;
}

export async function getRelatedWords(hanzi: string): Promise<RelatedWord[]> {
  const cached = await loadCachedWords(hanzi);

  if (cached) {
    return cached;
  }

  const remoteWordMap = await loadRemoteWordMap();
  const remoteWords = remoteWordMap[hanzi];

  if (remoteWords && remoteWords.length > 0) {
    await saveCachedWords(hanzi, remoteWords);
    return remoteWords;
  }

  const fallbackWords = relatedWordFallbacks[hanzi] ?? [];
  await saveCachedWords(hanzi, fallbackWords);
  return fallbackWords;
}
