import "./mock";
import mongoose from "mongoose";
import { MemberModel } from "../server/models/MemberModel";
import { UserModel } from "../server/models/UserModel";
import OrganizerModel from "../server/models/OrganizerModel";
import { AgendaModel } from "../server/models/AgendaModel";
import CategoryModel from "../server/models/CategoryModel";
import { GuestModel } from "../server/models/GuestModel";
import { ParticipantModel } from "../server/models/ParticipantModel";
import { CommitteeModel } from "../server/models/CommitteeModel";
import { ConfigModel } from "../server/models/ConfigModel";
import { NewsModel } from "../server/models/NewsModel";
import { CarouselModel } from "../server/models/CarouselModel";
import { PhotoModel } from "../server/models/PhotoModel";
import { ProjectModel } from "../server/models/ProjectModel";
import bcrypt from "bcryptjs";

const FIRST_NAMES = ["Budi", "Siti", "Ahmad", "Nisa", "Kevin", "Putri", "Rizky", "Dinda", "Fajar", "Ayu", "Ilham", "Sarah", "Reza", "Nadya", "Dimas", "Rina", "Agus", "Melati", "Hendra", "Nurul", "Aditya", "Dewi", "Bayu", "Lestari", "Eko", "Maya", "Yusuf", "Intan", "Arif", "Citra", "Andi", "Ratna", "Deny", "Farah", "Bagus", "Fikri", "Zahra", "Lukman", "Aulia", "Tegar", "Vania"];
const LAST_NAMES = ["Pratama", "Wijaya", "Sari", "Setiawan", "Putra", "Lestari", "Saputra", "Hidayat", "Kusuma", "Wulandari", "Mahendra", "Pertiwi", "Nugroho", "Ramadhani", "Santoso", "Sanjaya", "Utami", "Syahputra", "Rahayu", "Gunawan", "Yolanda", "Saputri", "Siregar", "Nasution", "Mahardika", "Pangestu", "Ardiansyah"];
const INSTANCES = ["Universitas Indonesia", "Institut Teknologi Bandung", "Universitas Gadjah Mada", "Universitas Diponegoro", "Institut Teknologi Sepuluh Nopember", "Telkom University", "GoTo Group", "Traveloka", "PT. Telkom Indonesia", "Shopee Indonesia", "Universitas Negeri Malang"];

