import { randomUUID } from "node:crypto";
import { google, sheets_v4 } from "googleapis";
import type { Project, Item, Status, Goal } from "./types";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";

const PROJECTS_SHEET = "Projects";
const ITEMS_SHEET = "Items";

const PROJECTS_HEADERS = ["id", "name", "archived", "createdAt", "updatedAt"] as const;

// NOTE: "goal" and "sentToDailyDashboard" were appended at the end on purpose.
// Adding columns at the end (rather than in the middle) keeps any rows that
// already exist in your sheet working — old rows will just read back as
// goal="none" / sentToDailyDashboard=false, which is exactly what you want.
const ITEMS_HEADERS = [
  "id",
  "projectId",
  "parentId",
  "title",
  "date",
  "notes",
  "status",
  "onDashboard",
  "createdAt",
  "updatedAt",
  "goal",
  "sentToDailyDashboard",
] as const;

let cachedClient: sheets_v4.Sheets | null = null;

function getClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!SHEET_ID || !email || !rawKey) {
    throw new Error(
      "Missing Google Sheets configuration. Set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in your environment."
    );
  }

  const key = rawKey.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

function colLetter(n: number): string {
  let s = "";
  let num = n;
  while (num > 0) {
    const m = (num - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    num = Math.floor((num - m) / 26);
  }
  return s;
}

// ---------- sheet / header bootstrap ----------

async function ensureSheetExists(name: string, headers: readonly string[]) {
  const sheets = getClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existing = meta.data.sheets?.map((s) => s.properties?.title) || [];

  if (!existing.includes(name)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: name } } }] },
    });
  }

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${name}!1:1`,
  });
  const row = headerRes.data.values?.[0];
  if (!row || row.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${name}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers as unknown as string[]] },
    });
  } else if (row.length < headers.length) {
    // Existing sheet predates a header we've since added (e.g. "goal") — extend it in place.
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${name}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers as unknown as string[]] },
    });
  }
}

export async function ensureSheets() {
  await ensureSheetExists(PROJECTS_SHEET, PROJECTS_HEADERS);
  await ensureSheetExists(ITEMS_SHEET, ITEMS_HEADERS);
}

// ---------- generic row helpers ----------

async function readRows(name: string, headers: readonly string[]): Promise<Record<string, string>[]> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${name}!A2:${colLetter(headers.length)}`,
  });
  const rows = res.data.values || [];
  return rows
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = row[i] ?? ""));
      return obj;
    })
    .filter((o) => o.id);
}

async function appendRow(name: string, headers: readonly string[], obj: Record<string, string>) {
  const sheets = getClient();
  const values = headers.map((h) => obj[h] ?? "");
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${name}!A:A`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

async function findRowNumber(name: string, id: string): Promise<number | null> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${name}!A2:A`,
  });
  const rows = res.data.values || [];
  const idx = rows.findIndex((r) => r[0] === id);
  return idx === -1 ? null : idx + 2; // +1 for header row, +1 for 1-based index
}

async function updateRowById(
  name: string,
  headers: readonly string[],
  id: string,
  updates: Record<string, string>
) {
  const sheets = getClient();
  const rowNum = await findRowNumber(name, id);
  if (!rowNum) throw new Error(`Row with id ${id} not found in ${name}`);

  const existingRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${name}!A${rowNum}:${colLetter(headers.length)}${rowNum}`,
  });
  const existing = existingRes.data.values?.[0] || [];
  const merged = headers.map((h, i) => (updates[h] !== undefined ? updates[h] : existing[i] ?? ""));

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${name}!A${rowNum}:${colLetter(headers.length)}${rowNum}`,
    valueInputOption: "RAW",
    requestBody: { values: [merged] },
  });
}

async function getSheetGid(name: string): Promise<number> {
  const sheets = getClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === name);
  if (sheet?.properties?.sheetId == null) throw new Error(`Sheet ${name} not found`);
  return sheet.properties.sheetId;
}

async function deleteRowById(name: string, id: string) {
  const rowNum = await findRowNumber(name, id);
  if (!rowNum) return;
  const sheets = getClient();
  const gid = await getSheetGid(name);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId: gid, dimension: "ROWS", startIndex: rowNum - 1, endIndex: rowNum },
          },
        },
      ],
    },
  });
}

// ---------- row <-> model conversions ----------

