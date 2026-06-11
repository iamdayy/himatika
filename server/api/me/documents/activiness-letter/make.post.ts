import { ConfigModel } from "~~/server/models/ConfigModel";
import { DocModel } from "~~/server/models/DocModel";
import OrganizerModel from "~~/server/models/OrganizerModel";
import { IDoc, IMember, IPoint } from "~~/types";

export default defineEventHandler(async (event) => {
  const { user } = event.context;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const point = body.point as IPoint;

  if (!point || !point.range || !point.range.start || !point.range.end) {
    throw createError({
      statusCode: 400,
      statusMessage: "Point data (and range) is required",
    });
  }

  // 1. Get Config
  const configData = await ConfigModel.findOne().lean();
  if (!configData) {
      throw createError({ statusCode: 404, statusMessage: "Config not found" });
  }

  // 2. Get Organizer
  const pointStartDate = new Date(point.range.start);
  const pointEndDate = new Date(point.range.end);

  const organizer = await OrganizerModel.findOne({ 
    "period.start": { $lte: pointEndDate },
    "period.end": { $gte: pointStartDate }
  })
   .sort({ "period.end": -1 })
   .populate({path: "dailyManagement.member", select: "fullName NIM"}) // Ensure members are populated
   .lean(); // Use lean for performance if we don't need mongoose methods

  if (!organizer) {
      throw createError({ statusCode: 404, statusMessage: "Organizer not found for this period" });
  }

  // 3. Generate Doc Number
  const lastNumber = await DocModel.countDocuments({
    createdAt: {
      $exists: true,
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
  });
  
  const monthToRoman = (date: Date) => {
      const months = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
      return months[date.getMonth()];
  };

  const formattedNumber = (lastNumber + 1).toString().padStart(3, "0");
  const docNumber = `${formattedNumber}/II.3.AI/B01.01/02.A-1/S.Ket/${monthToRoman(new Date())}/${new Date().getFullYear()}`;

  // Find chairman and secretary carefully
  const dailyManagement = organizer.dailyManagement || [];
  const chairman = dailyManagement.find((dm: any) => dm?.position?.includes("Ketua") || dm?.position?.includes("Chairman"))?.member as any;
  const secretary = dailyManagement.find((dm: any) => dm?.position?.includes("Sekretaris") || dm?.position?.includes("Secretary"))?.member as any;

  if (!chairman || !chairman._id || !chairman.fullName || !chairman.NIM) {
    throw createError({
      statusCode: 400,
      statusMessage: "Data Ketua Umum tidak lengkap atau belum ditentukan pada periode kepengurusan ini",
    });
  }

  if (!secretary || !secretary._id || !secretary.fullName || !secretary.NIM) {
    throw createError({
      statusCode: 400,
      statusMessage: "Data Sekretaris Umum tidak lengkap atau belum ditentukan pada periode kepengurusan ini",
    });
  }

  // 4. Call Worker
  try {
      const result = await himatikaPdfWorker.generateActivinessLetter({
          member: user.member,
          point: point,
          chairman: chairman,
          secretary: secretary,
          docNumber: docNumber,
          period: `${organizer.period?.start?.getFullYear() || new Date().getFullYear()} - ${organizer.period?.end?.getFullYear() || new Date().getFullYear()}`,
          config: {
            name: configData.name || "Himatika",
            address: configData.address || "Sekretariat Himatika",
            phone: configData.contact?.phone || "-",
            email: configData.contact?.email || "-"
          }
      });

      // 5. Construct IDoc object
      const signs = [];
      
      const chairmanLoc = result.signatureLocations?.find((l: any) => l.role === 'Chairman');
      if (chairman && chairman._id && chairmanLoc) {
          signs.push({
              user: chairman._id,
              signed: false,
              as: "Ketua Umum",
              location: {
                  page: chairmanLoc.page,
                  x: chairmanLoc.x,
                  y: chairmanLoc.y,
                  width: chairmanLoc.width,
                  height: chairmanLoc.height
              }
          });
      }

      const secretaryLoc = result.signatureLocations?.find((l: any) => l.role === 'Secretary');
      if (secretary && secretary._id && secretaryLoc) {
          signs.push({
              user: secretary._id,
              signed: false,
              as: "Sekretaris Umum",
              location: {
                  page: secretaryLoc.page,
                  x: secretaryLoc.x,
                  y: secretaryLoc.y,
                  width: secretaryLoc.width,
                  height: secretaryLoc.height
              }
          });
      }

      const docData: Partial<IDoc> = {
          label: `Surat Keterangan Aktif ${user.member.NIM} Semester ${point.semester}`,
          no: docNumber,
          doc: result.url,
          tags: ["Surat Keterangan Aktif", `Semester ${point.semester}`],
          archived: false,
          signs: signs as any, // Cast to avoid specific schema validation issues here
      };

      // Save to DB
      const saved = await DocModel.create({
          ...docData,
          uploader: user.member._id,
          trails: [{
              user: user.member._id,
              action: "CREATE"
          }]
      });

      return {
          statusCode: 200,
          statusMessage: "Document generated successfully",
          data: saved
      };

  } catch (e: any) {
      console.error(e);
      throw createError({
          statusCode: 500,
          statusMessage: e.message || "Failed to generate document"
      });
  }
});
