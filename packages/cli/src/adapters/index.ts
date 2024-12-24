import type {
  Awaitable,
  PromptOptions,
  PromptResult,
  UpdateOptions,
  UpdateResult,
} from "../types.js";
import { typescriptPrompt, typescriptUpdate } from "./js.js";
import { jsonPrompt, jsonUpdate } from "./json.js";

interface Adapter {
  onPrompt: (options: PromptOptions) => Awaitable<PromptResult>;
  onUpdate: (options: UpdateOptions) => Awaitable<UpdateResult>;
}

/**
 * Get adapter from file extension/format
 *
 * This will lazy-load the adapters to reduce memory usage and improve server performance
 */
export async function getAdapter(format: string): Promise<Adapter | undefined> {
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
    const { markdownPrompt, markdownUpdate } = await import("./md.js");

    return {
      onPrompt: markdownPrompt,
      onUpdate: markdownUpdate,
    };
  }
}
