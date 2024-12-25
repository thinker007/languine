import { generateObject, generateText } from "ai";
import dedent from "dedent";
import { diffLines } from "diff";
import { z } from "zod";
import { baseRequirements, createBasePrompt } from "../prompt.js";
import type { PromptOptions, Translator } from "../types.js";

function extractDiff(pervious: string, content: string) {
  const contentLines = content.split("\n");
  const diff = diffLines(pervious, content, { oneChangePerToken: true });
  const added: number[] = [];
  const removed: number[] = [];
  const translate: number[] = [];

  diff.forEach((change, i) => {
    if (change.added) {
      added.push(i);

      // translate only non-empty lines
      if (change.value.trim().length > 0) translate.push(i);
    }

    if (change.removed) {
      removed.push(i);
    }
  });

  return {
    contentLines,
    diff,
    added,
    removed,
    translate,
  };
}

// docs usually have a context, it's better to provide the full-context of original text to help AI
export const markdown: Translator = {
  async onUpdate(options) {
    const parsedDiff = extractDiff(options.previousContent, options.content);
    const linesToTranslate = parsedDiff.translate;

    const { object: arr } = await generateObject({
      model: options.model,
      schema: z.array(z.string()),
      prompt: getPrompt(
        `
Translate only ${linesToTranslate.map((num) => `line ${num + 1}`).join(", ")}, and return in the form of a JSON array like:
${JSON.stringify(linesToTranslate.map((num) => `translated content of line ${num + 1}`))}

Source Content:
${options.content}`,
        options,
      ),
    });

    const lines = options.previousTranslation.split("\n");

    parsedDiff.diff.forEach((change, lineIdx) => {
      if (change.added) {
        const i = parsedDiff.translate.indexOf(lineIdx);

        lines.splice(
          lineIdx,
          0,
          i === -1 ? parsedDiff.contentLines[lineIdx] : arr[i],
        );
      }

      if (change.removed) {
        lines.splice(lineIdx, 1);
      }
    });

    return {
      summary: `Translated ${arr.length} lines`,
      content: lines.join("\n"),
    };
  },
  async onNew(options) {
    const { text } = await generateText({
      model: options.model,
      prompt: getPrompt(
        `Return only the translated content
            
Source Content:
${options.content}`,
        options,
      ),
    });

    return {
      content: text,
    };
  },
};

function getPrompt(base: string, options: PromptOptions) {
  const text = dedent`
    ${baseRequirements}
    - Only translate frontmatter, and text content (including those in HTML/JSX)
    - Keep original code comments, line breaks, code, and codeblocks
    - Retain all code elements like variables, functions, and control structures
    - Respect existing whitespace and newline patterns
  `;

  return createBasePrompt(`${text}\n${base}`, options);
}
