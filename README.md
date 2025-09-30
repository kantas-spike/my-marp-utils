# my-marp-utils

marpファイルから動画を作成するためのユーティリティツールを提供する。

## インストール

本リポジトリをクローンしたディレクトリに移動後、以下を実行し、ユーティリティツールをインストールします。

```shell
npm install -g .
```

以下のツールがインストールされます。

| ツール        | 説明                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------ |
| marp2vvtext   | Marpファイルからコメントを抽出し、VOICEVOXで読み込み可能なテキストに変換する               |
| marp2cliptext | Marpファイルからスライドに挿入するクリップ用のコメントを抽出し、テキストファイルに変換する |
| marp2titles   | Marpファイルからスライドのタイトル一覧を取得する                                           |

## 使い方

### marp2vvtext

```shell
$ marp2vvtext --help
Usage: marp2vvtext [options] <marp_file_path>

Marpファイルからコメントを抽出し、VOICEVOXで読み込み可能なテキストに変換する

Arguments:
  marp_file_path              原稿となるMarpファイルパス

Options:
  -V, --version               output the version number
  -c, --config <config_path>  音声キャラクターの設定ファイルパス.未指定時はMarpファイルのあるディレクトリの`vox.json`となる
  -o, --output <output_path>  VOICEVOX用テキストファイルを保存するファイルパス. 本オプション未指定時は標準出力に変換結果を出力する
  --force                     出力先のVOICEVOX用テキストファイルが存在する場合、上書きする
  -h, --help                  display help for command
```

### marp2cliptext

```shell
$ marp2cliptext --help
Usage: marp2cliptext [options] <marp_file_path>

Marpファイルからスライドに挿入するクリップ用のコメントを抽出し、テキストファイルに変換する

Arguments:
  marp_file_path             原稿となるMarpファイルパス

Options:
  -V, --version              output the version number
  -o, --output <output_dir>  テキストファイルを出力するディレクトリパス
  -h, --help                 display help for command
```

### marp2titles

```shell
Usage: marp2titles [options] <marp_file_path>

Marpファイルからスライドのタイトル一覧を取得する

Arguments:
  marp_file_path              原稿となるMarpファイルパス

Options:
  -V, --version               output the version number
  -o, --output <output_file>  テキストファイルを出力するファイルパス
  -h, --help                  display help for command
```

## marp2vvtextの例

[sample](./sample/)内の[設定ファイル](./sample/vox.json)を使って、[Marpファイル](./sample/slide.md)を変換する場合、以下を実行します。

```shell
marp2vvtext --config ./sample/vox.json --output ./scenario.txt ./sample/slide.md
```

変換結果が`scenario.txt`に出力されます。

```shell
$ cat scenario.txt
白上虎太郎（ふつう）,Blender4.5 LTS のリリース候補版が、7月9日に公開されたよ
白上虎太郎（ふつう）,@@1
ずんだもん（ノーマル）,LTSとは、2年間メンテナンスされるバージョンのことだよ
ずんだもん（ノーマル）,通常は約4ヶ月のみメンテナンスされるよ。
ずんだもん（ノーマル）,@@2
ずんだもん（ノーマル）,正式版リリースは 2025年7月15日だよ
ずんだもん（ノーマル）,@@3
白上虎太郎（ふつう）,個人的な注目点を紹介するよ
ずんだもん（ノーマル）,私がよく利用する動画編集機能には大きな変更はないよ。
ずんだもん（ノーマル）,大問題は、今回が最後のIntel版mac対応バージョンになることだよ。
ずんだもん（ノーマル）,@@4
ずんだもん（ノーマル）,私のmac、寿命はあと2年!
ずんだもん（ノーマル）,@@5
@@5
```

### 仕組み

本ツールは、[Marpファイル](./sample/slide.md)内の HTMLコメント部分 [^1] を抽出し、[VOICEVOXのテキストファイル](https://voicevox.hiroshiba.jp/how_to_use/#%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AE%E8%AA%AD%E3%81%BF%E8%BE%BC%E3%81%BF)の形式に変換します。

[VOICEVOXのテキストファイル](https://voicevox.hiroshiba.jp/how_to_use/#%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AE%E8%AA%AD%E3%81%BF%E8%BE%BC%E3%81%BF)は、セリフが改行または半角コンマ(`,`)で区切られています。また、セリフの前にキャラクター名だけを区切って定義することにより、セリフの声を定義できます。[^2]

本ツールではメンテナンスを容易にするため、Marpファイルのコメントに直接キャラクター名を定義はせずに、**キャラクター記号**のみを定義します。

**キャラクター記号**の形式は、以下になります。(番号を`:`で囲んだ形式)

```text
:番号:
```

以下のMarpファイルのコメントを例にすると、

```markdown
<!-- Blender4.5 LTS のリリース候補版が、7月9日に公開されたよ -->
```

このセリフの音声を1番のキャラクターにする場合は、以下のようにセリフの**先頭**に、1番の**キャラクター記号**を追記します。

```markdown
<!-- :1:Blender4.5 LTS のリリース候補版が、7月9日に公開されたよ -->
```

**キャラクター記号** と **VOICEVOXのキャラクター名**との対応付けは、[設定ファイル](./sample/vox.json)で行います。

以下の設定ファイルの例では、1番と2番の2つのキャラクターの変換ルールが定義されています。

```json
{
  "1": "白上虎太郎（ふつう）",
  "2": "ずんだもん（ノーマル）"
}
```

[サンプルのMarpファイル](./sample/slide.md)では、**2つのキャラクター記号**を使って二人のキャラクターのセリフを定義しています。

```markdown
---
marp: true
theme: short
---

# Blender4.5 LTS リリース候補 <br>公開されたよ！

<!-- _class: first -->

<!-- :1:Blender4.5 LTS のリリース候補版が、7月9日に公開されたよ -->

---

<!-- _class: vcenter -->

## LTSとは

Long-term Support の略

2年間メンテナンスされる
バージョンのこと

<!-- :2:LTSとは、2年間メンテナンスされるバージョンのことだよ -->
<!-- 通常は約4ヶ月のみメンテナンスされるよ。 -->

---

...略...
```

変換結果は、以下のようになります。

Marpファイルのコメントの**キャラクター記号**は、実際の**キャラクター名**に変換されます。

また、変換結果内の`@@番号`の行は、スライドの区切りになります。
1枚目のスライドのセリフの終りには`@@1`、2枚目のスライドの終りには`@@2`が定義されます。

```shell
白上虎太郎（ふつう）,Blender4.5 LTS のリリース候補版が、7月9日に公開されたよ
@@1
ずんだもん（ノーマル）,LTSとは、2年間メンテナンスされるバージョンのことだよ
通常は約4ヶ月のみメンテナンスされるよ。
@@2
正式版リリースは 2025年7月15日だよ
@@3
白上虎太郎（ふつう）,個人的な注目点を紹介するよ
ずんだもん（ノーマル）,私がよく利用する動画編集機能には大きな変更はないよ。
大問題は、今回が最後のIntel版mac対応バージョンになることだよ。
@@4
私のmac、寿命はあと2年!
@@5
```

## 更新履歴

### v1.0.1

- `marp2vvtext`の`--config`オプションが未指定時は、marpファイルと同じディレクトリの`vox.json` を参照するように修正

### v1.0.0

- 3つのツールを提供

[^1]: ただし、`_class`などの[Directives](https://marpit.marp.app/directives?id=directives)のコメントは除く

[^2]: キャラクター名を指定すると、以降の行も同じキャラクターの声になります。そのため、セリフ行の先頭に毎回キャラクター名を定義する必要はありません。
