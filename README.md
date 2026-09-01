# Work Projects Dashboard

A personal project-management dashboard: projects → tasks → subtasks → sub-subtasks (nested to any depth), each with a date, status, notes, a completion checkbox, and a goal timeframe. Any item can be pinned to the top of the app, or sent straight into your separate Daily Dashboard app. Google Sheets is the live database, so your data lives in a spreadsheet you fully control. Five color themes are built in, switchable anytime from the header (Berry & Plum is the default).

---

## 1. Set up your Google Sheet (your database)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new, blank spreadsheet. Name it anything (e.g. "Work Projects Data").
2. Copy the **Sheet ID** from its URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART_IS_THE_ID`**`/edit`
3. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project (top-left project dropdown → New Project). Any name is fine.
4. With that project selected, go to **APIs & Services → Library**, search **Google Sheets API**, and click **Enable**.
5. Go to **APIs & Services → Credentials → Create Credentials → Service Account**. Give it any name (e.g. "work-dashboard"). No roles/permissions needed — click through to Done.
6. Click into the service account you just made → **Keys** tab → **Add Key → Create New Key → JSON**. This downloads a `.json` file — keep it safe, don't commit it anywhere.
7. Open that JSON file. You need two values from it: `client_email` and `private_key`.
8. Back in your Google Sheet, click **Share**, paste in the `client_email` address, and give it **Editor** access.

That's it for Google's side — the app creates its own "Projects" and "Items" tabs with the right columns automatically the first time it runs.

---

## 2. Run it locally first (recommended before deploying)

1. Unzip this project and open a terminal inside the folder.
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the example env file:
   ```
   cp .env.local.example .env.local
   ```
4. Open `.env.local` and fill in the three Google Sheets values (see section 5 below for the two Daily Dashboard values):
   - `GOOGLE_SHEET_ID` — from step 1.2 above
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the `client_email` from the JSON key
   - `GOOGLE_PRIVATE_KEY` — the `private_key` from the JSON key, kept in quotes, with the `\n` characters left exactly as they appear in the JSON file
5. Start the dev server:
   ```
   npm run dev
   ```
6. Open `http://localhost:3000`. Add a project and a task — then check your Google Sheet, you should see the new rows appear.

If you see an error banner in the app instead, it's almost always one of: the Sheets API isn't enabled, the sheet isn't shared with the service account email, or a typo in `.env.local`.

---

## 3. Push the code to GitHub

