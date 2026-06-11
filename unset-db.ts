import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.HIMATIKA_MONGODB_URI;

const check = async () => {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const result = await db.collection("agendas").updateMany({}, { $unset: { participants: "", committees: "" } });
  console.log(`Unset participants and committees from ${result.modifiedCount} agendas`);
  await mongoose.disconnect();
};

check();
