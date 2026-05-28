import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { colors } from '../theme/colors';

type Props = {
  character: string;
  onComplete: () => void;
  onStrokeCountChange?: (count: number) => void;
};

export function HanziWriterPractice({
  character,
  onComplete,
  onStrokeCountChange,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const celebrationScale = useRef(new Animated.Value(0.8)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const [showCelebration, setShowCelebration] = useState(false);
  const html = useMemo(() => buildHanziWriterHtml(character), [character]);

  useEffect(() => {
    setShowCelebration(false);
    celebrationScale.setValue(0.8);
    celebrationOpacity.setValue(0);
  }, [celebrationOpacity, celebrationScale, character]);

  function runWebViewCommand(command: 'playStrokeAnimation' | 'startQuiz') {
    setShowCelebration(false);
    webViewRef.current?.injectJavaScript(`
      window.${command} && window.${command}();
      true;
    `);
  }

  function handleMessage(event: WebViewMessageEvent) {
    try {
      var payload = JSON.parse(event.nativeEvent.data);
      if (payload && payload.type === 'strokeCount') {
        onStrokeCountChange?.(payload.count);
        return;
      }
    } catch (error) {
      // fall through to string commands
    }

    if (event.nativeEvent.data !== 'quizComplete') {
      return;
    }

    setShowCelebration(true);
    onComplete();

    Animated.parallel([
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 4,
        tension: 130,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          originWhitelist={['*']}
          javaScriptEnabled
          onMessage={handleMessage}
          scrollEnabled={false}
          style={styles.webview}
        />

        {showCelebration && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.celebration,
              {
                opacity: celebrationOpacity,
                transform: [{ scale: celebrationScale }],
              },
            ]}
          >
            <Text style={styles.celebrationText}>真棒!</Text>
            <Text style={styles.celebrationSubtext}>+1 star</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.controls}>
        <PracticeButton
          label="播放笔顺"
          tone="teal"
          onPress={() => runWebViewCommand('playStrokeAnimation')}
        />
        <PracticeButton
          label="跟写练习"
          tone="coral"
          onPress={() => runWebViewCommand('startQuiz')}
        />
      </View>
    </View>
  );
}

function buildHanziWriterHtml(character: string) {
  const safeCharacter = JSON.stringify(character);

  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body {
        margin: 0;
        height: 100%;
        background: transparent;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .practice-shell {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 10px;
        height: 100%;
        justify-content: center;
        width: 100%;
      }

      .writer-wrap {
        align-items: center;
        border: 3px solid #e2cda9;
        border-radius: 22px;
        box-sizing: border-box;
        display: flex;
        height: 270px;
        justify-content: center;
        width: 270px;
      }

      #target {
        display: block;
        height: 256px;
        width: 256px;
      }

      #stroke-order {
        box-sizing: border-box;
        display: flex;
        gap: 8px;
        max-width: 100%;
        min-height: 58px;
        overflow-x: auto;
        padding: 0 4px 2px;
        -webkit-overflow-scrolling: touch;
      }

      .stroke-grid {
        background: #fffdf7;
        border: 2px solid #e2cda9;
        border-radius: 10px;
        flex: 0 0 auto;
        height: 54px;
        width: 54px;
      }

      .stroke-placeholder {
        align-items: center;
        color: #b58f62;
        display: flex;
        font-size: 13px;
        font-weight: 800;
        height: 54px;
        justify-content: center;
        width: 100%;
      }

      .fallback {
        color: #243047;
        font-size: 96px;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <div class="practice-shell">
      <div class="writer-wrap">
        <svg id="target" xmlns="http://www.w3.org/2000/svg" width="256" height="256">
          <rect x="0" y="0" width="256" height="256" fill="#fffdf7" />
          <line x1="0" y1="0" x2="256" y2="256" stroke="#ead9bd" stroke-width="2" stroke-dasharray="8 8" />
          <line x1="256" y1="0" x2="0" y2="256" stroke="#ead9bd" stroke-width="2" stroke-dasharray="8 8" />
          <line x1="128" y1="0" x2="128" y2="256" stroke="#e2cda9" stroke-width="2" />
          <line x1="0" y1="128" x2="256" y2="128" stroke="#e2cda9" stroke-width="2" />
        </svg>
      </div>
      <div id="stroke-order">
        <div class="stroke-placeholder">笔顺加载中</div>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.7/dist/hanzi-writer.min.js"></script>
    <script>
      var character = ${safeCharacter};
      var writer = null;
      var svgNS = 'http://www.w3.org/2000/svg';

      function boot() {
        if (!window.HanziWriter) {
          document.getElementById('target').innerHTML = '<div class="fallback">' + character + '</div>';
          return;
        }

        writer = HanziWriter.create('target', character, {
          width: 256,
          height: 256,
          padding: 12,
          showCharacter: true,
          showOutline: true,
          strokeColor: '#243047',
          outlineColor: '#d7c3a2',
          strokeAnimationSpeed: 1.15,
          delayBetweenStrokes: 350,
          drawingWidth: 36,
          radicalColor: '#ff6b6b',
        });

        renderStrokeOrder();

        window.playStrokeAnimation = function () {
          writer.cancelQuiz && writer.cancelQuiz();
          writer.showCharacter();
          writer.animateCharacter();
        };

        window.startQuiz = function () {
          writer.hideCharacter();
          writer.quiz({
            onComplete: function () {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage('quizComplete');
            }
          });
        };
      }

      function addGrid(svg, size) {
        [
          [0, 0, size, size, true],
          [size, 0, 0, size, true],
          [size / 2, 0, size / 2, size, false],
          [0, size / 2, size, size / 2, false]
        ].forEach(function(lineData) {
          var line = document.createElementNS(svgNS, 'line');
          line.setAttribute('x1', lineData[0]);
          line.setAttribute('y1', lineData[1]);
          line.setAttribute('x2', lineData[2]);
          line.setAttribute('y2', lineData[3]);
          line.setAttribute('stroke', lineData[4] ? '#f0e1c8' : '#e7d0aa');
          line.setAttribute('stroke-width', '1');
          if (lineData[4]) line.setAttribute('stroke-dasharray', '4 4');
          svg.appendChild(line);
        });
      }

      function renderStrokeOrder() {
        HanziWriter.loadCharacterData(character).then(function(charData) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'strokeCount',
            count: charData.strokes.length
          }));

          var target = document.getElementById('stroke-order');
          target.innerHTML = '';

          for (var i = 0; i < charData.strokes.length; i++) {
            renderStrokeStep(target, charData.strokes, i);
          }
        }).catch(function() {
          document.getElementById('stroke-order').innerHTML = '<div class="stroke-placeholder">笔顺暂不可用</div>';
        });
      }

      function renderStrokeStep(target, strokes, activeIndex) {
        var size = 54;
        var svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'stroke-grid');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        target.appendChild(svg);

        addGrid(svg, size);

        var group = document.createElementNS(svgNS, 'g');
        var transformData = HanziWriter.getScalingTransform(size, size, 4);
        group.setAttribute('transform', transformData.transform);
        svg.appendChild(group);

        strokes.slice(0, activeIndex + 1).forEach(function(strokePath, index) {
          var path = document.createElementNS(svgNS, 'path');
          path.setAttribute('d', strokePath);
          path.style.fill = index === activeIndex ? '#ff6b6b' : '#243047';
          path.style.opacity = index === activeIndex ? '1' : '0.35';
          group.appendChild(path);
        });

        var number = document.createElementNS(svgNS, 'text');
        number.setAttribute('x', '48');
        number.setAttribute('y', '10');
        number.setAttribute('text-anchor', 'middle');
        number.setAttribute('font-size', '9');
        number.setAttribute('font-weight', '800');
        number.setAttribute('fill', '#9f7b50');
        number.setAttribute('opacity', '0.72');
        number.textContent = String(activeIndex + 1);
        svg.appendChild(number);
      }

      boot();
    </script>
  </body>
</html>`;
}

function PracticeButton({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: 'coral' | 'teal';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'coral' ? styles.coralButton : styles.tealButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  frame: {
    backgroundColor: '#fffdf7',
    height: 354,
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  celebration: {
    alignItems: 'center',
    backgroundColor: colors.yellow,
    borderColor: colors.ink,
    borderRadius: 28,
    borderWidth: 3,
    left: 42,
    paddingHorizontal: 24,
    paddingVertical: 18,
    position: 'absolute',
    right: 42,
    top: 112,
  },
  celebrationText: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  celebrationSubtext: {
    color: colors.coral,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    alignItems: 'center',
    borderColor: colors.ink,
    borderRadius: 18,
    borderWidth: 3,
    flex: 1,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 12,
  },
  coralButton: {
    backgroundColor: colors.coral,
  },
  tealButton: {
    backgroundColor: colors.teal,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.74,
  },
});
