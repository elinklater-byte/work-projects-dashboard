import { google, sheets_v4 } from "googleapis";

// This talks to a DIFFERENT spreadsheet than lib/sheets.ts — the one behind
// your Daily Dashboard app (dailydashboard-lemon.vercel.app), not the one
// behind this Work Projects app. It reuses the same service account
// credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY), so that
// sheet just needs to be *shared* with the same service account email —
// see the README for the one-time setup step.

const SHEET_ID = process.env.DAILY_DASHBOARD_SHEET_ID || "";
// Set DAILY_DASHBOARD_SHEET_TAB if your tab is named something other than this.
const PREFERRED_TAB = process.env.DAILY_DASHBOARD_SHEET_TAB || "To Do Database";

// Column order in the Daily Dashboard sheet, left to right:
// [checkbox], Task, Status, Due Date, Priority, Category, Sub Category, Repeat, Notes, Assignee, Family Agenda
const ROW_WIDTH = 11;

let cachedClient: sheets_v4.Sheets | null = null;
let cachedTabName: string | null = null;

function getClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!SHEET_ID || !email || !rawKey) {
    throw new Error(
      "Missing Daily Dashboard configuration. Set DAILY_DASHBOARD_SHEET_ID in your environment, and make sure the sheet is shared with your GOOGLE_SERVICE_ACCOUNT_EMAIL."
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

async function resolveTabName(sheets: sheets_v4.Sheets): Promise<string> {
  if (cachedTabName) return cachedTabName;
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const titles = (meta.data.sheets || []).map((s) => s.properties?.title || "");
  cachedTabName = titles.includes(PREFERRED_TAB) ? PREFERRED_TAB : titles[0] || PREFERRED_TAB;
  return cachedTabName;
}

export interface DailyDashboardTaskInput {
  title: string;
  dueDate: string | null; // expected as YYYY-MM-DD, same as the <input type="date"> value
  notes?: string;
  projectName?: string;
}

export async function sendTaskToDailyDashboard(input: DailyDashboardTaskInput): Promise<void> {
  const sheets = getClient();
  const tab = await resolveTabName(sheets);

  const noteParts: string[] = [];
  if (input.notes) noteParts.push(input.notes);
  if (input.projectName) noteParts.push(`Project: ${input.projectName}`);

  const row = new Array(ROW_WIDTH).fill("");
  row[0] = "TRUE"; // the unlabeled checkbox column — matches how your own quick-add rows look
  row[1] = input.title; // Task
  row[2] = "Not started"; // Status
  row[3] = input.dueDate ?? ""; // Due Date
  row[4] = "Moderate"; // Priority
  row[5] = "Work"; // Category
  row[6] = "Work Projects"; // Sub Category — matches the tag you've already used for work-project tasks
  row[7] = ""; // Repeat
  row[8] = noteParts.join(" — "); // Notes
  row[9] = ""; // Assignee
  row[10] = ""; // Family Agenda

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A:K`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}
