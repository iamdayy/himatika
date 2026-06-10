import { useStatsStore } from "~/stores/useStatsStore";
import type { IAgenda, IGuest, IMember, TPaymentStatus } from "~~/types";

export const useAgendas = (agenda: Ref<IAgenda | undefined>) => {
  const organizerState = useOrganizerStore();
  const { organizer, isOrganizer } = storeToRefs(organizerState);

  const { data: dataUser, status } = useAuth();
  const user = computed(() => dataUser.value);

  // Use stats store for deep data (agendasMe)
  const statsStore = useStatsStore();
  const { agendasMe } = storeToRefs(statsStore);
  const canMeRegisterAsCommittee = computed<boolean>(() => {
    const date = agenda.value?.configuration.committee.canRegisterUntil.end;
    const canRegister = agenda.value?.configuration.committee.canRegister;
    if (date) {
      if (new Date(date) <= new Date(Date.now())) {
        return false;
      }
    }
    if (isRegistered.value) {
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
    if (isRegistered.value) {
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
            member[role as keyof typeof member]
          ) {
            const memberProp =
              member[role as keyof typeof member];
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

    if (agenda.value.myCommittee) {
      return !agenda.value.myCommittee.approved;
    } else if (agenda.value.myParticipant) {
      return agenda.value.myParticipant.payment?.status !== "success" && !agenda.value.myParticipant.visiting;
    }
    return false;
  });
  
  const registeredId = () => {
    if (!agenda.value || !user.value) {
      return false;
    }

    if (agenda.value.myCommittee) {
      return agenda.value.myCommittee._id;
    }
    if (agenda.value.myParticipant) {
      return agenda.value.myParticipant._id;
    }
    return "";
  };

  const payStatus = () => {
    let payStatus: false | TPaymentStatus = false;
    if (!agenda.value || !user.value) {
      return false;
    }
    const participantPay = agenda.value.configuration.participant.pay;
    const committeePay = agenda.value.configuration.committee.pay;

    const participant = agenda.value.myParticipant;
    const committee = agenda.value.myCommittee;

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

  const isRegistered = computed<false | "Committee" | "Participant">(() => {
    if (!agenda.value || !user.value) {
      return false;
    }
    
    if (agenda.value.myCommittee) {
      return "Committee";
    }
    if (agenda.value.myParticipant) {
      return "Participant";
    }
    
    return false;
  });

  const isCommittee = computed(() => {
    if (status.value !== "authenticated") {
      return false;
    }
    if (!agenda.value) {
      return false;
    }
    if (isOrganizer.value) {
      return true;
    }
    
    return !!agenda.value.myCommittee;
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
