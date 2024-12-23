import fs from "node:fs/promises";
import path from "node:path";
import { createOpenAI } from "@ai-sdk/openai";
import { intro, outro, spinner } from "@clack/prompts";
import { generateText } from "ai";
import chalk from "chalk";
import dedent from "dedent";
import { prompt as defaultPrompt } from "../prompt.js";
import { getApiKey, getConfig } from "../utils.js";

export async function translate(targetLocale?: string) {
  intro("Starting translation process...");

  const config = await getConfig();

  const { source, targets } = config.locale;
  const locales = targetLocale ? [targetLocale] : targets;

  // Validate target locale if specified
  if (targetLocale && !targets.includes(targetLocale)) {
    outro(
      chalk.red(
        `Invalid target locale: ${targetLocale}. Available locales: ${targets.join(", ")}`,
      ),
    );
    process.exit(1);
  }

  // Initialize OpenAI
  const openai = createOpenAI({
    apiKey: await getApiKey("OpenAI", "OPENAI_API_KEY"),
  });

  const s = spinner();
  s.start("Translating to all target locales...");

  // Create translation tasks for all locales and file patterns
  const translationTasks = locales.flatMap((locale) =>
    Object.entries(config.files).flatMap(([format, { include }]) =>
      include.map(async (pattern) => {
        const sourcePath = pattern.replace("[locale]", source);
        const targetPath = pattern.replace("[locale]", locale);

        try {
          // Read source file
          let sourceContent = "";
          try {
            sourceContent = await fs.readFile(
              path.join(process.cwd(), sourcePath),
              "utf-8",
            );
          } catch (error) {
            // Create source file if it doesn't exist
            const sourceDir = path.dirname(
              path.join(process.cwd(), sourcePath),
            );
            await fs.mkdir(sourceDir, { recursive: true });
            await fs.writeFile(
              path.join(process.cwd(), sourcePath),
              "",
              "utf-8",
            );
          }

          // Prepare translation prompt
          const prompt = dedent`
            You are a professional translator working with ${format.toUpperCase()} files.
            
            Task: Translate the content below from ${source} to ${locale}.

            ${defaultPrompt}

            ${config.instructions ?? ""}

            Source content:
            ${sourceContent}

            Return only the translated content with identical structure.
          `;

          // Get translation from OpenAI
          const { text } = await generateText({
            model: openai(config.openai.model),
            prompt,
          });

          // Ensure target directory exists
          const targetDir = path.dirname(path.join(process.cwd(), targetPath));
          await fs.mkdir(targetDir, { recursive: true });

          // Write translated content
          await fs.writeFile(
            path.join(process.cwd(), targetPath),
            text,
            "utf-8",
          );

          return { locale, sourcePath, success: true };
        } catch (error) {
          return { locale, sourcePath, success: false, error };
        }
      }),
    ),
  );

  // Execute all translation tasks in parallel
  const results = await Promise.all(translationTasks);

  // Process results
  const failures = results.filter((r) => !r.success);

  if (failures.length > 0) {
    s.stop("Translation completed with errors");
    for (const failure of failures) {
      console.error(
        chalk.red(
          `Error translating ${failure.sourcePath} to ${failure.locale}:`,
        ),
        failure.error,
      );
    }
  } else {
    s.stop("Translation completed successfully");
  }

  outro(
    failures.length === 0
      ? chalk.green("All translations completed successfully!")
      : chalk.yellow(`Translation completed with ${failures.length} error(s)`),
  );
}
