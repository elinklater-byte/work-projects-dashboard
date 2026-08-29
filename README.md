# Work Projects Dashboard

A personal project-management dashboard: projects → tasks → subtasks → sub-subtasks (nested to any depth), each with a date, status, and notes. Any item can be pinned to a Daily Dashboard with a checkbox. Google Sheets is the live database, so your data lives in a spreadsheet you fully control. Four color themes are built in, switchable anytime from the header.

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
4. Open `.env.local` and fill in the three values:
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
2. Before clicking Deploy, expand **Environment Variables** and add the same three variables from your `.env.local`:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (paste it including the `\n` sequences exactly as in the JSON file, wrapped in quotes)
3. Click **Deploy**.
4. Once it finishes, you'll get a URL like `your-app.vercel.app`. That works from any browser — desktop or mobile.
5. On your phone, open that URL in the browser and use "Add to Home Screen" (Safari/Chrome share menu) for one-tap access, like a native app icon.

Any time you `git push` after this, Vercel automatically redeploys.

---

## Using the app

- **Daily Dashboard**: the small checkbox on the left of any task/subtask/sub-subtask pins it to the Daily Dashboard list at the top of the app. Uncheck to remove it.
- **Off-work view**: the toggle in the header hides the full project list, leaving just your Daily Dashboard and the metrics bar — a quick glance without the full planning interface.
- **Themes**: click a color dot in the header to switch between Ocean & Slate, Sunset, Forest, and Midnight. Your choice is remembered on that device.
- **Projects**: add one with the field above the list; click a project's name to rename it; Archive hides it from the default view without deleting it (toggle "Show archived" to see it again); Delete removes it and everything inside it.
- **Tasks**: every task supports a date, a status (Not Started / In Progress / Blocked / Done), and notes (click "Notes" to expand). Type in the "+ Add subtask" field under any item to nest another level — there's no limit to how deep you can go.

## A note on performance

Because every read and write talks to Google Sheets over the network, expect changes to take a fraction of a second longer than a typical app-only database — the interface updates instantly (optimistically) while the save happens in the background, so it should still feel responsive day to day.

## A note on your data

Since the sheet is the real database, you can open it directly any time to filter, sort, build a pivot table, or just back it up. The only thing to avoid is editing the `id` column of existing rows — the app uses those to find each row.
