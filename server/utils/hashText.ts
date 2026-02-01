import crypto from "crypto";

export const hashText = (text: string): string => {
  return `${text.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
};
