import { createOperationsGenerator, defineProvider } from "@nuxt/image/runtime";
import { joinURL } from "ufo";
import { useRuntimeConfig } from "#imports";

const operationsGenerator = createOperationsGenerator();

export default defineProvider<{ baseURL?: string }>({
  getImage(src, { modifiers, baseURL }) {
    if (!baseURL) {
      // also support runtime config
      baseURL = useRuntimeConfig().public.public_uri as string;
    }

    const operations = operationsGenerator(modifiers);

    return {
      url: src.startsWith("/") ? joinURL(baseURL as string, src) : src,
      operations: operations.length > 0 ? operations : undefined,
    };
  },
});
