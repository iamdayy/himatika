// plugins/pageGuide.ts
import { defineNuxtPlugin } from "#app";
import { driver, type Config, type DriveStep } from "driver.js";
import { useIndexedDB } from "~/composables/useIndexedDB";

export default defineNuxtPlugin((nuxtApp) => {
  const pageGuide = async (
    page: string,
    steps: DriveStep[],
    options: Config = {}
  ) => {
    const { getGuideData, storeGuideData } = useIndexedDB();
    const config = useRuntimeConfig();
    const drive = driver({
      ...options,
      popoverClass: "driverjs-theme",
    });
    drive.setSteps(steps);
    const guideData = await getGuideData(page);
    if (!guideData) {
      drive.drive();
      storeGuideData(page, config.public.version);
    }
    return drive;
  };
  return {
    provide: {
      pageGuide,
    },
  };
});
