import type { TRole } from "~~/types";
export const useCanMeRegister = () => {
  const { organizer } = useOrganizer();
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
        if (typeof canRegister === "string" && canRegister.includes(":")) {
          const [role, value] = canRegister.split(":");
          if (
            user.value &&
            value == user.value.member[role as keyof typeof user.value.member]
          ) {
            return true;
          }
        }
        if (typeof canRegister === "string" && canRegister.includes("<")) {
          const [role, value] = canRegister.split("<");
          if (
            user.value &&
            user.value.member[role as keyof typeof user.value.member] <
              Number(value)
          ) {
            return true;
          }
        }
        if (typeof canRegister === "string" && canRegister.includes(">")) {
          const [role, value] = canRegister.split(">");

          if (
            user.value &&
            user.value.member[role as keyof typeof user.value.member] >
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