function rowToProject(r: Record<string, string>): Project {
  return {
    id: r.id,
    name: r.name,
    archived: r.archived === "TRUE",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function projectToRow(p: Partial<Project>): Record<string, string> {
  const row: Record<string, string> = {};
  if (p.id !== undefined) row.id = p.id;
  if (p.name !== undefined) row.name = p.name;
  if (p.archived !== undefined) row.archived = p.archived ? "TRUE" : "FALSE";
  if (p.createdAt !== undefined) row.createdAt = p.createdAt;
  if (p.updatedAt !== undefined) row.updatedAt = p.updatedAt;
  return row;
}

function rowToItem(r: Record<string, string>): Item {
  return {
    id: r.id,
    projectId: r.projectId,
    parentId: r.parentId ? r.parentId : null,
    title: r.title,
    date: r.date ? r.date : null,
    notes: r.notes || "",
    status: (r.status as Status) || "Not Started",
    onDashboard: r.onDashboard === "TRUE",
    goal: (r.goal as Goal) || "none",
    sentToDailyDashboard: r.sentToDailyDashboard === "TRUE",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function itemToRow(i: Partial<Item>): Record<string, string> {
  const row: Record<string, string> = {};
  if (i.id !== undefined) row.id = i.id;
  if (i.projectId !== undefined) row.projectId = i.projectId;
  if (i.parentId !== undefined) row.parentId = i.parentId ?? "";
  if (i.title !== undefined) row.title = i.title;
  if (i.date !== undefined) row.date = i.date ?? "";
  if (i.notes !== undefined) row.notes = i.notes;
  if (i.status !== undefined) row.status = i.status;
  if (i.onDashboard !== undefined) row.onDashboard = i.onDashboard ? "TRUE" : "FALSE";
  if (i.goal !== undefined) row.goal = i.goal;
  if (i.sentToDailyDashboard !== undefined) row.sentToDailyDashboard = i.sentToDailyDashboard ? "TRUE" : "FALSE";
  if (i.createdAt !== undefined) row.createdAt = i.createdAt;
  if (i.updatedAt !== undefined) row.updatedAt = i.updatedAt;
  return row;
}

// ---------- public API ----------

export async function getAllData(): Promise<{ projects: Project[]; items: Item[] }> {
  await ensureSheets();
  const [projectRows, itemRows] = await Promise.all([
    readRows(PROJECTS_SHEET, PROJECTS_HEADERS),
    readRows(ITEMS_SHEET, ITEMS_HEADERS),
  ]);
  return {
    projects: projectRows.map(rowToProject),
    items: itemRows.map(rowToItem),
  };
}

export async function createProject(name: string): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = { id: randomUUID(), name, archived: false, createdAt: now, updatedAt: now };
  await appendRow(PROJECTS_SHEET, PROJECTS_HEADERS, projectToRow(project));
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const row = projectToRow({ ...updates, updatedAt: new Date().toISOString() });
  await updateRowById(PROJECTS_SHEET, PROJECTS_HEADERS, id, row);
}

export async function deleteProject(id: string): Promise<void> {
  const { items } = await getAllData();
  const toDelete = items.filter((i) => i.projectId === id);
  for (const item of toDelete) {
    await deleteRowById(ITEMS_SHEET, item.id);
  }
  await deleteRowById(PROJECTS_SHEET, id);
}

type NewItemInput = {
  projectId: string;
  parentId: string | null;
  title: string;
  date?: string | null;
  notes?: string;
  status?: Status;
  onDashboard?: boolean;
  goal?: Goal;
  sentToDailyDashboard?: boolean;
};

export async function createItem(input: NewItemInput): Promise<Item> {
  const now = new Date().toISOString();
  const item: Item = {
    id: randomUUID(),
    projectId: input.projectId,
    parentId: input.parentId ?? null,
    title: input.title,
    date: input.date ?? null,
    notes: input.notes ?? "",
    status: input.status ?? "Not Started",
    onDashboard: input.onDashboard ?? false,
    goal: input.goal ?? "none",
    sentToDailyDashboard: input.sentToDailyDashboard ?? false,
    createdAt: now,
    updatedAt: now,
  };
  await appendRow(ITEMS_SHEET, ITEMS_HEADERS, itemToRow(item));
  return item;
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<void> {
  const row = itemToRow({ ...updates, updatedAt: new Date().toISOString() });
  await updateRowById(ITEMS_SHEET, ITEMS_HEADERS, id, row);
}

function collectDescendantIds(items: Item[], rootId: string): string[] {
  const children = items.filter((i) => i.parentId === rootId);
  let ids: string[] = [];
  for (const c of children) {
    ids.push(c.id);
    ids = ids.concat(collectDescendantIds(items, c.id));
  }
  return ids;
}

export async function deleteItem(id: string): Promise<void> {
  const { items } = await getAllData();
  const descendantIds = collectDescendantIds(items, id);
  for (const did of descendantIds) {
    await deleteRowById(ITEMS_SHEET, did);
  }
  await deleteRowById(ITEMS_SHEET, id);
}
