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

import jwt from "jsonwebtoken";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function fetchWithRetry<T>(url: string, options: any, retries = MAX_RETRIES): Promise<T> {
  const config = useRuntimeConfig();
  const serviceToken = jwt.sign({ service: 'himatika-backend' }, config.jwtSecret, { expiresIn: '5m' });
  const headers = {
    "Authorization": `Bearer ${serviceToken}`,
    ...options.headers,
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await $fetch<T>(url, { ...options, headers });
    } catch (error: any) {
      const isLastAttempt = attempt === retries;
      const isRetryable = error?.statusCode >= 500 || error?.code === 'ECONNREFUSED';

      if (isLastAttempt || !isRetryable) throw error;

      console.warn(`PDF Worker call failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw new Error("Unreachable");
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
    };
    activitiesDetails?: {
      committees: { title: string; date: string | null; role: string; job: string; point: number }[];
      participants: { title: string; date: string | null; role: string; job: string; point: number }[];
      projects: { title: string; date: string | null; role: string; job: string; point: number }[];
      aspirations: { title: string; date: string | null; role: string; job: string; point: number }[];
    };
  }) {
    const config = useRuntimeConfig();
    const workerUrl = config.pdf_worker_api_url || "http://localhost:5000";

    try {
      const response = await fetchWithRetry<IWorkerResponse<any>>(`${workerUrl}/pdf/activiness-letter`, {
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
      const certConfig = payload.agenda.configuration?.certificate;
      if (certConfig && certConfig.active && certConfig.templateUrl) {
        const member = payload.role === 'participant' 
                 ? ((payload.participant as any).member || (payload.participant as any).guest) 
                 : (payload.participant as any).member;
        
        const certificateData = {
          name: member?.fullName || "Peserta",
          role: payload.role === 'participant' ? 'Peserta' : (payload.participant as any).job?.name || 'Panitia',
          date: payload.agenda.date?.start?.toString().split('T')[0],
          qr_data: `${config.public_url || 'https://himatika.org'}/verify/ticket/${payload.participant._id}`
        };

        const response = await fetchWithRetry<IWorkerResponse<any>>(`${workerUrl}/pdf/certificate`, {
          method: "POST",
          body: {
            templateUrl: certConfig.templateUrl,
            items: certConfig.items,
            data: certificateData
          }
        });

        if (response.error || !response.url) {
          throw new Error(response.error || "Failed to generate certificate");
        }

        const pdfResponse = await fetch(response.url);
        return await pdfResponse.blob();
      }

      const response = await fetchWithRetry<Blob>(`${workerUrl}/pdf/ticket`, {
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
    signerName?: string; // nama member (dicetak di bawah QR)
    signerAs?: string;   // jabatan penandatangan
  }) {
    const config = useRuntimeConfig();
    const workerUrl = config.pdf_worker_api_url || "http://localhost:5000";

    try {
      const response = await fetchWithRetry<IWorkerResponse<string>>(`${workerUrl}/sign/process`, {
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
