import { Biome, Distribution } from "@biomejs/js-api";

const biome = await Biome.create({
  distribution: Distribution.NODE,
});

export default {
  version: "1.0.0",
  locale: {
    source: "en",
    targets: ["de"],
  },
  files: {
    json: {
      include: ["locales/[locale].json"],
    },
  },
  openai: {
    model: "gpt-4-turbo",
  },
  hooks: {
    afterTranslate: ({ content, filePath }) => {
      const formatted = biome.formatContent(content.toString(), {
        filePath,
      });

      return formatted.content;
    },
  },
};
