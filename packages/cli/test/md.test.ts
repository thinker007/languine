import { getPromptText } from "./test-utils.js";
import { expect, test } from "vitest";
import { markdown } from "../src/translators/md.js";
import { Config } from "../src/types.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MockLanguageModelV1 } from "ai/test";

const dir = path.dirname(fileURLToPath(import.meta.url));

test("markdown adapter: new", async () => {
  const result = await markdown.onNew({
    config: {} as unknown as Config,
    content: await readFile(path.join(dir, "resources/md-new.md")).then((res) =>
      res.toString(),
    ),
    format: "mdx",
    contentLocale: "en",
    targetLocale: "cn",
    model: new MockLanguageModelV1({
      defaultObjectGenerationMode: "json",
      doGenerate: async () => ({
        rawCall: { rawPrompt: null, rawSettings: {} },
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20 },
        text: `你好，世界，这是一个用于测试翻译的测试文档。`,
      }),
    }),
  });

  await expect(result.content).toMatchFileSnapshot("snapshots/md-new.md");
});

test("markdown adapter: diff", async () => {
  const result = await markdown.onUpdate({
    config: {} as unknown as Config,
    content: (
      await readFile(path.join(dir, "resources/md-diff.md"))
    ).toString(),
    previousTranslation: (
      await readFile(path.join(dir, "resources/md-diff.translated.md"))
    ).toString(),
    previousContent: (
      await readFile(path.join(dir, "resources/md-diff.previous.md"))
    ).toString(),
    format: "md",
    model: new MockLanguageModelV1({
      defaultObjectGenerationMode: "json",
      async doGenerate(v) {
        await expect(getPromptText(v.prompt)).toMatchFileSnapshot(
          "snapshots/md-diff.prompt.txt",
        );

        return {
          rawCall: { rawPrompt: null, rawSettings: {} },
          finishReason: "stop",
          usage: { promptTokens: 10, completionTokens: 20 },
          text: `["你好，世界，这是一个用于测试翻译的测试文档。","<div>你好，世界</div>"]`,
        };
      },
    }),
    contentLocale: "en",
    targetLocale: "cn",
  });

  await expect(result.content).toMatchFileSnapshot("snapshots/md-diff.md");
});
