#!/usr/bin/env node

"use strict";
import { Marpit } from "@marp-team/marpit";
import fs from "node:fs";
import path from "node:path";
import { program } from "commander";

function getVoxConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`設定ファイル(${configPath})が存在しません。`);
  } else {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
}

function getMarpComments(marpFilePath) {
  if (!fs.existsSync(marpFilePath)) {
    throw new Error(`Marpファイル(${marpFilePath})が存在しません。`);
  } else {
    const marpit = new Marpit();
    const data = fs.readFileSync(marpFilePath, "utf-8");
    const { _html, _css, comments } = marpit.render(data);
    return comments;
  }
}

function convertCommentsToVoxTexts(marpComments, voxConfig) {
  const textsForVoicevox = [];
  let pageNo = 1;
  const pattern = /^:([\d+]):/;
  for (const commentsInPage of marpComments) {
    let commentNo = 1;
    for (const cmt of commentsInPage) {
      const match = pattern.exec(cmt);
      let voxText = cmt;
      if (match) {
        const placeholder = match[0];
        const characterNo = match[1];
        let voiceName = "";
        if (characterNo in voxConfig) {
          voiceName = voxConfig[characterNo] + ",";
        } else {
          console.warn(
            `不明なキャラクター番号(${characterNo})が検出されました。: ${pageNo}頁-${commentNo}番目`,
          );
        }
        voxText = cmt.replace(placeholder, voiceName);
      }
      textsForVoicevox.push(voxText);
      commentNo += 1;
    }
    textsForVoicevox.push(`@@${pageNo}`);
    pageNo += 1;
  }
  return textsForVoicevox;
}

const program_name = "marp2vvtext";

program
  .name(program_name)
  .description(
    "Marpファイルからコメントを抽出し、VOICEVOXで読み込み可能なテキストに変換する",
  )
  .option(
    "-c, --config <config_path>",
    "音声キャラクターの設定ファイルパス",
    "./vox.json",
  )
  .option(
    "-o, --output <output_path>",
    "VOICEVOX用テキストファイルを保存するファイルパス. 本オプション未指定時は標準出力に変換結果を出力する",
  )
  .argument("<marp_file_path>", "原稿となるMarpファイルパス")
  .action((marp_file_path, options) => {
    try {
      const voxConfig = getVoxConfig(path.resolve(options.config));
      const comments = getMarpComments(path.resolve(marp_file_path));
      const voxTexts = convertCommentsToVoxTexts(comments, voxConfig);
      let writeStream = process.stdout;
      if (options.output) {
        const outputPath = path.resolve(options.output);
        if (fs.existsSync(outputPath)) {
          console.warn(
            `出力先ファイルが既に存在するため処理を中止しました。: ${outputPath}`,
          );
          process.exit(1);
        } else {
          writeStream = fs.createWriteStream(outputPath, { encoding: "utf8" });
        }
      }
      try {
        for (const text of voxTexts) {
          writeStream.write(text + "\n");
        }
      } finally {
        writeStream.end();
      }
    } catch (err) {
      console.error(err);
      process.exit(-1);
    }
  });

program.exitOverride((err) => {
  let args = program.args || [];
  if (!(args.includes("-h") || args.includes("--help"))) {
    console.error(""); // 空行
    program.outputHelp();
    process.exit(err.exitCode);
  }
});

program.parse();
