import { MemberModel } from "~~/server/models/MemberModel";
import { UserModel } from "~~/server/models/UserModel";
import OrganizerModel from "~~/server/models/OrganizerModel";
import CategoryModel from "~~/server/models/CategoryModel";
import { GuestModel } from "~~/server/models/GuestModel";
import { AgendaModel } from "~~/server/models/AgendaModel";
import { ParticipantModel } from "~~/server/models/ParticipantModel";
import { CommitteeModel } from "~~/server/models/CommitteeModel";
import { ProjectModel } from "~~/server/models/ProjectModel";
import { PointModel } from "~~/server/models/PointModel";
import mongoose from "mongoose";

export default defineEventHandler(async (event) => {
  // Hanya jalankan seed di mode development/lokal
  if (process.env.NODE_ENV === "production") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden: Seeding is not allowed in production",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Starting comprehensive local seed...");

    // 1. Categories
    const categoriesData = [
      { title: "Pendidikan", slug: "pendidikan", description: "Agenda dan Kegiatan Edukatif" },
      { title: "Teknologi", slug: "teknologi", description: "Kegiatan berbasis Teknologi IT" },
      { title: "Keorganisasian", slug: "keorganisasian", description: "Manajemen dan Organisasi" }
    ];
    let catIds: mongoose.Types.ObjectId[] = [];
    for (const c of categoriesData) {
      let cat = await CategoryModel.findOne({ slug: c.slug });
      if (!cat) {
        cat = new CategoryModel(c);
        await cat.save({ session });
      }
      catIds.push(cat._id as mongoose.Types.ObjectId);
    }
    console.log("✅ Categories generated");

    // 2. Members (50 dummies)
    const membersList: any[] = [];
    // Ensure admin exists
    let admin = await MemberModel.findOne({ NIM: 123456 });
    if (!admin) {
      admin = new MemberModel({
        NIM: 123456, fullName: "Administrator Himatika", email: "admin@himatika.local", class: "A", semester: 5, enteredYear: new Date().getFullYear() - 2, sex: "male", status: "active", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=admin"
      });
      await admin.save({ session });
    }
    membersList.push(admin);

    for (let i = 1; i <= 50; i++) {
      let nim = 100000 + i;
      let m = await MemberModel.findOne({ NIM: nim });
      if (!m) {
        m = new MemberModel({
          NIM: nim, fullName: `Member Dummy ${i}`, email: `member${i}@dummy.local`,
          class: ["A", "B", "C", "D"][i % 4],
          semester: [1, 3, 5, 7][i % 4],
          enteredYear: new Date().getFullYear() - (i % 4),
          sex: i % 2 === 0 ? "female" : "male",
          status: "active",
          avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=member${i}`
        });
        await m.save({ session });
      }
      membersList.push(m);
    }
    console.log("✅ 50 Members generated");

    // 3. Users (Admin + 5 Regulars)
    let adminUser = await UserModel.findOne({ username: "admin" });
    if (!adminUser) {
      adminUser = new UserModel({ member: admin._id, username: "admin", password: "password123" });
      await adminUser.save({ session });
    }
    for (let i = 1; i <= 5; i++) {
      let u = await UserModel.findOne({ username: `user${i}` });
      if (!u) {
        u = new UserModel({ member: membersList[i]._id, username: `user${i}`, password: "password123" });
        await u.save({ session });
      }
    }
    console.log("✅ Users generated");

    // 4. Organizer
    const currentYear = new Date().getFullYear();
    const startPeriod = new Date(`${currentYear}-01-01`);
    const endPeriod = new Date(`${currentYear + 1}-01-01`);
    let organizer = await OrganizerModel.findOne({ "period.start": { $lte: endPeriod }, "period.end": { $gte: startPeriod } } as any);
    if (!organizer) {
      organizer = new OrganizerModel({
        period: { start: startPeriod, end: endPeriod },
        council: [{ name: "Dewan Kehormatan", image: "https://api.dicebear.com/9.x/initials/svg?seed=DK", position: "Dewan" }],
        advisor: { name: "Dosen Pembina", image: "https://api.dicebear.com/9.x/initials/svg?seed=DP", position: "Pembina" },
        considerationBoard: [membersList[6]._id, membersList[7]._id], // 2 DK
        dailyManagement: [
          { member: admin._id, position: "Ketua Umum", staff: [] },
          { member: membersList[8]._id, position: "Wakil Ketua", staff: [] },
          { member: membersList[9]._id, position: "Sekretaris", staff: [] }
        ],
        department: [
          { name: "Pendidikan", coordinator: membersList[10]._id, members: [membersList[11]._id, membersList[12]._id], staff: [] },
          { name: "Kominfo", coordinator: membersList[13]._id, members: [membersList[14]._id, membersList[15]._id], staff: [] },
          { name: "Kewirausahaan", coordinator: membersList[16]._id, members: [membersList[17]._id, membersList[18]._id], staff: [] },
        ]
      });
      await organizer.save({ session });
      console.log("✅ Complete Organizer structure generated");
    }

    // 5. Guests
    const guestsList: any[] = [];
    for (let i = 1; i <= 3; i++) {
      let g = await GuestModel.findOne({ email: `guest${i}@external.local` });
      if (!g) {
        g = new GuestModel({ fullName: `Guest External ${i}`, email: `guest${i}@external.local`, phone: `0812345670${i}`, instance: "Universitas Lain" });
        await g.save({ session });
      }
      guestsList.push(g);
    }
    console.log("✅ Guests generated");

    // 6. Agendas
    let agenda1 = await AgendaModel.findOne({ title: "Seminar Nasional AI 2026" });
    if (!agenda1) {
      agenda1 = new AgendaModel({
        title: "Seminar Nasional AI 2026", category: catIds[1],
        date: { start: new Date(), end: new Date(Date.now() + 86400000) },
        at: "Gedung Pusat", tags: ["AI", "Seminar"], description: "Seminar kecerdasan buatan",
        configuration: {
            participant: { canRegister: "Public", pay: false },
            committee: { canRegister: "Member", pay: false }
        }
      });
      await agenda1.save({ session });
    }
    
    // 7. Participants & Committees
    // Committees for agenda 1
    for (let i = 20; i <= 24; i++) {
      let c = await CommitteeModel.findOne({ member: membersList[i]._id, agendaId: agenda1._id });
      if (!c) {
        c = new CommitteeModel({ job: "Divisi Acara", member: membersList[i]._id, approved: true, agendaId: agenda1._id });
        await c.save({ session });
      }
    }
    // Participants (Members) for agenda 1
    for (let i = 30; i <= 39; i++) {
      let p = await ParticipantModel.findOne({ member: membersList[i]._id, agendaId: agenda1._id });
      if (!p) {
        p = new ParticipantModel({ member: membersList[i]._id, agendaId: agenda1._id });
        await p.save({ session });
      }
    }
    // Participants (Guests) for agenda 1
    let pg = await ParticipantModel.findOne({ guest: guestsList[0]._id, agendaId: agenda1._id });
    if (!pg) {
      pg = new ParticipantModel({ guest: guestsList[0]._id, agendaId: agenda1._id });
      await pg.save({ session });
    }
    console.log("✅ Agendas, Participants, and Committees generated");

    // 8. Projects
    let proj = await ProjectModel.findOne({ title: "Website Himatika V2" });
    if (!proj) {
      proj = new ProjectModel({
        title: "Website Himatika V2", description: "Pengembangan sistem informasi himpunan mahasiswa", image: "https://api.dicebear.com/9.x/icons/svg?seed=Website", date: new Date(), category: catIds[1], tags: ["Web", "Vue"], published: true, progress: 80,
        members: [membersList[0]._id, membersList[10]._id, membersList[13]._id]
      });
      await proj.save({ session });
    }
    console.log("✅ Projects generated");

    // 9. Point Logs
    for (let i = 1; i <= 10; i++) {
      let reason = `Juara ${i%3 + 1} Lomba Teknologi`;
      let pt = await PointModel.findOne({ member: membersList[i]._id, reason });
      if (!pt) {
        pt = new PointModel({ member: membersList[i]._id, admin: adminUser._id, amount: 150 - (i*5), reason, type: "achievement", status: "approved" });
        await pt.save({ session });
      }
    }
    console.log("✅ Point Logs generated");

    await session.commitTransaction();
    return {
      statusCode: 200,
      statusMessage: "Comprehensive Local Seeding Completed Successfully",
      data: {
        username: "admin",
        password: "password123",
        membersCount: membersList.length,
        message: "Data lengkap beserta organizer, guests, agendas, dan projects telah disiapkan!"
      }
    };
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Seeding error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to run comprehensive seed",
      data: error.message
    });
  } finally {
    await session.endSession();
  }
});
