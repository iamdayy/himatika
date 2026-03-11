import type { TRole } from "~~/types";
export const useCanMeRegister = () => {
  const organizerStore = useOrganizerStore();
  const { organizer } = storeToRefs(organizerStore);
  const { data: user } = useAuth();
  const canMeRegister = (canRegister: TRole, date?: Date) => {
    if (date) {
      if (new Date(date) <= new Date(Date.now())) {
        return false;
      }
    }
    switch (canRegister) {
      case "None":
        return false;
      case "Public":
        return true;
      case "Organizer":
        if (organizer.value) {
          return true;
        }
        return false;
      case "Member":
        if (user.value?.member) {
          return true;
        }
        return false;
      default:
        // Ensure user is a Member before checking member roles
        if (!user.value || !(user.value as any).member) return false;
        
        const member = (user.value as any).member;
        
        if (typeof canRegister === "string" && canRegister.includes(":")) {
          const [role, value] = canRegister.split(":");
          if (
            value == member[role as keyof typeof member]
          ) {
            return true;
          }
        }
        if (typeof canRegister === "string" && canRegister.includes("<")) {
          const [role, value] = canRegister.split("<");
          if (
            member[role as keyof typeof member] <
              Number(value)
          ) {
            return true;
          }
        }
        if (typeof canRegister === "string" && canRegister.includes(">")) {
          const [role, value] = canRegister.split(">");

          if (
            member[role as keyof typeof member] >
              Number(value)
          ) {
            return true;
          }
        }
        return false;
    }
  };
  return {
    canMeRegister,
  };
};
