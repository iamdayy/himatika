import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.HIMATIKA_MONGODB_URI;

const check = async () => {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const agendas = await db.collection("agendas").find({}).toArray();
  let pCount = 0;
  let cCount = 0;
  for (const a of agendas) {
    if (a.participants) pCount += a.participants.length;
    if (a.committees) cCount += a.committees.length;
  }
  console.log(`Participants array total: ${pCount}`);
  console.log(`Committees array total: ${cCount}`);
  await mongoose.disconnect();
};

check();
