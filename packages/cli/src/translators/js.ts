import { generateObject } from "ai";
import { createRecordPrompt } from "../prompt.js";
import { extractChangedKeys } from "../utils.js";
import type { Translator } from "../types.js";

function parse(content: string) {
  return Function(
    `return ${content.replace(/export default |as const;/g, "")}`,
  )();
}

export const javascript: Translator = {
  async onUpdate(options) {
    const sourceObj = parse(options.content);

    const changes = extractChangedKeys(options.diff);
    // Parse the translated content
    let translatedObj: object = {};

    if (changes.addedKeys.length > 0) {
      // If force is true, translate everything. Otherwise only new keys
      const contentToTranslate: Record<string, string> = {};
      for (const key of changes.addedKeys) {
        contentToTranslate[key] = sourceObj[key];
      }

      const { object } = await generateObject({
        model: options.model,
        prompt: createRecordPrompt(contentToTranslate, options),
        output: "no-schema",
      });

      translatedObj = object as object;
    }

    const finalObj = {
      ...parse(options.previousTranslation),
      ...translatedObj,
    };

    for (const key of changes.removedKeys) {
      delete finalObj[key];
    }

    return {
      summary: `Translated ${Object.keys(translatedObj).length} new keys`,
      content: `export default ${JSON.stringify(finalObj, null, 2)} as const;\n`,
    };
  },
  async onNew(options) {
    const sourceObj = parse(options.content);

    const { object } = await generateObject({
      model: options.model,
      prompt: createRecordPrompt(sourceObj, options),
      output: "no-schema",
    });

    return {
      content: `export default ${JSON.stringify(object, null, 2)} as const;\n`,
    };
  },
};
