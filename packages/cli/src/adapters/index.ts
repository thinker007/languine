import type {
  Awaitable,
  PromptOptions,
  PromptResult,
  UpdateOptions,
  UpdateResult,
} from "../types.js";
import { typescriptPrompt, typescriptUpdate } from "./js.js";
import { jsonPrompt, jsonUpdate } from "./json.js";
import { markdownPrompt, markdownUpdate } from "./md.js";

interface Adapter {
  onPrompt: (options: PromptOptions) => Awaitable<PromptResult>;
  onUpdate: (options: UpdateOptions) => Awaitable<UpdateResult>;
}

export function getAdapter(format: string): Adapter | undefined {
  if (format === "ts" || format === "js") {
    return {
      onPrompt: typescriptPrompt,
      onUpdate: typescriptUpdate,
    };
  }

  if (format === "json" || format === "json5") {
    return {
      onPrompt: jsonPrompt,
      onUpdate: jsonUpdate,
    };
  }

  if (format === "md" || format === "mdx") {
    return {
      onPrompt: markdownPrompt,
      onUpdate: markdownUpdate,
    };
  }
}
