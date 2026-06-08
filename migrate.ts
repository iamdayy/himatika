import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// We redefine the minimal schemas here to avoid Nuxt auto-import issues
const uri = process.env.HIMATIKA_MONGODB_URI;

if (!uri) {
  console.error("HIMATIKA_MONGODB_URI is not set in .env");
  process.exit(1);
}

const migrate = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.");

    // Access the raw collections using mongoose.connection.db
    const agendasCollection = mongoose.connection.db?.collection("agendas");
    const participantsCollection = mongoose.connection.db?.collection("participants");
    const committeesCollection = mongoose.connection.db?.collection("committees");

    if (!agendasCollection || !participantsCollection || !committeesCollection) {
      throw new Error("Failed to access collections");
    }

    const agendas = await agendasCollection.find({}).toArray();
    console.log(`Found ${agendas.length} agendas.`);

    let totalParticipants = 0;
    let totalCommittees = 0;

    for (const agenda of agendas) {
      const agendaId = agenda._id;

      if (agenda.participants && agenda.participants.length > 0) {
        const pDocs = agenda.participants.map((p: any) => {
          // If the _id is not an ObjectId, ensure it becomes one
          const _id = p._id ? new mongoose.Types.ObjectId(p._id) : new mongoose.Types.ObjectId();
          return { ...p, _id, agendaId };
        });

        for (const p of pDocs) {
          await participantsCollection.updateOne(
            { _id: p._id },
            { $set: p },
            { upsert: true }
          );
        }
        totalParticipants += pDocs.length;
      }

      if (agenda.committees && agenda.committees.length > 0) {
        const cDocs = agenda.committees.map((c: any) => {
          const _id = c._id ? new mongoose.Types.ObjectId(c._id) : new mongoose.Types.ObjectId();
          return { ...c, _id, agendaId };
        });

        for (const c of cDocs) {
          await committeesCollection.updateOne(
            { _id: c._id },
            { $set: c },
            { upsert: true }
          );
        }
        totalCommittees += cDocs.length;
      }
    }

    console.log(`Migration completed successfully!`);
    console.log(`- Agendas processed: ${agendas.length}`);
    console.log(`- Participants migrated: ${totalParticipants}`);
    console.log(`- Committees migrated: ${totalCommittees}`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

migrate();