const getRandomElement = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomElements = (arr: any[], num: number) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};
const generateName = () => `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
const generateAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;

const runSeed = async () => {
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

    console.log("🧹 Purging existing data...");
    await MemberModel.deleteMany({});
    await UserModel.deleteMany({});
    await OrganizerModel.deleteMany({});
    await AgendaModel.deleteMany({});
    await CategoryModel.deleteMany({});
    await GuestModel.deleteMany({});
    await ParticipantModel.deleteMany({});
    await CommitteeModel.deleteMany({});
    await ConfigModel.deleteMany({});
    await NewsModel.deleteMany({});
    await CarouselModel.deleteMany({});
    await PhotoModel.deleteMany({});
    await ProjectModel.deleteMany({});
    console.log("✅ Data purged");

    console.log("🌱 Seeding Members and Users...");
    const members = [];
    const currentYear = new Date().getFullYear();
    for (let i = 1; i <= 80; i++) {
      const yearOffset = Math.floor(i % 4); // 0 to 3 years ago
      const angkatan = currentYear - yearOffset;
      const nimPrefix = angkatan.toString().slice(-2) + "51502";
      const nimSuffix = i.toString().padStart(4, "0");
      const nim = parseInt(`${nimPrefix}${nimSuffix}`);
      
      const fullName = generateName();
      const sex = Math.random() > 0.5 ? "male" : "female";
      const emailUsername = nim;

      const member = new MemberModel({
        NIM: nim,
        fullName: fullName,
        avatar: generateAvatar(fullName),
        class: i % 2 === 0 ? "A" : "B",
        semester: (yearOffset * 2) + (Math.random() > 0.5 ? 1 : 2), 
        enteredYear: angkatan,
        sex: sex,
        religion: "Islam",
        status: "active",
        email: `${emailUsername}@student.ub.ac.id`,
        phone: `0812${Math.floor(Math.random() * 90000000) + 10000000}`,
      });
      members.push(member);
    }
    const insertedMembers = await MemberModel.insertMany(members);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password", salt);
    
    const users = insertedMembers.map((m: any, idx) => ({
      username: m.email.split("@")[0],
      password: hashedPassword,
      member: m._id,
      verified: true,
    }));
    await UserModel.insertMany(users);
    const keyMember = new MemberModel({
      NIM: 102230055,
      fullName: "Dayyan Syauqi",
      email: "iamdayy14@gmail.com",
      avatar: generateAvatar("Dayyan Syauqi"),
      class: "A",
      semester: 4,
      sex: "male",
      religion: "Islam",
      phone: "081234567890",
      status: "active",
      enteredYear: 2023,
    })
    await keyMember.save()

    const regularMember = new MemberModel({
      NIM: 102230099,
      fullName: "Regular Member",
      email: "regular@gmail.com",
      avatar: generateAvatar("Regular Member"),
      class: "B",
      semester: 4,
      sex: "female",
      religion: "Islam",
      phone: "081234567891",
      status: "active",
      enteredYear: 2023,
    })
    await regularMember.save()

    // Add explicit user accounts for login
    await UserModel.insertMany([
      { username: "iamdayy", password: hashedPassword, member: keyMember._id, verified: true },
      { username: "regular", password: hashedPassword, member: regularMember._id, verified: true }
    ]);
    console.log(`✅ Seeded ${insertedMembers.length} Members and Users`);

    console.log("🌱 Seeding Organizer...");
    const councilName1 = `Prof. Dr. ${generateName()} M.Kom`;
    const councilName2 = `Dr. ${generateName()} S.T., M.T.`;
    const advisorName = `Ir. ${generateName()} M.Sc.`;

    const council = [
      { name: councilName1, image: generateAvatar(councilName1), position: "Ketua Jurusan" },
      { name: councilName2, image: generateAvatar(councilName2), position: "Sekretaris Jurusan" }
    ];
    const advisor = { name: advisorName, image: generateAvatar(advisorName), position: "Dosen Pembina Kemahasiswaan" };

    let availableMembers = [...insertedMembers];
    
    // Consideration Board (Dewan Pertimbangan) - Pick 3
    const considerationBoard = getRandomElements(availableMembers, 3).map(m => m._id);
    availableMembers = availableMembers.filter(m => !considerationBoard.includes(m._id));

    // Daily Management (Pengurus Harian)
    const dailyManagementRoles = ["Wakil Ketua", "Sekretaris I", "Sekretaris II", "Bendahara I", "Bendahara II"];
    const dailyManagement = [
      { position: "Ketua Himpunan", member: keyMember._id }, // Explicitly Dayyan Syauqi
      ...dailyManagementRoles.map((role) => {
        const member = availableMembers.pop();
        return { position: role, member: member._id };
      })
    ];

    // Departments (Departemen)
    const departmentNames = ["Pendidikan dan Keilmuan", "Pengembangan Sumber Daya Mahasiswa", "Hubungan Masyarakat", "Dana dan Usaha", "Minat dan Bakat", "Media dan Informasi"];
    const departments = departmentNames.map(name => {
      const coordinator = availableMembers.pop();
      const numMembers = 4; // 4 members per department
      const deptMembers = [];
      for(let i=0; i<numMembers; i++) {
        deptMembers.push(availableMembers.pop()._id);
      }
      return {
        name,
        coordinator: coordinator._id,
        members: deptMembers
      };
    });

    const organizer = new OrganizerModel({
      council,
      advisor,
      considerationBoard,
      dailyManagement,
      department: departments,
      period: {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31)
      }
    });
    await organizer.save();
    console.log("✅ Seeded Organizer");

    console.log("🌱 Seeding Category and Agenda...");
    const categorySeminar = new CategoryModel({
      title: "Seminar",
      description: "Kegiatan berbasis seminar akademik maupun non-akademik.",
      slug: "seminar"
    });
    await categorySeminar.save();
    
    const categoryWorkshop = new CategoryModel({
      title: "Workshop",
      description: "Pelatihan skill praktis.",
      slug: "workshop"
    });
    await categoryWorkshop.save();

    const now = new Date();
    const agenda1 = new AgendaModel({
      title: "Technopreneurship Summit 2026",
      date: {
        start: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        end: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
      },
      category: categorySeminar._id,
      at: "Gedung Samantha Krida",
      description: "Seminar nasional yang membahas tentang peluang dan tantangan menjadi seorang teknopreneur di era AI dan digitalisasi.",
      configuration: {
        committee: {
          canRegister: "Member",
          canRegisterUntil: {
            start: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), 
            end: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // already closed
          },
          jobAvailables: [
            { label: "Ketua Pelaksana", count: 1 },
            { label: "Sekretaris", count: 1 },
            { label: "Seksi Acara", count: 5 },
            { label: "Seksi Humas", count: 3 }
          ]
        },
        participant: {
          canRegister: "Public",
          pay: true,
          amount: 75000,
          canRegisterUntil: {
            start: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            end: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          },
          ticketModels: [
            { name: "Presale 1", price: 50000, quota: 100 },
            { name: "Normal", price: 75000, quota: 200 }
          ]
        }
      }
    });
    await agenda1.save();
    
    const agenda2 = new AgendaModel({
      title: "Workshop UI/UX Design Fundamentals",
      date: {
        start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      },
      category: categoryWorkshop._id,
      at: "Laboratorium Komputer Terpadu",
      description: "Workshop interaktif selama 6 jam untuk mempelajari dasar-dasar UI/UX menggunakan Figma.",
      configuration: {
        committee: {
          canRegister: "Member",
          canRegisterUntil: {
            start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), 
            end: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
          },
          jobAvailables: [
            { label: "Penanggung Jawab", count: 1 },
            { label: "Fasilitator", count: 5 }
          ]
        },
        participant: {
          canRegister: "Member",
          pay: false,
          amount: 0,
          canRegisterUntil: {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          },
          ticketModels: [
            { name: "Free Entry", price: 0, quota: 40 }
          ]
        }
      }
    });
    await agenda2.save();
    console.log("✅ Seeded Categories and Agendas");

    console.log("🌱 Seeding Guests...");
    const guests = [];
    for (let i = 1; i <= 15; i++) {
      const guestName = generateName();
      guests.push({
        fullName: guestName,
        email: `${guestName.toLowerCase().replace(/ /g, ".")}@gmail.com`,
        phone: `0852${Math.floor(Math.random() * 90000000) + 10000000}`,
        instance: getRandomElement(INSTANCES),
      });
    }
    const insertedGuests = await GuestModel.insertMany(guests);
    console.log(`✅ Seeded ${insertedGuests.length} Guests`);

    console.log("🌱 Seeding Participants and Committees...");
    const participantRecords = [];
    
    // For Agenda 1 (Public)
    const partMembersAg1 = getRandomElements(insertedMembers, 25);
    for (const pm of partMembersAg1) {
      participantRecords.push({ agendaId: agenda1._id, member: pm._id });
    }
    for (const g of insertedGuests) {
      participantRecords.push({ agendaId: agenda1._id, guest: g._id });
    }

    // For Agenda 2 (Member Only)
    const partMembersAg2 = getRandomElements(insertedMembers, 15);
    for (const pm of partMembersAg2) {
      participantRecords.push({ agendaId: agenda2._id, member: pm._id });
    }
    await ParticipantModel.insertMany(participantRecords);

    // Committees
    const committeeRecords = [];
    const nonPartAg1 = insertedMembers.filter(m => !partMembersAg1.includes(m));
    const commAg1 = getRandomElements(nonPartAg1, 10);
    const jobsAg1 = ["Ketua Pelaksana", "Sekretaris", "Bendahara", "Seksi Acara", "Seksi Humas", "Seksi Pubdok", "Seksi Konsumsi", "Seksi Perlengkapan", "Seksi Keamanan", "Seksi Sponsor"];
    for (let i = 0; i < 10; i++) {
      committeeRecords.push({ agendaId: agenda1._id, member: commAg1[i]._id, job: jobsAg1[i] || "Staff", approved: true });
    }
    
    const nonPartAg2 = insertedMembers.filter(m => !partMembersAg2.includes(m));
    const commAg2 = getRandomElements(nonPartAg2, 3);
    const jobsAg2 = ["Penanggung Jawab", "Fasilitator Utama", "Fasilitator Pendamping"];
    for (let i = 0; i < 3; i++) {
      committeeRecords.push({ agendaId: agenda2._id, member: commAg2[i]._id, job: jobsAg2[i] || "Staff", approved: true });
    }
    await CommitteeModel.insertMany(committeeRecords);
    console.log(`✅ Seeded ${participantRecords.length} Participants and ${committeeRecords.length} Committees`);

    console.log("🌱 Seeding Config...");
    const config = new ConfigModel({
      name: "HIMATIKA",
      description: "Himpunan Mahasiswa Teknik Informatika merupakan lembaga eksekutif tertinggi di tingkat program studi yang menaungi seluruh mahasiswa.",
      address: "Gedung F Lantai 1, Fakultas Ilmu Komputer, Universitas Brawijaya, Malang",
      vision: "Menjadikan HIMATIKA sebagai wadah yang progresif, inklusif, dan inovatif dalam mengembangkan potensi mahasiswa Teknik Informatika.",
      mission: ["Menyelenggarakan kegiatan akademik dan non-akademik yang berkualitas", "Membangun relasi eksternal yang kuat dengan instansi dan perusahaan", "Mengoptimalkan pelayanan advokasi bagi seluruh mahasiswa"],
      contact: {
        email: "humas@himatika.ub.ac.id",
        phone: "+62 812-3456-7890",
      },
      socialMedia: [
        { name: "Instagram", url: "https://instagram.com/himatika_ub" },
        { name: "LinkedIn", url: "https://linkedin.com/company/himatika-ub" },
        { name: "YouTube", url: "https://youtube.com/@himatikaub" }
      ],
      dailyManagements: dailyManagementRoles,
      departments: departmentNames,
      minPoint: 150
    });
    await config.save();
    console.log("✅ Seeded Config");

    console.log("🌱 Seeding Photos, News, Carousel, and Projects...");
    const photo1 = new PhotoModel({
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      tags: ["seminar", "technopreneur", "2026"],
      uploader: insertedMembers[0]._id
    });
    await photo1.save();
    
    const photo2 = new PhotoModel({
      image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      tags: ["rapat", "koordinasi", "pengurus"],
      uploader: insertedMembers[1]._id
    });
    await photo2.save();

    const news = new NewsModel({
      title: "Persiapan Technopreneurship Summit 2026 Mencapai Tahap Akhir",
      mainImage: photo1.image,
      body: "<p>Persiapan untuk acara terbesar tahun ini, <strong>Technopreneurship Summit 2026</strong>, telah mencapai tahap 90%. Seluruh panitia yang terlibat terus bekerja keras untuk memastikan acara berjalan dengan lancar. Acara ini diharapkan dapat menarik lebih dari 500 peserta dari berbagai instansi di Indonesia.</p><p>Mari kita dukung kesuksesan acara ini dengan mendaftarkan diri segera!</p>",
      slug: "persiapan-technopreneurship-summit-2026",
      category: categorySeminar._id,
      authors: [insertedMembers[0]._id, insertedMembers[2]._id],
      tags: ["event", "nasional", "summit"],
      published: true,
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    });
    await news.save();

    const carousel1 = new CarouselModel({
      title: "Technopreneurship Summit 2026",
      description: "Jangan lewatkan kesempatan belajar langsung dari para tech-founders terkemuka di Indonesia. Daftar sekarang!",
      date: new Date(),
      image: photo1._id
    });
    await carousel1.save();
    
    const carousel2 = new CarouselModel({
      title: "Open Recruitment Kepanitiaan",
      description: "Ayo berkontribusi nyata bagi himpunan dengan bergabung menjadi bagian dari kepanitiaan.",
      date: new Date(),
      image: photo2._id
    });
    await carousel2.save();

    const project1 = new ProjectModel({
      title: "HIMATIKA Apps Dashboard",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Dashboard administrasi terintegrasi untuk pendataan keaktifan anggota, manajemen agenda, dan pengelolaan poin secara otomatis.",
      date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      progress: 85,
      category: categoryWorkshop._id,
      url: "https://admin.himatika.ub.ac.id",
      members: [insertedMembers[0]._id, insertedMembers[5]._id, insertedMembers[10]._id],
      tags: ["web", "dashboard", "typescript", "vue"],
      published: true,
      publishedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
    });
    await project1.save();
    
    const project2 = new ProjectModel({
      title: "HIMATIKA E-Voting",
      image: "https://images.unsplash.com/photo-1620912189868-30778f9024f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      description: "Sistem pemilihan ketua himpunan berbasis blockchain yang aman, anonim, dan dapat diverifikasi.",
      date: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      progress: 100,
      category: categorySeminar._id,
      url: "https://vote.himatika.ub.ac.id",
      members: [insertedMembers[2]._id, insertedMembers[3]._id],
      tags: ["blockchain", "voting", "security"],
      published: true,
      publishedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    });
    await project2.save();
    
    console.log("✅ Seeded Photos, News, Carousel, and Projects");

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

runSeed();
