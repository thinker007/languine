import type { Environment } from "@/bindings";
import { getContext } from "hono/context-storage";

export const getEnvs = () => {
  return getContext<Environment>();
};
