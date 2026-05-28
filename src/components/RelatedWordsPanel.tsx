import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getRelatedWords } from '../services/relatedWordsService';
import { colors } from '../theme/colors';
import { RelatedWord } from '../data/relatedWords';

type Props = {
  hanzi: string;
  onSelectWord: (word: string) => void;
};

export function RelatedWordsPanel({ hanzi, onSelectWord }: Props) {
  const [words, setWords] = useState<RelatedWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setWords([]);

    getRelatedWords(hanzi)
      .then((result) => {
        if (!active) {
          return;
        }

        setWords(result);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [hanzi]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>组词</Text>
        <Text style={styles.subtitle}>点击词语查看词组页</Text>
      </View>

      {loading ? (
        <Text style={styles.emptyText}>组词加载中...</Text>
      ) : words.length === 0 ? (
        <Text style={styles.emptyText}>暂无组词</Text>
      ) : (
        <View style={styles.list}>
          {words.map((word) => (
            <Pressable
              key={word.word}
              onPress={() => onSelectWord(word.word)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.word}>{word.word}</Text>
                <Text style={styles.pinyin}>{word.pinyin}</Text>
              </View>
              <Text style={styles.meaning}>{word.meaning}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 2,
    marginTop: 18,
    padding: 16,
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: '#fffdf7',
    borderColor: '#ead9bd',
    borderRadius: 18,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  word: {
    color: colors.ink,
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '900',
  },
  pinyin: {
    color: colors.coral,
    fontSize: 14,
    fontWeight: '900',
  },
  meaning: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.75,
  },
});
