import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { intro, outro } from "@clack/prompts";
import chalk from "chalk";
import type { LanguineConfig } from "../types.js";

export async function diff() {
  intro("Checking for changes in source locale file...");

  try {
    // Read config file
    const configPath = path.join(process.cwd(), "languine.json");
    let config: LanguineConfig;

    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(configContent);
    } catch (error) {
      outro(
        chalk.red("Could not find languine.json. Run 'languine init' first."),
      );
      process.exit(1);
    }

    // Get source locale file path from config
    const sourceLocale = config.locale.source;
    const [fileFormat] = Object.keys(config.files);
    const sourcePattern = config.files[fileFormat].include[0];
    const sourcePath = sourcePattern.replace("[locale]", sourceLocale);
    console.log(sourcePath);
    // Get git diff for source file
    const diff = execSync(`git diff HEAD -- ${sourcePath}`, {
      encoding: "utf-8",
    });

    if (!diff) {
      outro(chalk.yellow("No changes detected in source locale file."));
      process.exit(0);
    }

    // Extract changed/added/removed keys from diff
    const addedKeys: string[] = [];
    const removedKeys: string[] = [];

    for (const line of diff.split("\n")) {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        const match = line.match(/['"]([\w_.]+)['"]/);
        if (match) addedKeys.push(match[1]);
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        const match = line.match(/['"]([\w_.]+)['"]/);
        if (match) removedKeys.push(match[1]);
      }
    }

    if (addedKeys.length === 0 && removedKeys.length === 0) {
      outro(
        chalk.yellow("No translation keys were added, modified or removed."),
      );
      process.exit(0);
    }

    let message = "";
    if (addedKeys.length > 0) {
      message += chalk.green(
        `Found ${addedKeys.length} added/modified translation keys\n`,
      );
    }
    if (removedKeys.length > 0) {
      message += chalk.red(
        `Found ${removedKeys.length} removed translation keys`,
      );
    }

    outro(message);
    return { addedKeys, removedKeys };
  } catch (error) {
    outro(chalk.red("Failed to check for changes"));
    console.error(error);
    process.exit(1);
  }
}
