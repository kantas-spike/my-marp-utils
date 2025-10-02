#!/usr/bin/env node

"use strict";
import { Marpit } from "@marp-team/marpit";
import fs from "node:fs";
import path from "node:path";
import { program } from "commander";
import { createRequire } from "node:module";
import { exec } from "node:child_process";

function getClipInfo(marpFilePath) {
  if (!fs.existsSync(marpFilePath)) {
    throw new Error(`Marpファイル(${marpFilePath})が存在しません。`);
  } else {
    const marpit = new Marpit();
    const data = fs.readFileSync(marpFilePath, "utf-8");
    const { html, _css, comments } = marpit.render(data, {
      htmlAsArray: true,
    });
    const clipInfoList = html
      .map((elm, idx) => {
        return {
          hasClip: elm.match(/class=["']wm["']/) !== null,
          slideNo: idx + 1,
          html: elm,
          cmment: comments[idx].map((elm) => elm.trimEnd()),
        };
      })
      .filter((elm) => {
        return elm.hasClip;
      });
    return clipInfoList;
  }
}

const program_name = "marp2cliptext";
const require = createRequire(import.meta.url);
const { version } = require("../package.json");

program
  .name(program_name)
  .version(version)
  .description(
    "Marpファイルからスライドに挿入するクリップ用のコメントを抽出し、テキストファイルに変換する"
  )
  .option(
    "-o, --output <output_dir>",
    "テキストファイルを出力するディレクトリパス"
  )
  .option(
    "--pdf",
    "出力したテキストファイルをcupsfilterを使ってPDFに変換する(macOS用)"
  )
  .option(
    "--delete-org-file",
    "PDFに変換時にオリジナルのテキストファイルを削除する"
  )
  .argument("<marp_file_path>", "原稿となるMarpファイルパス")
  .action((marp_file_path, options) => {
    try {
      const infoList = getClipInfo(path.resolve(marp_file_path));
      // console.log(infoList);

      // 出力ディレクトリが未指定時
      if (!options.output) {
        console.warn(`出力先ディレクトリを指定してください。`);
        process.exit(1);
      }

      const outputDir = path.resolve(options.output);
      if (fs.existsSync(outputDir)) {
        // 同名のファイルが存在する場合、エラー
        if (!fs.lstatSync(outputDir).isDirectory()) {
          console.warn(
            `指定された出力先ディレクトリと同名のファイル(${outputDir})が既に存在します。別の出力先ディレクトリを指定してください。`
          );
          process.exit(1);
        }
      } else {
        // 出力ディレクトリが存在しない場合、作成する
        fs.mkdirSync(outputDir, { recursive: true });
      }
      console.log(`${outputDir}にクリップ用コメントを出力...`);
      for (const info of infoList) {
        const fileName = info.slideNo.toString().padStart(2, "0") + ".txt";
        const outputFile = path.join(outputDir, fileName);
        fs.writeFileSync(outputFile, info.cmment.join("\n"));
        console.log(`  create ${fileName}...`);
        if (options.pdf) {
          const pdfFileName = path.basename(fileName, ".txt") + ".pdf";
          const outputPdfFile = path.join(outputDir, pdfFileName);
          let cupsOptions = "";
          if (options.deleteOrgFile) {
            cupsOptions += "-D ";
          }
          console.log(
            `  cupsutil ${cupsOptions} ${fileName} > ${pdfFileName}...`
          );
          exec(
            `/usr/sbin/cupsfilter ${cupsOptions} "${outputFile}" > "${outputPdfFile}"`,
            (err, stdout, stderr) => {
              if (err) {
                console.error(`PDF変換に失敗しました: ${err}`);
                return;
              }
            }
          );
        }
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
