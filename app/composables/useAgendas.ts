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
    const registerAs = isRegistered.value;
    const member = (user.value as any).member;
    if (!member) return false;

    if (registerAs === "Committee") {
      return agenda.value.committees?.some(
        (reg) =>
          (reg.member as IMember)?.NIM == member.NIM &&
          !reg.approved
      );
    } else if (registerAs === "Participant") {
      return agenda.value.participants?.some((reg) => {
        const status =
          (reg.member as IMember)?.NIM == member.NIM &&
          reg.payment?.status !== "success" &&
          !reg.visiting;
        return status;
      });
    }
    return false;
  });
  const registeredId = () => {
    if (!agenda.value || !user.value) {
      return false;
    }
    const registerAs = isRegistered.value;
    const member = (user.value as any).member;
    const guest = (user.value as any).guest;

    if (registerAs === "Committee" && member) {
      const committee = agenda.value.committees?.find(
        (reg) => (reg.member as IMember)?.NIM == member.NIM
      );
      return committee ? committee._id : false;
    }
    if (registerAs === "Participant") {
      let participant;
      if (member) {
        participant = agenda.value.participants?.find(
            (reg) => (reg.member as IMember)?.NIM == member.NIM
        );
      } else if (guest) {
        participant = agenda.value.participants?.find(
             (reg) => (reg.guest as any)?._id === guest._id || (reg.guest as any)?.email === guest.email
        );
      }
      return participant ? participant._id : false;
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
    
    // Helper to safely get NIM/Guest
    const memberNIM = (user.value as any)?.member?.NIM;
    const guestEmail = (user.value as any)?.guest?.email;

    let participant;
    let committee;

    if (memberNIM) {
        participant = agenda.value.participants?.find(
        (reg) => (reg.member as IMember)?.NIM == memberNIM
        );
        committee = agenda.value.committees?.find(
        (comm) => (comm.member as IMember).NIM == memberNIM
        );
    } else if (guestEmail) {
         participant = agenda.value.participants?.find(
            (reg) => (reg.guest as IGuest)?.email == guestEmail
        );
    }

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
        // ... committee logic (guests normally aren't committees)
      if (committeePay) {
        payStatus = committee.payment?.status || "pending";
      } else {
        payStatus = false;
      }
    }
    return payStatus;
  };

  const isRegistered = computed<false | "Committee" | "Participant">(() => {
    let as: "Committee" | "Participant" | false = false;
    if (!agenda.value || !user.value) {
      return false;
    }
    
    const memberNIM = (user.value as any)?.member?.NIM;
    const guestEmail = (user.value as any)?.guest?.email;

    if (memberNIM) {
        const participant = agenda.value.participants?.some(
            (reg) => (reg.member as IMember | undefined)?.NIM == memberNIM
        );
        const committee = agenda.value.committees?.some(
            (comm) => (comm.member as IMember | undefined)?.NIM == memberNIM
        );
        if (committee) {
            as = "Committee";
        } else if (participant) {
            as = "Participant";
        }
    } else if (guestEmail) {
         const participant = agenda.value.participants?.some(
            (reg) => (reg.guest as IGuest)?.email == guestEmail
        );
        if (participant) {
            as = "Participant";
        }
    }
    
    return as;
  });
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
    
    const memberNIM = (user.value as any)?.member?.NIM;
    if (!memberNIM) return false;

    return agenda.value.committees?.some(
      (comm) =>
        (comm.member as IMember | undefined)?.NIM == memberNIM
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
