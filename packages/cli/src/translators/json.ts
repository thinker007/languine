import { generateObject } from "ai";
import dedent from "dedent";
import { baseRequirements, createBasePrompt } from "../prompt.js";
import type { PromptOptions, Translator } from "../types.js";

export const json: Translator = {
  async onUpdate(options) {
    const sourceObj = JSON.parse(options.content);
    const previousObj = JSON.parse(options.previousContent);
    const changes = extractChangedKeys(previousObj, sourceObj);

    let translated: unknown | undefined;
    if (changes.addedKeys.length > 0) {
      translated = await generateObject({
        model: options.model,
        temperature: options.config.llm?.temperature ?? 0,
        prompt: getPrompt(
          JSON.stringify(
            getContentToTranslate(sourceObj, changes.addedKeys),
            null,
            2,
          ),
          options,
        ),
        output: "no-schema",
      }).then((res) => res.object);
    }

    let output = JSON.parse(options.previousTranslation);

    applyRemoves(output, changes.removedKeys);
    if (typeof translated === "object" && translated) {
      applyAdds(output, translated as Record<string, unknown>);
    } else {
      output = translated;
    }

    return {
      summary: `Translated ${changes.addedKeys.length} new keys`,
      content: JSON.stringify(output, null, 2),
    };
  },
  async onNew(options) {
    const { object } = await generateObject({
      model: options.model,
      prompt: getPrompt(options.content, options),
      temperature: options.config.llm?.temperature ?? 0,
      output: "no-schema",
    });

    return {
      content: JSON.stringify(object, null, 2),
    };
  },
};

/**
 * extract updated keys of object
 */
export function extractChangedKeys(
  previous: Record<string, unknown>,
  updated: Record<string, unknown>,
) {
  const addedKeys: string[][] = [];
  const removedKeys: string[][] = [];

  for (const key of Object.keys(previous)) {
    if (!(key in updated)) {
      removedKeys.push([key]);
      continue;
    }

    if (previous[key] === updated[key]) continue;

    if (
      previous[key] !== null &&
      updated[key] !== null &&
      typeof previous[key] === "object" &&
      typeof updated[key] === "object"
    ) {
      const changes = extractChangedKeys(
        previous[key] as Record<string, unknown>,
        updated[key] as Record<string, unknown>,
      );

      for (const v of [...changes.addedKeys, ...changes.removedKeys]) {
        v.unshift(key);
      }

      addedKeys.push(...changes.addedKeys);
      removedKeys.push(...changes.removedKeys);
    } else {
      addedKeys.push([key]);
      removedKeys.push([key]);
    }
  }

  for (const key of Object.keys(updated)) {
    if (!(key in previous)) addedKeys.push([key]);
  }

  return {
    addedKeys,
    removedKeys,
  };
}

function applyAdds(
  obj: Record<string, unknown>,
  translated: Record<string, unknown>,
) {
  for (const key of Object.keys(translated)) {
    if (typeof translated[key] === "object") {
      obj[key] ??= {};
      applyAdds(
        obj[key] as Record<string, unknown>,
        translated[key] as Record<string, unknown>,
      );
    } else {
      obj[key] = translated[key];
    }
  }

  return obj;
}

function applyRemoves(
  previous: Record<string, unknown>,
  removedKeys: string[][],
) {
  for (const key of removedKeys) {
    let obj = previous;

    for (let i = 0; i < key.length; i++) {
      if (i !== key.length - 1) {
        obj = obj[key[i]] as Record<string, unknown>;
      } else {
        delete obj[key[i]];
      }
    }
  }
}

function getContentToTranslate(
  updated: Record<string, unknown>,
  addedKeys: string[][],
): unknown {
  if (typeof updated !== "object") return updated;

  const obj = updated as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of addedKeys) {
    let target = out;
    let value = obj;

    for (let i = 0; i < key.length; i++) {
      if (i !== key.length - 1) {
        if (!(key[i] in value)) break;

        value = value[key[i]] as Record<string, unknown>;

        target[key[i]] ??= {};
        target = target[key[i]] as Record<string, unknown>;
      } else {
        target[key[i]] = value[key[i]];
      }
    }
  }

  return out;
}

function getPrompt(json: string, options: PromptOptions) {
  const text = dedent`
    ${baseRequirements}
    - Only translate text content within quotation marks
    - Preserve all object/property keys, syntax characters, and punctuation marks exactly
    - Retain all code elements like variables, functions, and control structures
    - Exclude any translator notes, comments or explanatory text
    - Match source file's JSON/object structure precisely
    - Handle special characters and escape sequences correctly
    
    Source content (JSON), Return only the translated content with identical structure:
    `;

  return createBasePrompt(`${text}\n${json}`, options);
}
