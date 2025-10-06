export const hashText = (text: string): string => {
  return `${text.replace(/\s+/g, "_").toLowerCase()}${new Date()
    .toISOString()
    .replace(/[-:.]/g, "")}`;
};
