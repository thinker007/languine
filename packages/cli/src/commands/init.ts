import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { intro, outro, select, text } from "@clack/prompts";

export async function init() {
  // Check if we're in a git repository
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch (error) {
    outro(
      "Languine requires Git to track changes in translation keys and files. Please initialize a Git repository first.",
    );
    process.exit(1);
  }

  intro("Let's set up your i18n configuration");

  const sourceLanguage = await select({
    message: "What is your source language?",
    options: [
      { value: "en_US", label: "English (US)" },
      { value: "es_ES", label: "Spanish (ES)" },
      { value: "fr_FR", label: "French (FR)" },
      { value: "de_DE", label: "German (DE)" },
    ],
  });

  const targetLanguages = await text({
    message: "What languages do you want to translate to?",
    placeholder: "es,fr,de,zh,ja,pt",
    validate: (value) => {
      if (!value) return "Please enter at least one language";

      const codes = value.split(",").map((code) => code.trim().toLowerCase());
      const validCodes = new Set([
        "es",
        "fr",
        "de",
        "it",
        "pt",
        "ru",
        "zh",
        "ja",
        "ko",
        "ar",
        "hi",
        "af",
        "bg",
        "bn",
        "ca",
        "cs",
        "cy",
        "da",
        "el",
        "en",
        "et",
        "fa",
        "fi",
        "ga",
        "gu",
        "he",
        "hr",
        "hu",
        "id",
        "kn",
        "lt",
        "lv",
        "mk",
        "ml",
        "mr",
        "ms",
        "mt",
        "nl",
        "no",
        "pa",
        "pl",
        "ro",
        "sk",
        "sl",
        "sq",
        "sr",
        "sv",
        "sw",
        "ta",
        "te",
        "th",
        "tr",
        "uk",
        "ur",
        "vi",
      ]);

      const invalidCodes = codes.filter((code) => !validCodes.has(code));
      if (invalidCodes.length > 0) {
        return `Invalid language code(s): ${invalidCodes.join(", ")}`;
      }
      return;
    },
  });

  const filesDirectory = await text({
    message: "Where should language files be stored?",
    placeholder: "src/locales",
    defaultValue: "src/locales",
    validate: () => undefined,
  });

  const fileFormat = await select({
    message: "What format should language files use?",
    options: [
      { value: "ts", label: "TypeScript (.ts)" },
      { value: "json", label: "JSON (.json)" },
    ],
  });

  const model = await select({
    message: "Which OpenAI model should be used for translations?",
    options: [
      { value: "gpt-4o", label: "GPT-4o  (Default)" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-4o-mini", label: "GPT-4o mini" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    initialValue: "gpt-4o",
  });

  const config = {
    version: require("@midday/i18n/package.json").version,
    locale: {
      source: sourceLanguage,
      targets: targetLanguages.split(",").map((l) => l.trim()),
    },
    files: {
      [fileFormat]: {
        include: [`${filesDirectory}/[locale].${fileFormat}`],
      },
    },
    openai: {
      model: model,
    },
  };

  try {
    // Create locales directory if it doesn't exist
    await fs.mkdir(path.join(process.cwd(), filesDirectory), {
      recursive: true,
    });

    // Create source language file if it doesn't exist
    const sourceFile = path.join(
      process.cwd(),
      `${filesDirectory}/${String(sourceLanguage)}.${String(fileFormat)}`,
    );
    if (
      !(await fs
        .access(sourceFile)
        .then(() => true)
        .catch(() => false))
    ) {
      await fs.writeFile(sourceFile, "", "utf-8");
    }

    // Create target language files if they don't exist
    const targetLangs =
      typeof targetLanguages === "string" ? targetLanguages.split(",") : [];
    for (const targetLang of targetLangs.map((l: string) => l.trim())) {
      const targetFile = path.join(
        process.cwd(),
        `${filesDirectory}/${String(targetLang)}.${String(fileFormat)}`,
      );
      if (
        !(await fs
          .access(targetFile)
          .then(() => true)
          .catch(() => false))
      ) {
        await fs.writeFile(targetFile, "", "utf-8");
      }
    }

    // Write config file
    await fs.writeFile(
      path.join(process.cwd(), "languine.json"),
      JSON.stringify(config, null, 2),
    );
    outro("Configuration file and language files created successfully!");
  } catch (error) {
    outro("Failed to create config and language files");
    process.exit(1);
  }
}
