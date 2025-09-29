import fs from "fs";
import path from "path";
const config = useRuntimeConfig();
export default defineEventHandler((event) => {
  if (event.path.startsWith("/uploads")) {
    const filePath = path.join(config.storageDir as string, event.path);

    if (fs.existsSync(filePath)) {
      const file = fs.readFileSync(filePath);

      return send(event, file);
    }
    return;
  }
});
