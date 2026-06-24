import type { IUser } from "./index";
import type { IOrganizer } from "./index";

declare module 'h3' {
  interface H3EventContext {
    user?: IUser;
    organizer?: IOrganizer | null;
  }
}
