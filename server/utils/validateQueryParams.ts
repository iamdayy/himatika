/**
 * Allowed sort fields per resource type.
 * Only fields listed here may be used as sort keys to prevent NoSQL injection
 * via dynamic property names (e.g. `{ [sort]: -1 }`).
 */
export const SORT_ALLOWLISTS: Record<string, ReadonlySet<string>> = {
  agenda: new Set(["title", "date.start", "date.end", "createdAt", "updatedAt", "status"]),
  member: new Set(["NIM", "fullName", "email", "class", "semester", "point", "status", "createdAt", "enteredYear"]),
  news: new Set(["title", "date", "createdAt", "updatedAt", "status"]),
  photo: new Set(["title", "createdAt", "updatedAt"]),
  doc: new Set(["label", "createdAt", "updatedAt"]),
  video: new Set(["title", "createdAt", "updatedAt"]),
  aspiration: new Set(["createdAt", "updatedAt", "status"]),
  message: new Set(["subject", "createdAt", "updatedAt", "status"]),
  signatures: new Set(["createdAt", "updatedAt", "signed"]),
  project: new Set(["title", "deadline", "createdAt", "updatedAt", "status"]),
  category: new Set(["name", "createdAt", "updatedAt"]),
};

/**
 * Allowed filterBy fields per resource type.
 */
export const FILTER_BY_ALLOWLISTS: Record<string, ReadonlySet<string>> = {
  member: new Set(["status", "class", "semester", "religion", "citizen", "enteredYear", "sex"]),
  aspiration: new Set(["status", "type"]),
  message: new Set(["status", "type"]),
};

/**
 * Validates a `sort` query parameter against a resource-specific allowlist.
 * Throws a 400 error if the field is not allowed.
 */
export function validateSortField(resource: string, sort: string | undefined): void {
  if (!sort) return;
  const allowlist = SORT_ALLOWLISTS[resource];
  if (!allowlist || !allowlist.has(sort)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid sort field: '${sort}'`,
    });
  }
}

/**
 * Validates a `filterBy` query parameter against a resource-specific allowlist.
 * Throws a 400 error if the field is not allowed.
 */
export function validateFilterByField(resource: string, filterBy: string | undefined): void {
  if (!filterBy) return;
  const allowlist = FILTER_BY_ALLOWLISTS[resource];
  if (!allowlist || !allowlist.has(filterBy)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid filterBy field: '${filterBy}'`,
    });
  }
}
