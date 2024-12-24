import type {
  PromptOptions,
  PromptResult,
  UpdateOptions,
  UpdateResult,
} from "../types.js";
import { createBasePrompt } from "../prompt.js";

function extractDiff(diff: string) {
  const added: number[] = [];
  const removed: number[] = [];
  const lines = diff.split("\n");

  lines.forEach((line, i) => {
    if (line.startsWith("+") && !line.startsWith("+++")) added.push(i);
    else if (line.startsWith("-") && !line.startsWith("---")) removed.push(i);
  });

  return { added, removed };
}

type ModifiedPromptResult = PromptResult & {
  parsedDiff?: ReturnType<typeof extractDiff>;
};

// TODO: find a better way to translate markdown diffs
// docs usually have a context, it's better to provide the full-context of original text to help AI
export function markdownPrompt(options: PromptOptions): ModifiedPromptResult {
  let resultPrompt = "Return only the translated content";
  let parsedDiff: ReturnType<typeof extractDiff> | undefined;

  if (!options.force) {
    parsedDiff = extractDiff(options.content);
    const lineNumbers = parsedDiff.added.map((num) => num + 1);

    if (lineNumbers.length === 0) return { type: "skip" };

    resultPrompt = `Translate only ${lineNumbers.map((num) => `line ${num}`).join(", ")}, and return in the form of a JSON array like:
    ${JSON.stringify(lineNumbers.map((num) => `translated content of line ${num}`))}
    \`\`\`
    `;
  }

  return {
    type: "success",
    parsedDiff,
    prompt: createBasePrompt(
      `
    Translation Requirements:
    - Only translate frontmatter, and text content (including those in HTML/JSX)
    - Keep original line breaks, code and codeblocks
    - Keep consistent capitalization, and spacing
    - Provide natural, culturally-adapted translations that sound native
    - Retain all code elements like variables, functions, and control structures
    - Keep any code comments
    - Handle special characters and escape sequences correctly
    - Respect existing whitespace and newline patterns
    - Keep all technical identifiers unchanged
    - ${resultPrompt}.

    Source content:
   ${options.content}
  `,
      options,
    ),
  };
}

export function markdownUpdate(options: UpdateOptions): UpdateResult {
  const { parsedDiff } = options.prompt as ModifiedPromptResult;

  if (options.force || !parsedDiff) {
    return { content: options.promptResult };
  }

  const lines = options.content?.split("\n") ?? [];
  const arr = JSON.parse(options.promptResult) as string[];
  let offset = 0;
  arr.forEach((translated, i) => {
    const lineNum = parsedDiff.added[i];

    // perform addition
    lines.splice(offset + lineNum, 0, translated);
    offset++;
  });

  for (const lineNum of parsedDiff.removed) {
    lines.splice(offset + lineNum, 1);
    offset--;
  }

  return {
    summary: `Translated ${arr.length} lines`,
    content: lines.join("\n"),
  };
}
