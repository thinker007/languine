import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { intro, outro, select, text } from "@clack/prompts";

export async function init() {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch (error) {
    outro(
      "Languine requires Git to track changes in translation keys and files. Please initialize a Git repository first.",
    );
    process.exit(1);
  }

  intro("Let's set up your i18n configuration");

  const sourceLanguage = (await select({
    message: "What is your source language?",
    options: [
      { value: "en", label: "English" },
      { value: "es", label: "Spanish" },
      { value: "fr", label: "French" },
      { value: "de", label: "German" },
    ],
  })) as string;

  const targetLanguages = (await text({
    message: "What languages do you want to translate to?",
    placeholder: "es, fr, de, zh, ja, pt",
    validate: (value) => {
      if (!value) return "Please enter at least one language";
      return;
    },
  })) as string;

  const filesDirectory = (await text({
    message: "Where should language files be stored?",
    placeholder: "src/locales",
    defaultValue: "src/locales",
    validate: () => undefined,
  })) as string;

  const fileFormat = (await select({
    message: "What format should language files use?",
    options: [
      { value: "ts", label: "TypeScript (.ts)" },
      { value: "json", label: "JSON (.json)" },
      { value: "po", label: "Portable Object (.po)" },
    ],
  })) as string;

  const model = (await select({
    message: "Which OpenAI model should be used for translations?",
    options: [
      { value: "gpt-4-turbo", label: "GPT-4 Turbo (Default)" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o mini" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    initialValue: "gpt-4-turbo",
  })) as string;

  const config = {
    version: require("../../package.json").version,
    locale: {
      source: sourceLanguage,
      targets: targetLanguages.split(",").map((l: string) => l.trim()),
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
    await fs.mkdir(path.join(process.cwd(), filesDirectory), {
      recursive: true,
    });

    const sourceFile = path.join(
      process.cwd(),
      `${filesDirectory}/${sourceLanguage}.${fileFormat}`,
    );
    if (
      !(await fs
        .access(sourceFile)
        .then(() => true)
        .catch(() => false))
    ) {
      await fs.writeFile(sourceFile, "", "utf-8");
    }

    const targetLangs = targetLanguages.split(",");
    for (const targetLang of targetLangs.map((l: string) => l.trim())) {
      const targetFile = path.join(
        process.cwd(),
        `${filesDirectory}/${targetLang}.${fileFormat}`,
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
