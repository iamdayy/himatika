import { IMember, IUser } from "~~/types";
import { IAgendaSchema } from "~~/types/ISchemas";

/**
 * Checks if the user is a committee member of the given agenda.
 */
/**
 * Checks if the user is a committee member of the given agenda.
 */
export async function isUserCommitteeOfAgenda(
  agendaId: string,
  user: IUser
): Promise<boolean> {
  if (!user?.member) return false;
  const { MemberModel } = await import("~~/server/models/MemberModel");
  const member = await MemberModel.findOne({ NIM: user.member.NIM });
  if (!member) return false;

  const { CommitteeModel } = await import("~~/server/models/CommitteeModel");
  const isCommittee = await CommitteeModel.exists({
    agendaId,
    member: member._id,
  });
  return !!isCommittee;
}

/**
 * Checks if the user is an organizer.
 */
export function isUserOrganizer(user: IUser): boolean {
  return !!user?.member?.organizer;
}

/**
 * Ensures the user is authenticated. Throws 401 if not.
 */
export function ensureAuthenticated(user: IUser | undefined): asserts user is IUser {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
}

/**
 * Ensures the user has committee or organizer role for the agenda.
 * Throws 401 if not authenticated, 403 if not authorized.
 */
export async function ensureCommitteeOrOrganizer(
  agendaId: string,
  user: IUser | undefined
): Promise<void> {
  ensureAuthenticated(user);
  const isCommittee = await isUserCommitteeOfAgenda(agendaId, user);
  if (!isUserOrganizer(user) && !isCommittee) {
    throw createError({
      statusCode: 403,
      statusMessage: "Only committee or organizer can perform this action",
    });
  }
}
