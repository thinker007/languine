import type {
  PromptOptions,
  PromptResult,
  UpdateOptions,
  UpdateResult,
} from "../types.js";

export function markdownPrompt(options: PromptOptions): PromptResult {
  return { type: "skip" };
}

export function markdownUpdate(options: UpdateOptions): UpdateResult {
  return {
    content: options.content ?? "",
  };
}
