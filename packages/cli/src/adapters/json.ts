import { createRecordPrompt } from "../prompt.js";
import type {
  PromptOptions,
  PromptResult,
  UpdateOptions,
  UpdateResult,
} from "../types.js";
import { extractChangedKeys } from "../utils.js";

export function jsonPrompt(options: PromptOptions): PromptResult {
  const sourceObj = JSON.parse(options.content);

  const keysToTranslate = options.force
    ? Object.keys(sourceObj)
    : extractChangedKeys(options.diff).addedKeys;

  if (keysToTranslate.length === 0) {
    return { type: "skip" };
  }

  const contentToTranslate: Record<string, string> = {};
  for (const key of keysToTranslate) {
    contentToTranslate[key] = sourceObj[key];
  }

  return {
    type: "success",
    prompt: createRecordPrompt(contentToTranslate, options),
  };
}

export function jsonUpdate(options: UpdateOptions): UpdateResult {
  const translatedObj = JSON.parse(options.promptResult);

  // Merge with existing translations if not force translating
  const finalObj = options.force
    ? translatedObj
    : {
        ...(options.content ? JSON.parse(options.content) : {}),
        ...translatedObj,
      };

  // Format the final content
  return {
    summary: `Translated ${Object.keys(translatedObj).length} ${options.force ? "total" : "new"} keys`,
    content: JSON.stringify(finalObj, null, 2),
  };
}
