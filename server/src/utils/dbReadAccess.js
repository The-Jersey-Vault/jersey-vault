const PUBLIC_READ_FIELDS = {
  products: new Set([
    "id", "name", "price", "stock", "size_stock", "image_url", "status", "type",
    "team_id", "category", "sub_category", "description", "featured", "is_clearance",
    "is_26_27", "slug", "active", "teams",
  ]),
  teams: new Set([
    "id", "name", "logo_url", "sport", "slug", "league", "country", "category",
    "description", "short_name", "image_url", "active", "is_active", "jersey_count",
  ]),
  site_settings: new Set(["key", "value"]),
};

const QUERY_CONTROL_FIELDS = new Set(["select", "order", "limit", "offset", "single"]);
const PUBLIC_SITE_SETTING_KEY = "featured_category_name";

export function isPublicDbReadTable(table) {
  return Object.prototype.hasOwnProperty.call(PUBLIC_READ_FIELDS, String(table || "").toLowerCase());
}

export function isPublicDbReadQueryAllowed(table, query = {}) {
  const tableName = String(table || "").toLowerCase();
  const allowedFields = PUBLIC_READ_FIELDS[tableName];
  if (!allowedFields) return false;

  for (const [key, value] of Object.entries(query)) {
    if (QUERY_CONTROL_FIELDS.has(key)) continue;
    if (!allowedFields.has(key)) return false;
    if (tableName === "site_settings" && key === "key" && value !== `eq.${PUBLIC_SITE_SETTING_KEY}`) {
      return false;
    }
    if (Array.isArray(value) || typeof value !== "string") return false;
  }

  if (query.order !== undefined) {
    if (typeof query.order !== "string") return false;
    const orderParts = query.order.split(".");
    const [field, direction] = orderParts;
    if (orderParts.length > 2) return false;
    if (!allowedFields.has(field) || (direction && !["asc", "desc"].includes(direction))) return false;
  }

  if (query.select !== undefined && query.select !== "*") {
    if (typeof query.select !== "string") return false;
    const requestedFields = query.select.split(",").map((field) => field.trim()).filter(Boolean);
    if (!requestedFields.length || requestedFields.some((field) => !allowedFields.has(field))) return false;
  }

  return true;
}

export function projectPublicDbRows(table, rows) {
  const tableName = String(table || "").toLowerCase();
  const allowedFields = PUBLIC_READ_FIELDS[tableName];
  if (!allowedFields) return [];

  return (Array.isArray(rows) ? rows : [])
    .filter((row) => tableName !== "site_settings" || row?.key === PUBLIC_SITE_SETTING_KEY)
    .map((row) => Object.fromEntries(
      Object.entries(row || {})
        .filter(([field]) => allowedFields.has(field))
        .map(([field, value]) => [
          field,
          tableName === "products" && field === "teams"
            ? projectPublicTeamRelation(value)
            : value,
        ])
    ));
}

function projectPublicTeamRelation(value) {
  const fields = PUBLIC_READ_FIELDS.teams;
  const project = (team) => team && typeof team === "object"
    ? Object.fromEntries(Object.entries(team).filter(([field]) => fields.has(field)))
    : team;
  return Array.isArray(value) ? value.map(project) : project(value);
}

export function createDbReadAccessMiddleware(adminGuard) {
  return (req, res, next) => {
    if (isPublicDbReadTable(req.params?.table)) return next();
    return adminGuard(req, res, next);
  };
}
