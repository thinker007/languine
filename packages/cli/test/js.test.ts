import { expect, test } from "vitest";
import { Config } from "../src/types.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MockLanguageModelV1 } from "ai/test";
import { javascript } from "../src/translators/js.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

test("JSON adapter: new", async () => {
  const result = await javascript.onNew({
    config: {} as unknown as Config,
    content: await readFile(path.join(dir, "resources/js-new.js")).then((res) =>
      res.toString(),
    ),
    format: "js",
    contentLocale: "en",
    targetLocale: "cn",
    model: new MockLanguageModelV1({
      defaultObjectGenerationMode: "json",
      async doGenerate(v) {
        await expect(
          (v.prompt.at(-1) as any).content[0].text,
        ).toMatchFileSnapshot("snapshots/js-new.prompt.txt");

        return {
          rawCall: { rawPrompt: null, rawSettings: {} },
          finishReason: "stop",
          usage: { promptTokens: 10, completionTokens: 20 },
          text: JSON.stringify([
            '"标题"',
            '"介绍"',
            "'在开始之前，请确保您具备以下条件：\\n一个 GitHub 账户'",
            "`您可以在自己的云基础设施上自托管 Midday，以便更好地控制您的数据。\\n    本指南将引导您完成设置 Midday 的整个过程。`",
            "`当前时间是 ${Date.now()}`",
          ]),
        };
      },
    }),
  });

  await expect(result.content).toMatchFileSnapshot("snapshots/js-new.js");
});
