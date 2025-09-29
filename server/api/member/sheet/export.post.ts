import ExcelJS from "exceljs";
import fs from "fs";
import { MemberModel } from "~~/server/models/MemberModel";
import { IMember } from "~~/types";
import { IExportSheetResponse } from "~~/types/IResponse";
const config = useRuntimeConfig();

/**
 * Handles POST requests for exporting data to Excel.
 * @param {H3Event} event - The H3 event object.
 * @returns {Promise<Blob|Object>} A Blob containing the Excel file or an error object.
 */
export default defineEventHandler(
  async (event): Promise<IExportSheetResponse> => {
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

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Member");

      // Menambahkan header kolom
      worksheet.columns = [
        { header: "NIM", key: "NIM", width: 15 },
        { header: "Nama Lengkap", key: "fullName", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Kelas", key: "class", width: 10 },
        { header: "Semester", key: "semester", width: 10 },
        { header: "Tahun Masuk", key: "enteredYear", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ];

      // Menambahkan data ke worksheet
      members.forEach((member) => {
        worksheet.addRow({
          NIM: member.NIM,
          fullName: member.fullName,
          email: member.email,
          class: member.class,
          semester: member.semester,
          enteredYear: member.enteredYear,
          status: member.status,
        });
      });
      const title = `exported-${membersCounts}${new Date()
        .toString()
        .replace(/:/g, "-")
        .replace(/ /g, "-")}.xlsx`;
      const PATH = `/uploads/xlsx/export/${title}`;
      // Generate Excel file buffer
      await workbook.xlsx.writeFile(`${config.storageDir}${PATH}`);
      const dirList = fs.readdirSync(
        `${config.storageDir}/uploads/xlsx/export`
      );

      return {
        statusCode: 200,
        statusMessage: "Data exported successfully",
        data: {
          url: PATH,
          title: title,
        },
      };
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setResponseStatus(event, 500); // Internal Server Error
      return {
        statusCode: 500,
        statusMessage: "Error exporting to Excel",
      };
    }
  }
);
