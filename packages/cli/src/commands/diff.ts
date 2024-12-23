import { execSync } from "node:child_process";
import { intro, outro } from "@clack/prompts";
import chalk from "chalk";
import { getConfig } from "../utils.js";

export async function diff() {
  intro("Checking for changes in source locale file...");

  try {
    const config = await getConfig();

    // Get source locale file path from config
    const sourceLocale = config.locale.source;
    const [fileFormat] = Object.keys(config.files);
    const sourcePattern = config.files[fileFormat].include[0];
    const sourcePath = sourcePattern.replace("[locale]", sourceLocale);

    // Get git diff for source file
    const diff = execSync(`git diff HEAD -- ${sourcePath}`, {
      encoding: "utf-8",
    });

    if (!diff) {
      outro(chalk.yellow("No changes detected in source locale file."));
      process.exit(0);
    }

    // Extract changed/added/removed keys from diff
    const addedKeys = new Set<string>();
    const removedKeys = new Set<string>();

    for (const line of diff.split("\n")) {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        const match = line.match(/['"]([\w_.]+)['"]/);
        if (match) addedKeys.add(match[1]);
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        const match = line.match(/['"]([\w_.]+)['"]/);
        if (match) removedKeys.add(match[1]);
      }
    }

    // Remove keys that appear in both added and removed (these are modifications)
    for (const key of addedKeys) {
      if (removedKeys.has(key)) {
        addedKeys.delete(key);
        removedKeys.delete(key);
      }
    }

    if (addedKeys.size === 0 && removedKeys.size === 0) {
      outro(
        chalk.yellow("No translation keys were added, modified or removed."),
      );
      process.exit(0);
    }

    let message = "";
    if (addedKeys.size > 0) {
      message += chalk.green(
        `Found ${addedKeys.size} added translation key${addedKeys.size === 1 ? "" : "s"}\n`,
      );
    }
    if (removedKeys.size > 0) {
      message += chalk.red(
        `Found ${removedKeys.size} removed translation key${removedKeys.size === 1 ? "" : "s"}`,
      );
    }

    outro(message);
    return {
      addedKeys: Array.from(addedKeys),
      removedKeys: Array.from(removedKeys),
    };
  } catch (error) {
    outro(chalk.red("Failed to check for changes"));
    console.error(error);
    process.exit(1);
  }
}
