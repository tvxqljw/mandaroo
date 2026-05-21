import { StatusBar } from 'expo-status-bar';
import { pinyin } from 'pinyin-pro';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HanziWriterPractice } from './src/components/HanziWriterPractice';
import { HanziWriterPhraseGrid } from './src/components/HanziWriterPhraseGrid';
import { characters } from './src/data/characters';
import { colors } from './src/theme/colors';
import { LearningCharacter } from './src/types/character';

type Screen = 'home' | 'phrase' | 'practice' | 'progress';

type SearchHistoryItem = {
  id: string;
  text: string;
  characters: string[];
};

type InputState =
  | { type: 'empty' }
  | { type: 'invalid' }
  | { type: 'valid'; characters: string[] };

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [inputText, setInputText] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<LearningCharacter>(
    characters[0],
  );
  const [selectedPhrase, setSelectedPhrase] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const inputState = getInputState(inputText);

  function completePractice() {
    setCompletedIds((current) =>
      current.includes(selectedCharacter.id)
        ? current
        : [...current, selectedCharacter.id],
    );
  }

  function submitSearch() {
    if (inputState.type !== 'valid') {
      return;
    }

    rememberSearch(inputText.trim(), inputState.characters);
    setInputText('');

    if (inputState.characters.length === 1) {
      openPracticeForCharacter(inputState.characters[0]);
      return;
    }

    openPhrase(inputState.characters);
  }

  function rememberSearch(text: string, inputCharacters: string[]) {
    const historyItem: SearchHistoryItem = {
      id: `${Date.now()}-${text}`,
      text,
      characters: inputCharacters,
    };

    setSearchHistory((current) => [
      historyItem,
      ...current.filter((item) => item.text !== text),
    ].slice(0, 8));
  }

  function openPracticeForCharacter(hanzi: string) {
    const character =
      characters.find((item) => item.hanzi === hanzi) ??
      createInputCharacter(hanzi);

    setSelectedCharacter(character);
    setScreen('practice');
  }

  function openPhrase(inputCharacters: string[]) {
    setSelectedPhrase(inputCharacters);
    setScreen('phrase');
  }

  function deleteHistoryItem(id: string) {
    setSearchHistory((current) => current.filter((item) => item.id !== id));
  }

  function confirmClearHistory() {
    Alert.alert('清空历史记录?', '所有搜索历史都会被删除。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: () => setSearchHistory([]),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>Mandaroo</Text>
          <Text style={styles.subtitle}>Dragon-kangaroo Mandarin practice</Text>
        </View>
        <View style={styles.mascot}>
          <Text style={styles.mascotText}>龙</Text>
        </View>
      </View>

      {screen === 'home' && (
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.searchField}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={submitSearch}
                placeholder="请输入汉字或词语"
                placeholderTextColor="#7b8b8a"
                returnKeyType="go"
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.searchInput,
                  inputState.type === 'invalid' && styles.searchInputOpen,
                ]}
              />

              {inputState.type === 'valid' && (
                <Pressable
                  onPress={submitSearch}
                  style={({ pressed }) => [
                    styles.searchButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.searchButtonText}>⌕</Text>
                </Pressable>
              )}
            </View>

            {inputState.type === 'invalid' && (
              <View style={styles.inputWarning}>
                <Text style={styles.inputWarningText}>请输入正确的汉字</Text>
              </View>
            )}
          </View>

          {searchHistory.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>搜索历史</Text>
                <Pressable
                  onPress={confirmClearHistory}
                  style={({ pressed }) => [
                    styles.clearHistoryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.clearHistoryText}>清空</Text>
                </Pressable>
              </View>
              <ScrollView
                nestedScrollEnabled
                style={styles.historyList}
                contentContainerStyle={styles.historyListContent}
              >
                {searchHistory.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    onDelete={() => deleteHistoryItem(item.id)}
                    onOpen={() =>
                      item.characters.length === 1
                        ? openPracticeForCharacter(item.characters[0])
                        : openPhrase(item.characters)
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {screen === 'phrase' && (
        <View style={styles.content}>
          <Pressable
            onPress={() => setScreen('home')}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹ 返回</Text>
          </Pressable>

          <View style={styles.phraseHeader}>
            <Text style={styles.phraseSubtitle}>点选一个字开始练习</Text>
          </View>

          <HanziWriterPhraseGrid
            characters={selectedPhrase}
            onSelectCharacter={openPracticeForCharacter}
          />
        </View>
      )}

      {screen === 'practice' && (
        <View style={styles.content}>
          <Pressable
            onPress={() => setScreen('home')}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹ 返回</Text>
          </Pressable>

          <View style={styles.practiceHeader}>
            <View style={styles.practiceTitleBlock}>
              <Text style={styles.practicePinyin}>
                {selectedCharacter.displayPinyin}
              </Text>
              <Text style={styles.practiceSubtitle}>
                {selectedCharacter.meaning}
              </Text>
            </View>
            <Text style={styles.practiceBadge}>+1 ⭐</Text>
          </View>

          <HanziWriterPractice
            character={selectedCharacter.hanzi}
            onComplete={completePractice}
          />
        </View>
      )}

      {screen === 'progress' && (
        <View style={styles.content}>
          <View style={styles.progressPanel}>
            <Text style={styles.progressStars}>{completedIds.length} ⭐</Text>
            <Text style={styles.progressTitle}>Practice progress</Text>
            <Text style={styles.progressText}>
              {completedIds.length === 0
                ? 'No characters practiced yet.'
                : `You practiced ${completedIds.length} character${
                    completedIds.length === 1 ? '' : 's'
                  } today.`}
            </Text>
          </View>

          <View style={styles.progressList}>
            {characters.map((character) => {
              const complete = completedIds.includes(character.id);

              return (
                <View key={character.id} style={styles.progressRow}>
                  <Text style={[styles.progressHanzi, { color: character.color }]}>
                    {character.hanzi}
                  </Text>
                  <View style={styles.progressCopy}>
                    <Text style={styles.progressMeaning}>{character.meaning}</Text>
                    <Text style={styles.progressPinyin}>
                      {character.displayPinyin}
                    </Text>
                  </View>
                  <Text style={styles.progressStatus}>
                    {complete ? '⭐' : '○'}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Keep practicing" onPress={() => setScreen('home')} />
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

function createInputCharacter(hanzi: string): LearningCharacter {
  const displayPinyin = pinyin(hanzi, { toneType: 'symbol' });

  return {
    id: `input-${hanzi}`,
    hanzi,
    pinyin: displayPinyin,
    displayPinyin,
    meaning: '',
    emoji: '',
    color: colors.coral,
  };
}

function HistoryRow({
  item,
  onOpen,
  onDelete,
}: {
  item: SearchHistoryItem;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.historyRowShell}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [
          styles.historyRowPressable,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={1} style={styles.historyText}>
          {item.text}
        </Text>
      </Pressable>
      <Pressable onPress={onDelete} style={styles.historyDeleteButton}>
        <Text style={styles.historyDeleteText}>×</Text>
      </Pressable>
    </View>
  );
}

function getInputState(text: string): InputState {
  const normalizedText = text.trim();

  if (normalizedText.length === 0) {
    return { type: 'empty' };
  }

  if (/[a-z]/i.test(normalizedText)) {
    return { type: 'invalid' };
  }

  const inputCharacters = Array.from(normalizedText).filter(
    (item) => item.trim().length > 0,
  );

  if (
    inputCharacters.length === 0 ||
    inputCharacters.some((item) => !/^\p{Script=Han}$/u.test(item))
  ) {
    return { type: 'invalid' };
  }

  return { type: 'valid', characters: inputCharacters };
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  logo: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  mascot: {
    alignItems: 'center',
    backgroundColor: colors.yellow,
    borderColor: colors.ink,
    borderRadius: 24,
    borderWidth: 3,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  mascotText: {
    color: colors.coral,
    fontSize: 28,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    flexGrow: 1,
    padding: 20,
    paddingBottom: 18,
  },
  hero: {
    backgroundColor: colors.teal,
    borderColor: colors.ink,
    borderRadius: 28,
    borderWidth: 3,
    padding: 22,
  },
  searchField: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.card,
    borderColor: colors.ink,
    borderWidth: 3,
    borderRadius: 20,
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    minHeight: 64,
    paddingHorizontal: 18,
    paddingRight: 62,
  },
  searchInputOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: colors.yellow,
    borderColor: '#d0ad43',
    borderRadius: 16,
    borderWidth: 2,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 11,
    width: 42,
  },
  searchButtonText: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 30,
  },
  historySection: {
    backgroundColor: colors.card,
    borderColor: '#d8dde6',
    borderRadius: 24,
    borderWidth: 2,
    flex: 1,
    marginTop: 22,
    minHeight: 0,
    overflow: 'hidden',
    paddingTop: 14,
  },
  inputWarning: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderColor: colors.ink,
    borderWidth: 3,
    borderTopWidth: 0,
    marginTop: -3,
    padding: 12,
  },
  inputWarningText: {
    color: colors.coral,
    fontSize: 18,
    fontWeight: '900',
    paddingVertical: 8,
    textAlign: 'center',
  },
  phraseHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  phraseSubtitle: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '800',
  },
  historyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 0,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  clearHistoryButton: {
    alignItems: 'center',
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: 56,
  },
  clearHistoryText: {
    color: colors.coral,
    fontSize: 14,
    fontWeight: '900',
  },
  historyList: {
    backgroundColor: '#fffdf7',
    flex: 1,
  },
  historyListContent: {
    paddingBottom: 2,
  },
  historyRowShell: {
    alignItems: 'center',
    backgroundColor: '#fffdf7',
    borderTopColor: '#eceff4',
    borderTopWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
  },
  historyRowPressable: {
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
    minWidth: 0,
    paddingLeft: 16,
    paddingVertical: 10,
  },
  historyText: {
    color: '#8f7777',
    fontSize: 18,
    fontWeight: '700',
  },
  historyDeleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    width: 56,
  },
  historyDeleteText: {
    color: '#b7a2a2',
    fontSize: 20,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  backButtonText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  practiceHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    minHeight: 54,
    position: 'relative',
  },
  practiceTitleBlock: {
    alignItems: 'center',
  },
  practicePinyin: {
    color: colors.coral,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  practiceSubtitle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  practiceBadge: {
    backgroundColor: colors.yellow,
    borderRadius: 18,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 0,
  },
  actions: {
    gap: 12,
    marginTop: 18,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.coral,
    borderColor: colors.ink,
    borderRadius: 20,
    borderWidth: 3,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 3,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  progressPanel: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderColor: colors.ink,
    borderRadius: 28,
    borderWidth: 3,
    padding: 24,
  },
  progressStars: {
    fontSize: 46,
    fontWeight: '900',
  },
  progressTitle: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
  },
  progressText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  progressList: {
    gap: 10,
    marginTop: 18,
  },
  progressRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 16,
  },
  progressHanzi: {
    fontSize: 38,
    fontWeight: '900',
    width: 52,
  },
  progressCopy: {
    flex: 1,
  },
  progressMeaning: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  progressPinyin: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  progressStatus: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
});
