import { IAgenda, ICommittee, IMember, IParticipant, IPoint, SignatureBox } from "~~/types";

interface IWorkerResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
  url?: string;
  filename?: string;
  signatureLocations?: any[];
}

interface ISignatureLocation {
    page: number;
    role: string;
    nim?: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export const himatikaPdfWorker = {
  async generateActivinessLetter(payload: {
    member: IMember;
    point: IPoint;
    chairman: IMember;
    secretary: IMember;
    docNumber: string;
    period: string;
    config: {
      name: string;
      address: string;
      phone: string;
      email: string;
    }
  }) {
    const config = useRuntimeConfig();
    const workerUrl = config.pdf_worker_api_url || "http://localhost:5000";

    try {
      const response = await $fetch<IWorkerResponse<any>>(`${workerUrl}/pdf/activiness-letter`, {
        method: "POST",
        body: payload,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return {
        url: response.url,
        filename: response.filename,
        signatureLocations: response.signatureLocations as ISignatureLocation[],
      };
    } catch (error) {
        console.error("PDF Worker Error (Activiness Letter):", error);
        throw error;
    }
  },

  async generateTicket(payload: {
    agenda: IAgenda;
    participant: IParticipant | ICommittee;
    amount: number;
    role: "participant" | "committee";
  }): Promise<Blob> {
    const config = useRuntimeConfig();
    const workerUrl = config.pdf_worker_api_url || "http://localhost:5000";

    try {
      const response = await $fetch<Blob>(`${workerUrl}/pdf/ticket`, {
        method: "POST",
        body: payload,
        responseType: "blob", 
      });

      return response;
    } catch (error) {
      console.error("PDF Worker Error (Ticket):", error);
      throw error;
    }
  },

  async processSignOverlay(payload: {
    pdf: string;
    outputBlobPath: string;
    qrValue: string;
    locations: SignatureBox[];
  }) {
    const config = useRuntimeConfig();
    const workerUrl = config.pdf_worker_api_url || "http://localhost:5000";

    try {
      const response = await $fetch<IWorkerResponse<string>>(`${workerUrl}/sign/process`, {
        method: "POST",
        body: payload,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data; // URL String
    } catch (error) {
      console.error("PDF Worker Error (Sign Overlay):", error);
      throw error;
    }
  }
};
