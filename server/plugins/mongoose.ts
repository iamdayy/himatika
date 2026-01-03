// server/plugins/mongoose.ts
import mongoose from "mongoose";

const config = useRuntimeConfig();
// Simpan koneksi di global scope agar tidak hilang saat fungsi 'hangat'
let cachedConnection: any = null;

export default defineNitroPlugin(async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return; // Gunakan koneksi yang sudah ada
  }

  try {
    const conn = await mongoose.connect(config.mongodb_uri, {
      dbName: config.dbName,
      // Opsi tambahan untuk kestabilan serverless
      bufferCommands: false,
      maxPoolSize: 10, // Batasi jumlah koneksi per instance
    });
    cachedConnection = conn;
    console.log("DB connection established (New).");
  } catch (err) {
    console.error("DB connection failed.", err);
  }
});
