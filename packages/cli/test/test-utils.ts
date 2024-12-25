import type { LanguageModelV1Prompt } from "ai";

export function getPromptText(v: LanguageModelV1Prompt) {
  const content = v.at(-1)?.content;
  if (!content || !Array.isArray(content)) return content;

  return content
    .filter((v) => v.type === "text")
    .map((v) => v.text)
    .join("\n");
}
