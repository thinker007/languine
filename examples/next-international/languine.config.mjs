export default {
  version: "0.5.6",
  locale: {
    source: "en",
    targets: ["fr"],
  },
  files: {
    ts: {
      include: ["locales/[locale].ts"],
    },
  },
  llm: {
    provider: "ollama",
    model: "mistral:latest",
    temperature: 0,
  },
};
