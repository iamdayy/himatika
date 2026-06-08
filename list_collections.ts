import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const uri = process.env.HIMATIKA_MONGODB_URI;
mongoose.connect(uri!).then(async () => {
  const collections = await mongoose.connection.db?.listCollections().toArray();
  console.log(collections?.map(c => c.name));
  await mongoose.disconnect();
});
