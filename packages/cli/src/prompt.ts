import dedent from "dedent";
import type { PromptOptions } from "./types.js";

export const baseRequirements = dedent`
Translation Requirements:
- Maintain exact file structure, indentation, and formatting
- Provide natural, culturally-adapted translations that sound native
- Keep all technical identifiers unchanged
- Keep consistent capitalization, spacing, and line breaks
- Respect existing whitespace and newline patterns
- Never add space before a ! or ?
`;

export function createBasePrompt(text: string, options: PromptOptions) {
  return dedent`
        You are a professional translator working with ${options.format.toUpperCase()} files.
            
        Task: Translate the content below from ${options.contentLocale} to ${options.targetLocale}.
        ${options.config.instructions ?? ""}
        ${text}
    `;
}
