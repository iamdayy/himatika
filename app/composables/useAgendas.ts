import type { IAgenda, IMember, IUser, TPaymentStatus } from "~~/types";

export const useAgendas = (agenda: Ref<IAgenda | undefined>) => {
  const { organizer, isOrganizer } = useOrganizer();
  const { canMeRegister } = useCanMeRegister();

  const { data: dataUser, status } = useAuth();
  const user = computed(() => dataUser.value as IUser);
  const agendasMe = computed<
    { committees?: IAgenda[]; members?: IAgenda[] } | undefined
  >(() => {
    return user.value?.member.agendas;
  });
  const canMeRegisterAsCommittee = computed<boolean>(() => {
    const date = agenda.value?.configuration.committee.canRegisterUntil.end;
    const canRegister = agenda.value?.configuration.committee.canRegister;
    if (date) {
      if (new Date(date) <= new Date(Date.now())) {
        return false;
      }
    }
    if (isRegistered()) {
      return false;
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
            user.value.member &&
            typeof user.value.member[role as keyof typeof user.value.member] !==
              "undefined" &&
            Number(user.value.member[role as keyof typeof user.value.member]) <
              Number(value)
          ) {
            return true;
          }
        }
        if (typeof canRegister === "string" && canRegister.includes(">")) {
          const [role, value] = canRegister.split(">");
          if (
            user.value &&
            user.value.member &&
            typeof user.value.member[role as keyof typeof user.value.member] !==
              "undefined"
          ) {
            const memberProp =
              user.value.member[role as keyof typeof user.value.member];
            const memberPropNum =
              typeof memberProp === "number" ? memberProp : Number(memberProp);
            if (!isNaN(memberPropNum) && memberPropNum > Number(value)) {
              return true;
            }
          }
        }
        return false;
    }
  });
  const canMeRegisterAsParticipant = computed<boolean>(() => {
    const start =
      agenda.value?.configuration.participant.canRegisterUntil.start;
    const end = agenda.value?.configuration.participant.canRegisterUntil.end;
    const canRegister = agenda.value?.configuration.participant.canRegister;
    if (end && start) {
      if (
        new Date(end) <= new Date(Date.now()) ||
        new Date(start) >= new Date(Date.now())
      ) {
        return false;
      }
    }
    if (isRegistered()) {
      return false;
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
            user.value.member &&
            typeof user.value.member[role as keyof typeof user.value.member] !==
              "undefined" &&
            Number(user.value.member[role as keyof typeof user.value.member]) <
              Number(value)
          ) {
            return true;
          }
        }
        if (typeof canRegister === "string" && canRegister.includes(">")) {
          const [role, value] = canRegister.split(">");
          if (
            user.value &&
            user.value.member &&
            typeof user.value.member[role as keyof typeof user.value.member] !==
              "undefined"
          ) {
            const memberProp =
              user.value.member[role as keyof typeof user.value.member];
            const memberPropNum =
              typeof memberProp === "number" ? memberProp : Number(memberProp);
            if (!isNaN(memberPropNum) && memberPropNum > Number(value)) {
              return true;
            }
          }
        }
        return false;
    }
  });
  const canMeUnregister = computed(() => {
    if (!agenda.value) {
      return false;
    }
    if (!user.value) {
      return false;
    }
    const registerAs = isRegistered();
    if (registerAs === "Committee") {
      return agenda.value.committees?.some(
        (reg) =>
          (reg.member as IMember)?.NIM == user.value?.member.NIM &&
          !reg.approved
      );
    } else if (registerAs === "Participant") {
      return agenda.value.participants?.some((reg) => {
        const status =
          (reg.member as IMember)?.NIM == user.value?.member.NIM &&
          reg.payment?.status !== "success" &&
          !reg.visiting;
        return status;
      });
    }
    return false;
  });
  const registeredId = () => {
    if (!agenda.value) {
      return false;
    }
    const registerAs = isRegistered();
    if (registerAs === "Committee") {
      const committee = agenda.value.committees?.find(
        (reg) => (reg.member as IMember)?.NIM == user.value?.member.NIM
      );
      return committee ? committee._id : false;
    }
    if (registerAs === "Participant") {
      const participant = agenda.value.participants?.find(
        (reg) => (reg.member as IMember)?.NIM == user.value?.member.NIM
      );
      return participant ? participant._id : false;
    }
    return "";
  };
  const payStatus = () => {
    let payStatus: false | TPaymentStatus = false;
    if (!agenda.value) {
      return false;
    }
    const participantPay = agenda.value.configuration.participant.pay;
    const committeePay = agenda.value.configuration.committee.pay;
    const participant = agenda.value.participants?.find(
      (reg) => (reg.member as IMember)?.NIM == user.value?.member.NIM
    );
    const committee = agenda.value.committees?.find(
      (comm) => (comm.member as IMember).NIM == user.value?.member.NIM
    );
    if (!participant && !committee) {
      return false;
    }
    if (participant) {
      if (participantPay) {
        payStatus = participant.payment?.status || "pending";
      } else {
        payStatus = false;
      }
    }
    if (committee) {
      if (committeePay) {
        payStatus = committee.payment?.status || "pending";
      } else {
        payStatus = false;
      }
    }
    return payStatus;
  };
  const isRegistered = () => {
    let as: "Committee" | "Participant" | false = false;
    if (!agenda.value) {
      return false;
    }
    if (!user.value) {
      return false;
    }
    const participant = agenda.value.participants?.some(
      (reg) =>
        (reg.member as IMember | undefined)?.NIM == user.value?.member.NIM
    );
    const committee = agenda.value.committees?.some(
      (comm) =>
        (comm.member as IMember | undefined)?.NIM == user.value.member.NIM
    );
    if (committee) {
      as = "Committee";
    } else if (participant) {
      as = "Participant";
    } else {
      as = false;
    }
    return as;
  };
  const isCommittee = computed(() => {
    if (status.value !== "authenticated") {
      return false;
    }
    if (!agenda.value) {
      return false;
    }
    if (!agenda.value.committees) {
      return false;
    }
    if (isOrganizer.value) {
      return true;
    }
    return agenda.value.committees?.some(
      (comm) =>
        (comm.member as IMember | undefined)?.NIM == user.value?.member.NIM
    );
  });
  return {
    agendasMe,
    isRegistered,
    isCommittee,
    registeredId,
    payStatus,
    canMeRegisterAsCommittee,
    canMeRegisterAsParticipant,
    canMeUnregister,
  };
};
