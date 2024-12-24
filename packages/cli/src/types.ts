export interface Config {
  version: string;
  locale: {
    source: string;
    targets: string[];
  };
  files: {
    [key: string]: {
      include: string[];
    };
  };
  openai: {
    model: string;
  };
  instructions?: string;
  hooks?: {
    afterTranslate?: (args: {
      content: string;
      filePath: string;
    }) => Promise<string>;
  };
}

export interface PromptOptions {
  format: string;

  targetLocale: string;
  sourceLocale: string;

  force: boolean;

  diff: string;
  content: string;

  config: Config;
}

export type PromptResult =
  | {
      type: "success";
      prompt: string;
    }
  | {
      type: "skip";
    };

export interface UpdateOptions {
  promptResult: string;
  prompt: Extract<PromptResult, { type: "success" }>;

  force: boolean;

  /**
   * Content to update (translated file)
   */
  content?: string;
}

export interface UpdateResult {
  /**
   * Text summary of updated changes
   */
  summary?: string;

  content: string;
}

export type Awaitable<T> = T | Promise<T>;