From inside the project folder:
```
git init
git add .
git commit -m "Initial commit"
```
Then, on [github.com](https://github.com), create a new **empty** repository (don't add a README or .gitignore there — you already have them). Then:
```
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 4. Deploy on Vercel

1. In your Vercel dashboard, click **Add New… → Project**, and import the GitHub repo you just pushed.
2. Before clicking Deploy, expand **Environment Variables** and add all five variables from your `.env.local` (the three Google Sheets ones, plus `DAILY_DASHBOARD_SHEET_ID` and, if needed, `DAILY_DASHBOARD_SHEET_TAB` — see section 5):
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (paste it including the `\n` sequences exactly as in the JSON file, wrapped in quotes)
   - `DAILY_DASHBOARD_SHEET_ID`
3. Click **Deploy**.
4. Once it finishes, you'll get a URL like `your-app.vercel.app`. That works from any browser — desktop or mobile.
5. On your phone, open that URL in the browser and use "Add to Home Screen" (Safari/Chrome share menu) for one-tap access, like a native app icon.

Any time you `git push` after this, Vercel automatically redeploys.

---

## 5. Connect your Daily Dashboard app (new)

The "Send to Daily Dashboard" checkbox on a task writes a new row directly into the Google Sheet behind your other app at dailydashboard-lemon.vercel.app — the same way its own "+ Work" quick-add page does. To make that work:

1. Open the Google Sheet your Daily Dashboard app uses (the "📋 Sheet" link on that app, or find it in Drive). Copy its Sheet ID from the URL, same way as step 1.2 above.
2. Click **Share** on that sheet and add your existing service account email (the same `GOOGLE_SERVICE_ACCOUNT_EMAIL` from section 1) with **Editor** access. This app reuses that one service account — you don't need a second one.
3. Set `DAILY_DASHBOARD_SHEET_ID` to that sheet's ID, both in `.env.local` (for local testing) and in Vercel's Environment Variables (for the live site).
4. Only set `DAILY_DASHBOARD_SHEET_TAB` if the tab holding your to-do rows isn't literally named **"To Do Database"** — otherwise leave it unset; the app looks for that name first and falls back to the first tab automatically.

**A quick note on how I set the defaults:** to figure out the right sheet/column layout, I looked at the structure of that spreadsheet through your connected Google Drive (not any of the actual task text — just the column headers). New rows get written as: checkbox column `TRUE`, **Status** "Not started", **Category** "Work", **Priority** "Moderate", **Sub Category** "Work Projects" (matching the tag you'd already used by hand on a few work tasks), **Due Date** in `YYYY-MM-DD` form, and **Notes** carrying over the task's own notes plus which project it came from. If any of that doesn't match what your Daily Dashboard app actually expects, the mapping is all in one place — `lib/dailyDashboardSheets.ts` — easy to adjust.

This is a **one-way send**, not a live sync: checking the box creates the row once (and then locks to prevent duplicates); unchecking it later only removes the "Sent" indicator here, it won't delete anything from the other sheet. Marking something Done in your Daily Dashboard app doesn't reach back into this app either — they're just two independent to-do lists that happen to share one entry point.

---

## Using the app

- **Completion checkbox**: every task, subtask, and sub-subtask has a checkbox on the left that marks it Done (and restores its previous status if you uncheck it again).
- **Goals**: open a task's "Details" panel to set a Goal timeframe — None, Today, This Week, This Month, or Next 2 Months. Anything other than "None" shows up automatically in the **Goals** box near the top of the app, grouped by timeframe. Checking a task complete there (or anywhere else) marks it complete everywhere, since it's the same underlying task.
- **Pinned Tasks**: the "Pin to top" checkbox in a task's Details panel pins it to the Pinned Tasks list at the top of the app for a quick daily glance. (This was previously labeled "Daily Dashboard" in the app — renamed to avoid confusion now that "Daily Dashboard" refers to your separate app.)
- **Send to Daily Dashboard**: also in the Details panel — creates a matching task in your separate Daily Dashboard app under category Work, priority Moderate, with the same due date. See section 5 for setup.
- **Daily Dashboard button**: the button in the header opens dailydashboard-lemon.vercel.app in a new tab.
- **Project stats**: each project shows its own completion %, done/total count, in-progress count, and overdue count right under its title — no need to expand it. The bar across the top still shows stats for everything combined.
- **Off-work view**: the toggle in the header hides the full project list, leaving just Pinned Tasks, Goals, and the metrics bar — a quick glance without the full planning interface.
- **Themes**: click a color dot in the header to switch between Berry & Plum, Ocean & Slate, Sunset, Forest, and Midnight. Your choice is remembered on that device.
- **Projects**: add one with the field above the list; click a project's name to rename it; Archive hides it from the default view without deleting it (toggle "Show archived" to see it again); Delete removes it and everything inside it.
- **Tasks**: every task supports a date, a status (Not Started / In Progress / Blocked / Done), a goal, and notes — all in the "Details" panel. Type in the "+ Add subtask" field under any item to nest another level — there's no limit to how deep you can go.

## A note on performance

Because every read and write talks to Google Sheets over the network, expect changes to take a fraction of a second longer than a typical app-only database — the interface updates instantly (optimistically) while the save happens in the background, so it should still feel responsive day to day.

## A note on your data

Since the sheet is the real database, you can open it directly any time to filter, sort, build a pivot table, or just back it up. The only thing to avoid is editing the `id` column of existing rows — the app uses those to find each row.
