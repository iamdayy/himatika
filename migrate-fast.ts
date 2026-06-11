import mongoose from "mongoose";

const uri = "mongodb+srv://Vercel-Admin-himatika:a6x6VUnHGgkDAajN@himatika.bi7mjjd.mongodb.net/?retryWrites=true&w=majority";

const migrate = async () => {
  try {
    console.log("Connecting to MongoDB...");
    const dbName = "himatika";
    await mongoose.connect(uri, { dbName });
    console.log(`Connected to database: ${dbName}`);

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

    const pBulkOps: any[] = [];
    const cBulkOps: any[] = [];

    for (const agenda of agendas) {
      const agendaId = agenda._id;

      if (agenda.participants && agenda.participants.length > 0) {
        agenda.participants.forEach((p: any) => {
          const _id = p._id ? new mongoose.Types.ObjectId(p._id) : new mongoose.Types.ObjectId();
          const doc = { ...p, _id, agendaId };
          pBulkOps.push({
            updateOne: {
              filter: { _id },
              update: { $set: doc },
              upsert: true
            }
          });
        });
        totalParticipants += agenda.participants.length;
      }

      if (agenda.committees && agenda.committees.length > 0) {
        agenda.committees.forEach((c: any) => {
          const _id = c._id ? new mongoose.Types.ObjectId(c._id) : new mongoose.Types.ObjectId();
          const doc = { ...c, _id, agendaId };
          cBulkOps.push({
            updateOne: {
              filter: { _id },
              update: { $set: doc },
              upsert: true
            }
          });
        });
        totalCommittees += agenda.committees.length;
      }
    }

    if (pBulkOps.length > 0) {
      console.log(`Executing bulk write for ${pBulkOps.length} participants...`);
      await participantsCollection.bulkWrite(pBulkOps);
    }
    
    if (cBulkOps.length > 0) {
      console.log(`Executing bulk write for ${cBulkOps.length} committees...`);
      await committeesCollection.bulkWrite(cBulkOps);
    }

    console.log(`Migration completed successfully!`);
    console.log(`- Agendas processed: ${agendas.length}`);
    console.log(`- Participants migrated: ${totalParticipants}`);
    console.log(`- Committees migrated: ${totalCommittees}`);
    
    // Now unset the fields on agendas
    console.log("Unsetting legacy arrays on agendas...");
    const updateRes = await agendasCollection.updateMany({}, { $unset: { participants: "", committees: "" } });
    console.log(`Unset arrays on ${updateRes.modifiedCount} agendas.`);

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

migrate();
