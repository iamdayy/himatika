import "./mock";
import mongoose from "mongoose";
import { MemberModel } from "../server/models/MemberModel";
import { UserModel } from "../server/models/UserModel";
import { AgendaModel } from "../server/models/AgendaModel";
import { ParticipantModel } from "../server/models/ParticipantModel";
import { CommitteeModel } from "../server/models/CommitteeModel";
import { ProjectModel } from "../server/models/ProjectModel";
import { PointModel } from "../server/models/PointModel";
import bcrypt from "bcryptjs";

const runAddDummy = async () => {
  try {
    const mongoUri = process.env.HIMATIKA_MONGODB_URI;
    if (!mongoUri) {
      console.error("❌ HIMATIKA_MONGODB_URI is not set in .env");
      process.exit(1);
    }

    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      dbName: process.env.DBNAME || "himatika",
    });
    console.log("✅ Connected to MongoDB");

    // Clear previous dummy if exists
    const dummyNim = 999999999;
    const dummyUsername = "dummy";
    const existingDummyMember = await MemberModel.findOne({ NIM: dummyNim });
    if (existingDummyMember) {
      await MemberModel.deleteOne({ NIM: dummyNim });
      await UserModel.deleteOne({ username: dummyUsername });
      await ParticipantModel.deleteMany({ member: existingDummyMember._id });
      await CommitteeModel.deleteMany({ member: existingDummyMember._id });
      await PointModel.deleteMany({ member: existingDummyMember._id });
      await ProjectModel.updateMany({ members: existingDummyMember._id }, { $pull: { members: existingDummyMember._id } });
    }

    console.log("🌱 Creating Dummy Member and User...");
    const dummyMember = new MemberModel({
      NIM: dummyNim,
      fullName: "Dummy Presenter",
      avatar: "https://ui-avatars.com/api/?name=Dummy+Presenter&background=random&color=fff&size=256",
      class: "A",
      semester: 4,
      enteredYear: 2023,
      sex: "male",
      religion: "Islam",
      status: "active",
      email: `dummy@student.ub.ac.id`,
      phone: `081299998888`,
    });
    await dummyMember.save();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);

    const dummyUser = new UserModel({
      username: dummyUsername,
      password: hashedPassword,
      member: dummyMember._id,
      verified: true,
    });
    await dummyUser.save();

    console.log("🌱 Adding dummy to projects...");
    const projects = await ProjectModel.find({ published: true }).limit(3);
    for (const proj of projects) {
      if (!proj.members.includes(dummyMember._id)) {
        proj.members.push(dummyMember._id as any);
        await proj.save();
      }
    }

    console.log("🌱 Adding dummy to agendas...");
    const agendas = await AgendaModel.find().limit(3);
    let agendaCounter = 0;
    for (const agenda of agendas) {
      if (agendaCounter % 2 === 0) {
        // Participant
        await ParticipantModel.create({
          agendaId: agenda._id,
          member: dummyMember._id,
          visiting: true
        });
      } else {
        // Committee
        await CommitteeModel.create({
          agendaId: agenda._id,
          member: dummyMember._id,
          job: "Staff Acara",
          approved: true,
          visiting: true
        });
      }
      agendaCounter++;
    }

    console.log("🌱 Adding manual points...");
    await PointModel.create({
      member: dummyMember._id,
      amount: 100,
      reason: "Presentasi Fitur",
      date: new Date(),
      status: "approved",
      approvedBy: "System"
    });

    console.log("🎉 Dummy account created successfully!");
    console.log("-----------------------------------------");
    console.log("Username : dummy");
    console.log("Password : password");
    console.log("-----------------------------------------");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create dummy account:", err);
    process.exit(1);
  }
};

runAddDummy();
