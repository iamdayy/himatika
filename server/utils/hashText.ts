export const hashText = (text: string): string => {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${text.replace(/\s+/g, "_").toLowerCase()}${new Date()
    .toISOString()
    .replace(/[-:.]/g, "")}_${randomString}`;
};
