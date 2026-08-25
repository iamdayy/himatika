import { MemberModel } from "~~/server/models/MemberModel";
import { IMember } from "~~/types";
import { pdfWorkerFetch } from "~~/server/utils/himatikaPdfWorker";

/**
 * Handles POST requests for exporting data to Excel.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<void>} Stream the Excel file.
 */
export default defineEventHandler(async (event) => {
    try {
      const { data } = await readBody(event);
      let query: any = {};
      if (data) {
        query.NIM = { $in: data };
      }
      const membersCounts = await MemberModel.countDocuments(query);
      const members: IMember[] = await MemberModel.find(query)
        .select("NIM fullName email class semester enteredYear status")
        .lean();

      // Prepare data for worker
      const excelData = members.map((member) => ({
        NIM: member.NIM,
        "Nama Lengkap": member.fullName,
        Email: member.email,
        Kelas: member.class,
        Semester: member.semester,
        "Tahun Masuk": member.enteredYear,
        Status: member.status,
      }));

      const headers = [
        "NIM",
        "Nama Lengkap",
        "Email",
        "Kelas",
        "Semester",
        "Tahun Masuk",
        "Status",
      ];

      const buffer = await pdfWorkerFetch<ArrayBuffer>("/api/sheet/export", {
        method: 'POST',
        responseType: 'blob',
        body: {
            title: "Member",
            data: excelData,
            headers: headers
        }
      });

      const title = `exported-${membersCounts}${new Date()
        .toString()
        .replace(/:/g, "-")
        .replace(/ /g, "-")}.xlsx`;
      
      // send file to client
      setResponseHeaders(event, {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${title}"`,
      });
      event.node.res.end(buffer);

    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Error exporting to Excel",
      });
    }
  }
);
