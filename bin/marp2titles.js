#!/usr/bin/env node

"use strict";
import { Marpit } from "@marp-team/marpit";
import fs from "node:fs";
import path from "node:path";
import { program } from "commander";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";

function getTitleInfo(marpFilePath) {
  if (!fs.existsSync(marpFilePath)) {
    throw new Error(`Marpファイル(${marpFilePath})が存在しません。`);
  } else {
    const marpit = new Marpit();
    const data = fs.readFileSync(marpFilePath, "utf-8");
    const { html, _css, _comments } = marpit.render(data, {
      htmlAsArray: true,
    });
    // const titleInfo = {};
    const titleInfo = html
      .map((elm, idx) => {
        // elmをパースしdom取得
        const dom = JSDOM.fragment(elm);
        // domから最初のH1 or H2を取得
        let title = "no title";
        const titleElm = dom.querySelector("h1,h2");
        if (titleElm) {
          title = titleElm.textContent;
        }
        return {
          title,
          slideNo: idx + 1,
        };
      })
      .reduce((info, elm) => {
        info[elm.slideNo] = elm.title;
        return info;
      }, {});
    //console.log(titleInfo);
    return titleInfo;
  }
}

const program_name = "marp2titles";
const require = createRequire(import.meta.url);
const { version } = require("../package.json");

program
  .name(program_name)
  .version(version)
  .description("Marpファイルからスライドのタイトル一覧を取得する")
  .option("-o, --output <output_file>", "タイトル一覧を出力するファイルパス")
  .option("--force", "出力先ファイルが既に存在する場合に上書きする")
  .argument("<marp_file_path>", "原稿となるMarpファイルパス")
  .action((marp_file_path, options) => {
    try {
      const info = getTitleInfo(path.resolve(marp_file_path));
      // console.log(JSON.stringify(info, null, "    "));

      // 出力ディレクトリが未指定時
      if (!options.output) {
        console.warn(`出力先のファイルパスを指定してください。`);
        process.exit(1);
      }

      const outputPath = path.resolve(options.output);
      if (fs.existsSync(outputPath)) {
        if (options.force) {
          console.warn(
            `上書きオプションが指定されたため、ファイル(${outputPath})を上書きします。`
          );
        } else {
          console.warn(
            `指定された出力ファイルと同名のファイル(${outputPath})が既に存在するため処理を終了します。`
          );
          process.exit(1);
        }
      }
      fs.writeFileSync(outputPath, JSON.stringify(info, null, "    "));
      console.info(`タイトル一覧を作成しました。: ${outputPath}`);
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
