import type { IAgenda, ICommittee, IDoc, IParticipant, IPoint } from "~~/types";
import { type IResponse } from "~~/types/IResponse";
export const useMakeDocs = (agenda?: IAgenda | undefined) => {
  const { $api } = useNuxtApp();

  const makeActivinessLetter = async (data: IPoint) => {
    try {
      const response = await $api<IResponse & { data: IDoc }>("/api/me/documents/activiness-letter/make", {
        method: "POST",
        body: {
          point: data,
        },
      });

      if (response.statusCode === 200 && response.data) {
        return response.data;
      } else {
        throw new Error(response.statusMessage || "Failed to generate document");
      }
    } catch (error) {
      console.error("Error generating activiness letter:", error);
      throw error;
    }
  };

  const makeTicket = async (
    agenda: IAgenda,
    participant: IParticipant | ICommittee,
    role: "participant" | "committee" = "participant"
  ) => {
    try {
      const blob = await $api<Blob>("/api/agenda/ticket/make", {
        method: "POST",
        body: {
          agenda,
          participant,
          amount: agenda.configuration[role].amount,
          role,
        },
        responseType: "blob",
      });

      let memberName = 'Peserta';
      const member = participant.member as any;
      if (member && member.fullName) {
          memberName = member.fullName;
      } else if ((participant as any).guest && (participant as any).guest.fullName) {
          memberName = (participant as any).guest.fullName;
      }

      const filename = `Tiket-${role}-${agenda.title.substring(0, 10)}-${memberName.substring(0, 10)}.pdf`.replace(/\s/g, '_');

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (e) {
      console.error("PDF Generation Error", e);
      alert("Gagal membuat PDF tiket. Silakan coba lagi.");
    }
  };

  return {
    makeActivinessLetter,
    makeTicket
  };
};
