import mongoose from "mongoose";

const uri = "mongodb+srv://Vercel-Admin-himatika:a6x6VUnHGgkDAajN@himatika.bi7mjjd.mongodb.net/?retryWrites=true&w=majority";

const check = async () => {
  await mongoose.connect(uri, { dbName: "himatika" });
  const db = mongoose.connection.db;
  if (!db) {
    console.log("No db connection");
    return;
  }
  const agendas = await db.collection("agendas").find({}).toArray();
  let pCount = 0;
  let cCount = 0;
  for (const a of agendas) {
    if (a.participants) pCount += a.participants.length;
    if (a.committees) cCount += a.committees.length;
  }
  console.log(`Participants array total in prod: ${pCount}`);
  console.log(`Committees array total in prod: ${cCount}`);
  
  const actualP = await db.collection("participants").countDocuments();
  const actualC = await db.collection("committees").countDocuments();
  console.log(`Actual participants collection total: ${actualP}`);
  console.log(`Actual committees collection total: ${actualC}`);
  await mongoose.disconnect();
};

check();
