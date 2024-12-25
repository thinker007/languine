import { generateObject } from "ai";
import { baseRequirements, createBasePrompt } from "../prompt.js";
import type { PromptOptions, Translator } from "../types.js";
import { diffLines } from "diff";
import { z } from "zod";
import dedent from "dedent";

function createRegex(quote: string, multiline = false) {
  return `${quote}(?:\\\\.|[^${quote}\\\\${multiline ? "" : "\\n"}])*${quote}`;
}

const quotesRegex = new RegExp(
  `${createRegex(`"`)}|${createRegex(`'`)}|${createRegex(`\``, true)}`,
  "g",
);

interface StringMatch {
  index: number;

  /**
   * content, including quotes
   */
  content: string;
}

/**
 * Get declared strings from code (e.g. "hello world" or `hello ${world}`)
 */
function getStrings(code: string) {
  let match = quotesRegex.exec(code);

  const strings: StringMatch[] = [];

  while (match) {
    strings.push({
      index: match.index,
      content: match[0],
    });

    match = quotesRegex.exec(code);
  }

  return strings;
}

function replaceStrings(
  code: string,
  strings: StringMatch[],
  replaces: string[],
) {
  let out = code;

  replaces.forEach((replace, i) => {
    const original = strings[i];
    const offset = out.length - code.length;

    out =
      out.slice(0, original.index + offset) +
      replace +
      out.slice(original.index + original.content.length + offset);
  });

  return out;
}

export const javascript: Translator = {
  // detect changes
  // translate changes
  // apply translated changes to previous translation (assuming line breaks are identical)
  async onUpdate(options) {
    const diff = diffLines(options.previousContent, options.content);
    const strings = getStrings(options.content);
    const previousTranslation = getStrings(options.previousTranslation);
    const toTranslate: StringMatch[] = [];

    let lineStartIdx = 0;
    diff.forEach((change) => {
      if (change.added) {
        const affected = strings.filter(
          (v) =>
            v.index >= lineStartIdx &&
            v.index < lineStartIdx + change.value.length,
        );

        toTranslate.push(...affected);
      }

      if (!change.removed) {
        lineStartIdx += change.value.length;
      }
    });

    let translated: string[] = [];

    if (toTranslate.length > 0) {
      const { object } = await generateObject({
        model: options.model,
        prompt: getPrompt(toTranslate, options),
        schema: z.array(z.string()),
      });

      translated = object;
    }

    const output = replaceStrings(
      options.previousTranslation,
      previousTranslation,
      strings.map((s, i) => {
        const j = toTranslate.indexOf(s);

        if (j !== -1) {
          return translated[j];
        }

        return previousTranslation[i].content;
      }),
    );

    return {
      summary: `Translated ${toTranslate.length} new keys`,
      content: output,
    };
  },
  async onNew(options) {
    const strings = getStrings(options.content);

    const { object } = await generateObject({
      model: options.model,
      prompt: getPrompt(strings, options),
      schema: z.array(z.string()),
    });

    return {
      content: replaceStrings(options.content, strings, object),
    };
  },
};

function getPrompt(strings: StringMatch[], options: PromptOptions) {
  const text = dedent`
    ${baseRequirements}
    - Preserve all object/property keys, syntax characters, and punctuation marks exactly
    - Only translate text content within quotation marks
    
    A list of javascript codeblocks, return the translated javascript string in a JSON array of string:`;
  const codeblocks = strings
    .map((v) => {
      return `\`\`\`${options.format}\n${v.content}\n\`\`\``;
    })
    .join("\n\n");

  return createBasePrompt(`${text}\n${codeblocks}`, options);
}
