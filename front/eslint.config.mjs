// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-config-prettier/flat";

// 対象は .claude/rules/jsdoc.md の glob に対応（front からの相対パス）。
// TS ソース（composables / server / lib / middleware）+ Vue コンポーネント（components）。
const JSDOC_TARGETS = [
  "composables/**/*.ts",
  "server/**/*.ts",
  "lib/**/*.ts",
  "middleware/**/*.ts",
  "components/**/*.vue",
];

export default withNuxt(
  // JSDoc 規約（TSDoc スタイル）の機械的に判定できる部分を強制する。
  // 有効ルールの唯一の真実はこのブロック。方針の根拠は .claude/rules/jsdoc.md。
  {
    files: JSDOC_TARGETS,
    plugins: { jsdoc },
    // TS 前提。型は JSDoc ではなくシグネチャに委ねる。
    settings: { jsdoc: { mode: "typescript" } },
    rules: {
      // 型の再掲を禁止（TS シグネチャが型の唯一の真実）。
      "jsdoc/no-types": "error",
      // JSDoc ブロックを持つ関数は全引数を @param で説明する。
      // 分割代入 props は型が真実なので props.x 単位には展開しない。
      "jsdoc/require-param": [
        "error",
        { checkDestructured: false, checkDestructuredRoots: false },
      ],
      "jsdoc/require-param-description": "error",
      // @param 名と実引数名を突き合わせる（名前ズレ・順序・過不足を検出）。
      "jsdoc/check-param-names": "error",
      // 返り値がある関数は @returns に意味を書く（.vue コンポーネントは後続ブロックで除外）。
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-description": "error",
      // 書いた JSDoc の体裁を整える。
      "jsdoc/check-alignment": "warn",
      "jsdoc/no-multi-asterisks": "warn",
      // require-jsdoc は行コメントを誤検知するため未採用。ブロックの有無・質はレビューで確認する。
    },
  },
  {
    // Vue コンポーネント（テンプレートを描画する .vue）は @returns を要求しない
    // （Next.js 版の「JSX を返す .tsx を除外」と同じ意図）。
    // .ts の composable / lib / server では @returns 必須のまま。
    files: ["components/**/*.vue"],
    rules: {
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-description": "off",
    },
  },
  {
    // Vue 3 は複数ルートノード（フラグメント）を正式サポートするため、
    // Vue 2 由来の no-multiple-template-root は無効化する（Nuxt ページで多用する）。
    files: ["**/*.vue"],
    rules: { "vue/no-multiple-template-root": "off" },
  },
  // Prettier と競合する整形系ルールを無効化する。上書きが効くよう最後に置く。
  prettier,
);
