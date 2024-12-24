import { createRecordPrompt } from "../prompt.js";
import type {
  PromptOptions,
  PromptResult,
  UpdateOptions,
  UpdateResult,
} from "../types.js";
import { extractChangedKeys } from "../utils.js";

export function typescriptPrompt(options: PromptOptions): PromptResult {
  // Parse source content
  const sourceObj = Function(
    `return ${options.content.replace(/export default |as const;/g, "")}`,
  )();

  const keysToTranslate = options.force
    ? Object.keys(sourceObj)
    : extractChangedKeys(options.diff).addedKeys;

  if (keysToTranslate.length === 0) {
    return { type: "skip" };
  }

  // If force is true, translate everything. Otherwise only new keys
  const contentToTranslate: Record<string, string> = {};
  for (const key of keysToTranslate) {
    contentToTranslate[key] = sourceObj[key];
  }

  return {
    type: "success",
    prompt: createRecordPrompt(contentToTranslate, options),
  };
}

export function typescriptUpdate(options: UpdateOptions): UpdateResult {
  // Parse the translated content
  const translatedObj = Function(
    `return ${options.promptResult.replace(/as const;?/g, "")}`,
  )();

  // Merge with existing translations if not force translating
  const finalObj = options.force
    ? translatedObj
    : {
        ...(options.content
          ? Function(
              `return ${options.content.replace(/export default |as const;/g, "")}`,
            )()
          : {}),
        ...translatedObj,
      };

  return {
    summary: `Translated ${Object.keys(translatedObj).length} ${options.force ? "total" : "new"} keys`,
    content: `export default ${JSON.stringify(finalObj, null, 2)} as const;\n`,
  };
}
