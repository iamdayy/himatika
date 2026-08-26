/**
 * Single source of truth for activity-point calculation.
 *
 * Used by MemberModel.calculatePoints (virtual), /api/member aggregation,
 * and any other surface — so every view shows identical numbers.
 *
 * Rules (README §Points System Logic):
 * - Agenda participation/committee: agenda must fall ENTIRELY inside the
 *   semester window; committee additionally requires approval.
 * - Published projects inside the window: 75 pts each.
 * - Non-deleted, non-archived aspirations created inside window: 50 pts each.
 * - Manual logs: only status "approved", dated inside window.
 */

export interface PointWindow {
  start: Date;
  end: Date;
}

export const PROJECT_POINTS = 75;
export const ASPIRATION_POINTS = 50;

type AnyDate = unknown;

const toDate = (d: AnyDate): Date | null => {
  if (!d) return null;
  const t = new Date(d as any);
  return isNaN(t.getTime()) ? null : t;
};

export function dateInWindow(d: AnyDate, window: PointWindow): boolean {
  const t = toDate(d);
  return !!t && t >= window.start && t <= window.end;
}

/** Agendas must fall entirely within the window (start AND end). */
export function agendaInWindow(
  agenda: { date?: { start?: AnyDate; end?: AnyDate } } | null | undefined,
  window: PointWindow
): boolean {
  const start = toDate(agenda?.date?.start);
  const end = toDate(agenda?.date?.end);
  if (!start || !end) return false;
  return (
    start >= window.start &&
    start <= window.end &&
    end >= window.start &&
    end <= window.end
  );
}

export interface PointRows {
  committeeAgendas?: Array<{
    approved?: boolean;
    visiting?: boolean;
    agendaId?: {
      configuration?: { committee?: { point?: number } };
      date?: { start?: AnyDate; end?: AnyDate };
    };
  }>;
  participantAgendas?: Array<{
    visiting?: boolean;
    agendaId?: {
      configuration?: { participant?: { point?: number } };
      date?: { start?: AnyDate; end?: AnyDate };
    };
  }>;
  projects?: Array<{ published?: boolean; date?: AnyDate }>;
  aspirations?: Array<{
    deleted?: boolean;
    archived?: boolean;
    createdAt?: AnyDate;
  }>;
  manualLogs?: Array<{
    status?: string;
    date?: AnyDate;
    amount?: number;
  }>;
}

export function computeActivityPoints(rows: PointRows, window: PointWindow): number {
  const committeePts = (rows.committeeAgendas ?? [])
    .filter((c) => c.approved === true && c.visiting === true && agendaInWindow(c.agendaId, window))
    .reduce((acc, c) => acc + (c.agendaId?.configuration?.committee?.point || 0), 0);

  const participantPts = (rows.participantAgendas ?? [])
    .filter((p) => p.visiting === true && agendaInWindow(p.agendaId, window))
    .reduce((acc, p) => acc + (p.agendaId?.configuration?.participant?.point || 0), 0);

  const projectPts = (rows.projects ?? []).filter(
    (p) => p.published === true && dateInWindow(p.date, window)
  ).length * PROJECT_POINTS;

  const aspirationPts = (rows.aspirations ?? []).filter(
    (a) => !a.deleted && !a.archived && dateInWindow(a.createdAt, window)
  ).length * ASPIRATION_POINTS;

  const manualPts = (rows.manualLogs ?? [])
    .filter((m) => m.status === "approved" && dateInWindow(m.date, window))
    .reduce((acc, m) => acc + (m.amount || 0), 0);

  return committeePts + participantPts + projectPts + aspirationPts + manualPts;
}
