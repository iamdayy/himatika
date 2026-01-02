import { createOperationsGenerator, defineProvider } from "@nuxt/image/runtime";
import { joinURL } from "ufo";

const operationsGenerator = createOperationsGenerator();

export default defineProvider<{ baseURL?: string }>({
  getImage(src, { modifiers, baseURL }) {
    if (!baseURL) {
      // also support runtime config
      baseURL = useRuntimeConfig().public.public_uri;
    }

    const operations = operationsGenerator(modifiers);

    return {
      url: src.startsWith("/") ? joinURL(baseURL, src) : src,
      operations: operations.length > 0 ? operations : undefined,
    };
  },
});
