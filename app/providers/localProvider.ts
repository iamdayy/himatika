import { createOperationsGenerator } from "#image";
import type { ProviderGetImage } from "@nuxt/image";
import { joinURL } from "ufo";

const operationsGenerator = createOperationsGenerator();

export const getImage: ProviderGetImage = (
  src,
  { modifiers = {}, baseURL } = {}
) => {
  if (!baseURL) {
    // also support runtime config
    baseURL = useRuntimeConfig().public.public_uri;
  }

  const operations = operationsGenerator(modifiers);

  return {
    url: joinURL(baseURL, src + (operations ? "?" + operations : "")),
  };
};
