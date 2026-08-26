import { IAgenda, ICommittee, IMember, IParticipant, IPoint, SignatureBox } from "~~/types";
import { signTicketQR } from "~~/server/utils/qrToken";

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

/**
 * Worker base URL WITHOUT the /api suffix — every call site then includes
 * `/api/...` explicitly. This removes the split-brain where some callers
 * built `${base}/pdf/...` (requires env ending in /api) while others built
 * `${base}/api/...` (double prefix with that same env value).
 */
export function getWorkerBaseUrl(): string {
  const config = useRuntimeConfig();
  const raw = (config.pdf_worker_api_url || "http://localhost:5000").trim();
  return raw.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
}

/**
 * Authenticated fetch against the PDF worker. Attaches the short-lived
 * service JWT required by the worker's global auth gate and resolves
 * `path` (must start with /api/) against the normalized base URL.
 */
export async function pdfWorkerFetch<T>(path: string, options: any = {}): Promise<T> {
  if (!path.startsWith("/api/")) {
    throw new Error(`pdfWorkerFetch path must start with /api/: got ${path}`);
  }
  return fetchWithRetry<T>(`${getWorkerBaseUrl()}${path}`, options);
}

async function fetchWithRetry<T>(url: string, options: any, retries = MAX_RETRIES): Promise<T> {
  const config = useRuntimeConfig();
  const serviceToken = jwt.sign({ service: 'himatika-backend' }, config.jwtSecret, { expiresIn: '5m' });
  const headers = {
    "Authorization": `Bearer ${serviceToken}`,
    ...options.headers,
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return (await $fetch<any>(url, { ...options, headers })) as T;
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
    try {
      const response = await fetchWithRetry<IWorkerResponse<any>>(`${getWorkerBaseUrl()}/api/pdf/activiness-letter`, {
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

        const response = await fetchWithRetry<IWorkerResponse<any>>(`${getWorkerBaseUrl()}/api/pdf/certificate`, {
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

      const response = await fetchWithRetry<Blob>(`${getWorkerBaseUrl()}/api/pdf/ticket`, {
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
    try {
      const response = await fetchWithRetry<IWorkerResponse<string>>(`${getWorkerBaseUrl()}/api/sign/process`, {
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
