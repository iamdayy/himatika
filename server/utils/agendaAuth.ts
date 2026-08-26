import mongoose from "mongoose";
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
 * Ensures the user is committee or organizer for the agenda.
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

/**
 * Resolves the caller's Member _id from the DB. Token claims may lack
 * `member._id` (access tokens minted at signin omit it), so NIM is the
 * reliable key — never trust the claim's id field directly.
 */
export async function resolveMemberId(
  user: IUser | undefined
): Promise<string | null> {
  if (!user?.member) return null;
  const claimId = (user.member as any)._id;
  if (claimId) return String(claimId);
  const { MemberModel } = await import("~~/server/models/MemberModel");
  const member = await MemberModel.findOne({ NIM: user.member.NIM })
    .select("_id")
    .lean();
  return member ? String((member as any)._id) : null;
}

/**
 * Authoritative organizer check against the DB, covering ALL six position
 * shapes (the JWT claim only populates four of the six virtuals, so staff
 * roles were previously rejected). A demoted organizer also loses access
 * immediately instead of after token expiry.
 */
export async function isUserOrganizerDb(user: IUser | undefined): Promise<boolean> {
  if (!user?.member) return false;
  if (isUserOrganizer(user)) return true; // fast path from fresh claims

  const memberId = await resolveMemberId(user);
  if (!memberId) return false;
  const memberObjectId = new (mongoose.Types.ObjectId)(memberId);

  const { OrganizerModel } = await import("~~/server/models/OrganizerModel");
  const now = new Date();
  const active = await OrganizerModel.exists({
    "period.end": { $gte: now },
    $or: [
      { considerationBoard: memberObjectId },
      { dailyManagement: { $elemMatch: { member: memberObjectId } } },
      { dailyManagement: { $elemMatch: { staff: memberObjectId } } },
      { department: { $elemMatch: { coordinator: memberObjectId } } },
      { department: { $elemMatch: { members: memberObjectId } } },
      { department: { $elemMatch: { staff: memberObjectId } } },
    ],
  });
  return !!active;
}

/**
 * Gate for organizer-only actions (manual point awards, approvals).
 */
export async function ensureOrganizer(user: IUser | undefined): Promise<void> {
  ensureAuthenticated(user);
  if (!(await isUserOrganizerDb(user))) {
    throw createError({
      statusCode: 403,
      statusMessage: "Hanya organizer yang dapat melakukan aksi ini",
    });
  }
}

/**
 * True when the session owns the given registration (member NIM match or
 * guest identity match). Works with populated docs, raw ObjectIds, and
 * guest-id-string token shapes alike.
 */
export async function userOwnsRegistration(
  user: IUser | undefined,
  registration: { member?: unknown; guest?: unknown } | null | undefined
): Promise<boolean> {
  if (!user || !registration) return false;

  const memberId = await resolveMemberId(user);
  if (memberId && registration.member) {
    const regMember =
      typeof registration.member === "object" && registration.member !== null
        ? String((registration.member as any)._id)
        : String(registration.member);
    if (regMember === memberId) return true;
  }

  if (user.guest && registration.guest) {
    const sessionGuestId =
      typeof user.guest === "string"
        ? user.guest
        : String((user.guest as any)?._id ?? "");
    const regGuest =
      typeof registration.guest === "object" && registration.guest !== null
        ? String((registration.guest as any)._id)
        : String(registration.guest);
    if (sessionGuestId && regGuest === sessionGuestId) return true;
  }

  return false;
}
