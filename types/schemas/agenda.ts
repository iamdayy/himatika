import type { DatePickerRangeObject } from "v-calendar/dist/types/src/use/datePicker.js";
import type { ICommittee } from "..";

export interface AddAgendaSchema {
  title: string;
  description: string;
  date: {
    start: Date;
    end: Date;
  };
  at: string;
  atLink?: string;
  registerLink?: string;
  committee: ICommittee[];
  point: number;
  payIn: number;
  onlyRegisteredCanVisit?: boolean;
  canSee?: string;
  canRegister?: string;
  messageAfterRegister?: string;
  enableSubscription: boolean;
}

export interface EditAgendaSchema {
  title: string;
  description: string;
  date: {
    start: Date;
    end: Date;
  };
  at: string;
  atLink?: string;
  registerLink?: string;
  committee: ICommittee[];
  point: number;
  payIn?: number;
  onlyRegisteredCanVisit?: boolean;
  canSee?: string;
  canRegister?: string;
  messageAfterRegister?: string;
}
