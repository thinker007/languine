import { expect, test } from "vitest";
import { Config } from "../src/types.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MockLanguageModelV1 } from "ai/test";
import { json } from "../src/translators/json.js";
import { getPromptText } from "./test-utils.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

const translated = {
  search: "Updated",
  description: "Updated",
  nested: {
    description: "Updated",
    words: ["Updated", "Updated"],
  },
};

test("JSON adapter: new", async () => {
  const result = await json.onNew({
    config: {} as unknown as Config,
    content: await readFile(path.join(dir, "resources/json-new.json")).then(
      (res) => res.toString(),
    ),
    format: "json",
    contentLocale: "en",
    targetLocale: "cn",
    model: new MockLanguageModelV1({
      defaultObjectGenerationMode: "json",
      async doGenerate(v) {
        return {
          rawCall: { rawPrompt: null, rawSettings: {} },
          finishReason: "stop",
          usage: { promptTokens: 10, completionTokens: 20 },
          text: JSON.stringify(translated),
        };
      },
    }),
  });

  await expect(result.content).toMatchFileSnapshot("snapshots/json-new.json");
});

test("JSON adapter: diff", async () => {
  const result = await json.onUpdate({
    config: {} as unknown as Config,
    content: (
      await readFile(path.join(dir, "resources/json-diff.json"))
    ).toString(),
    previousTranslation: (
      await readFile(path.join(dir, "resources/json-diff.translated.json"))
    ).toString(),
    previousContent: (
      await readFile(path.join(dir, "resources/json-diff.previous.json"))
    ).toString(),
    format: "json",
    model: new MockLanguageModelV1({
      defaultObjectGenerationMode: "json",
      async doGenerate(v) {
        await expect(getPromptText(v.prompt)).toMatchFileSnapshot(
          "snapshots/json-diff.prompt.txt",
        );

        return {
          rawCall: { rawPrompt: null, rawSettings: {} },
          finishReason: "stop",
          usage: { promptTokens: 10, completionTokens: 20 },
          text: JSON.stringify({
            search: translated.search,
            nested: {
              description: translated.nested.description,
            },
          }),
        };
      },
    }),
    contentLocale: "en",
    targetLocale: "cn",
  });

  await expect(result.content).toMatchFileSnapshot("snapshots/json-diff.json");
});
