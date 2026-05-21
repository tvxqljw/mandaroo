import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

type Props = {
  characters: string[];
  onSelectCharacter: (character: string) => void;
};

export function HanziWriterPhraseGrid({
  characters,
  onSelectCharacter,
}: Props) {
  const html = useMemo(() => buildPhraseGridHtml(characters), [characters]);

  function handleMessage(event: WebViewMessageEvent) {
    const character = event.nativeEvent.data;

    if (character.length > 0) {
      onSelectCharacter(character);
    }
  }

  return (
    <View style={styles.frame}>
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        onMessage={handleMessage}
        scrollEnabled
        nestedScrollEnabled
        style={styles.webview}
      />
    </View>
  );
}

function buildPhraseGridHtml(characters: string[]) {
  const safeCharacters = JSON.stringify(characters);

  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body {
        background: #fff8ea;
        margin: 0;
        overflow-x: hidden;
        overflow-y: auto;
        width: 100%;
      }

      body {
        box-sizing: border-box;
        padding: 8px 0;
      }

      .grid {
        display: flex;
        flex-direction: column;
        gap: 14px;
        width: 100%;
      }

      .row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 0 auto;
        max-width: 324px;
        width: 100%;
      }

      .row.large {
        grid-template-columns: repeat(var(--count), minmax(0, 1fr));
        max-width: min(100%, 324px);
      }

      .tile {
        align-items: center;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .tile-button {
        appearance: none;
        background: transparent;
        border: 0;
        margin: 0;
        padding: 0;
      }

      .pinyin {
        color: #ff6b6b;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 17px;
        font-weight: 900;
        height: 24px;
        line-height: 22px;
        margin-bottom: 6px;
        text-align: center;
      }

      .box {
        background: #fffdf7;
        border: 3px solid #e2cda9;
        box-sizing: border-box;
        height: 108px;
        overflow: hidden;
        width: 100%;
      }

      .row.large .box {
        height: min(42vw, 156px);
      }

      .tile:not(:first-child) .box {
        border-left-width: 0;
      }

      .tile:first-child .box {
        border-bottom-left-radius: 18px;
        border-top-left-radius: 18px;
      }

      .tile:last-child .box {
        border-bottom-right-radius: 18px;
        border-top-right-radius: 18px;
      }

      .target {
        display: block;
        height: 100%;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="grid" class="grid"></div>
    <script src="https://cdn.jsdelivr.net/npm/pinyin-pro@3.28.1/dist/index.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.7/dist/hanzi-writer.min.js"></script>
    <script>
      var characters = ${safeCharacters};

      function getPinyin(character) {
        if (window.pinyinPro && window.pinyinPro.pinyin) {
          return window.pinyinPro.pinyin(character, { toneType: 'symbol' });
        }

        return '';
      }

      function chunk(items, size) {
        var chunks = [];

        for (var index = 0; index < items.length; index += size) {
          chunks.push(items.slice(index, index + size));
        }

        return chunks;
      }

      function addGridLines(svg, size) {
        [
          [0, 0, size, size, '#efdfc6'],
          [size, 0, 0, size, '#efdfc6'],
          [size / 2, 0, size / 2, size, '#e8d3af'],
          [0, size / 2, size, size / 2, '#e8d3af']
        ].forEach(function(lineData) {
          var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', lineData[0]);
          line.setAttribute('y1', lineData[1]);
          line.setAttribute('x2', lineData[2]);
          line.setAttribute('y2', lineData[3]);
          line.setAttribute('stroke', lineData[4]);
          line.setAttribute('stroke-width', '1');
          svg.appendChild(line);
        });
      }

      function render() {
        var root = document.getElementById('grid');
        root.innerHTML = '';

        var rows = characters.length <= 2 ? [characters] : chunk(characters, 3);

        rows.forEach(function(row, rowIndex) {
          var rowEl = document.createElement('div');
          rowEl.className = characters.length <= 2 ? 'row large' : 'row';
          rowEl.style.setProperty('--count', String(row.length));
          root.appendChild(rowEl);

          row.forEach(function(character, columnIndex) {
            var tile = document.createElement('button');
            tile.className = 'tile tile-button';
            tile.onclick = function() {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(character);
            };
            rowEl.appendChild(tile);

            var pinyin = document.createElement('div');
            pinyin.className = 'pinyin';
            pinyin.textContent = getPinyin(character);
            tile.appendChild(pinyin);

            var box = document.createElement('div');
            box.className = 'box';
            tile.appendChild(box);

            var targetId = 'target-' + rowIndex + '-' + columnIndex;
            var size = characters.length <= 2 ? 156 : 108;
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('id', targetId);
            svg.setAttribute('class', 'target');
            svg.setAttribute('width', String(size));
            svg.setAttribute('height', String(size));
            box.appendChild(svg);
            addGridLines(svg, size);

            if (window.HanziWriter) {
              HanziWriter.create(targetId, character, {
                width: size,
                height: size,
                padding: characters.length <= 2 ? 12 : 8,
                showCharacter: true,
                showOutline: false,
                strokeColor: '#243047',
                radicalColor: '#ff6b6b',
              });
            }
          });
        });
      }

      render();
    </script>
  </body>
</html>`;
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 0,
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
