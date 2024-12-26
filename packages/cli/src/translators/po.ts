import { generateObject } from "ai";
import dedent from "dedent";
import { z } from "zod";
import { baseRequirements, createBasePrompt } from "../prompt.js";
import type { PromptOptions, Translator } from "../types.js";

interface PoEntry {
  key: string;
  value: string;
  comments: string[];
}

function parsePoFile(content: string) {
  const entries: PoEntry[] = [];
  const lines = content.split("\n");
  let currentComments: string[] = [];
  let currentKey = "";
  let currentValue = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Collect comments
    if (trimmed.startsWith("#")) {
      currentComments.push(line);
      continue;
    }

    // On empty line, reset comments if we haven't started an entry
    if (!trimmed && !currentKey) {
      currentComments = [];
      continue;
    }

    if (trimmed.startsWith("msgid")) {
      if (currentKey) {
        entries.push({
          key: currentKey,
          value: currentValue,
          comments: currentComments,
        });
      }
      currentKey = trimmed.match(/msgid "(.*)"/)?.[1] ?? "";
      currentValue = "";
    } else if (trimmed.startsWith("msgstr")) {
      currentValue = trimmed.match(/msgstr "(.*)"/)?.[1] ?? "";
    } else if (!trimmed && currentKey) {
      entries.push({
        key: currentKey,
        value: currentValue,
        comments: currentComments,
      });
      currentKey = "";
      currentValue = "";
      currentComments = [];
    }
  }

  if (currentKey) {
    entries.push({
      key: currentKey,
      value: currentValue,
      comments: currentComments,
    });
  }

  return entries;
}

function stringifyPoFile(entries: PoEntry[]) {
  return entries
    .map(({ key, value, comments }) => {
      const commentLines =
        comments.length > 0 ? `${comments.join("\n")}\n` : "";
      return `${commentLines}msgid "${key}"\nmsgstr "${value}"`;
    })
    .join("\n\n");
}

export const po: Translator = {
  async onUpdate(options) {
    const sourceEntries = parsePoFile(options.content);
    const previousEntries = parsePoFile(options.previousContent);
    const previousTranslationEntries = parsePoFile(options.previousTranslation);

    const sourceMap = new Map(sourceEntries.map((entry) => [entry.key, entry]));
    const previousMap = new Map(
      previousEntries.map((entry) => [entry.key, entry]),
    );
    const prevTransMap = new Map(
      previousTranslationEntries.map((entry) => [entry.key, entry]),
    );

    const addedKeys = sourceEntries
      .filter(({ key, value }) => {
        const prev = previousMap.get(key);
        return !prev || prev.value !== value;
      })
      .map((entry) => entry.key);

    if (addedKeys.length === 0) {
      return {
        summary: "No new keys to translate",
        content: options.previousTranslation,
      };
    }

    const toTranslate = Object.fromEntries(
      addedKeys.map((key) => [key, sourceMap.get(key)!.value]),
    );

    const { object } = await generateObject({
      model: options.model,
      temperature: options.config.llm?.temperature ?? 0,
      prompt: getPrompt(JSON.stringify(toTranslate, null, 2), options),
      schema: z.object({
        items: z.array(z.string().describe("Translated string value")),
      }),
    });

    // Update translations while preserving order and comments
    const updatedEntries = sourceEntries.map(({ key, comments }) => {
      const translationIndex = addedKeys.indexOf(key);
      const value =
        translationIndex !== -1
          ? object.items[translationIndex]
          : (prevTransMap.get(key)?.value ?? "");

      return { key, value, comments };
    });

    return {
      summary: `Translated ${addedKeys.length} new keys`,
      content: stringifyPoFile(updatedEntries),
    };
  },

  async onNew(options) {
    const sourceEntries = parsePoFile(options.content);
    const sourceStrings = Object.fromEntries(
      sourceEntries.map((entry) => [entry.key, entry.value]),
    );

    const { object } = await generateObject({
      model: options.model,
      prompt: getPrompt(JSON.stringify(sourceStrings, null, 2), options),
      temperature: options.config.llm?.temperature ?? 0,
      schema: z.object({
        items: z.array(z.string().describe("Translated string value")),
      }),
    });

    const translatedEntries = sourceEntries.map((entry, index) => ({
      ...entry,
      value: object.items[index],
    }));

    return {
      content: stringifyPoFile(translatedEntries),
    };
  },
};

function getPrompt(base: string, options: PromptOptions) {
  const text = dedent`
    ${baseRequirements}
    - Preserve all msgid values exactly as they appear
    - Only translate the msgstr values, not the msgid values
    - Return translations as a JSON array of strings in the same order as input
    - Maintain all format specifiers like %s, %d, etc. in the exact same order
    - Preserve any HTML tags or special formatting in the strings
  `;

  return createBasePrompt(`${text}\n${base}`, options);
}