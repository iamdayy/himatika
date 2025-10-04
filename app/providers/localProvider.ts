import { createOperationsGenerator } from "#image";
import type { ProviderGetImage } from "@nuxt/image";

const operationsGenerator = createOperationsGenerator();

export const getImage: ProviderGetImage = (src) => {
  return {
    url: src,
  };
};
