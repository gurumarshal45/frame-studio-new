# Frame Studio — GitHub + Vercel + Supabase

Already using the previous version? Follow **UPDATE-BATCH-UPLOAD.md** first.
This update adds multiple-file uploads as separate posts without changing your
Supabase database, credentials or hosting configuration. Do NOT rerun the SQL.

Your existing photography/film portfolio, converted for Vercel.
Visitors can view posts. Only your approved Supabase admin can upload, edit
and delete. New posts appear first. Editing does not change the original date.

## Start here

Keep your OLD frame-studio folder as a backup. Extract this ZIP into a NEW
folder. Do not overwrite the old project or copy its data folder into this one.
Open the new folder containing package.json in VS Code.

This version does NOT use `npm run setup` or the old local admin password.
You will create a new admin account in Supabase below.

## 1. Create Supabase and the tables

1. Open https://supabase.com/dashboard and create a NEW project.
2. Keep your Supabase account/project credentials private.
3. In the project, open SQL Editor → New query.
4. Open `supabase/schema.sql` in VS Code. Copy its full contents into the SQL
   Editor and run it once. It creates the posts table, admin allowlist, public
   media bucket and access policies. Do not disable RLS.
5. If you see "already exists", do not delete existing tables. This schema is
   intended for a fresh project. Check whether you already ran it successfully.

## 2. Create your website admin

1. In Supabase, open Authentication → Users → Add user → Create new user.
2. Enter your own email and a strong password. Auto-confirm the email for this
   manually created owner account if that option is shown.
3. Copy the new user's ID (UUID).
4. Open `supabase/add-admin.sql`. Replace REPLACE_WITH_AUTH_USER_UUID with that
   ID, then run the SQL in the Supabase SQL Editor.
5. In Authentication's sign-in settings, turn OFF "Allow new users to sign up"
   and anonymous sign-ins. Keep email/password sign-in enabled.

There is no signup form. An ordinary authenticated account still cannot write:
it must be in studio_admins. Never give a stranger access to your Supabase project.

## 3. Connect the website locally

Install Node.js 22.12 or newer (Node 24 is supported), then restart VS Code.

In the Supabase project's Connect dialog or Settings → API Keys, find:
- Project URL, such as https://YOURPROJECT.supabase.co
- Publishable key, starting with sb_publishable_

Copy `.env.example` to `.env.local`. On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` in VS Code:

```dotenv
VITE_SUPABASE_URL=https://YOURPROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_ACTUAL_KEY
```

Use only the publishable key. NEVER use a secret key, service_role key, database
password or your admin password here. The publishable key reaches the browser;
database/storage policies, not hiding this key, protect write access.

In the terminal, from the folder containing package.json:

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. Click Admin sign in and use the NEW Supabase admin
email/password. Upload one photo and verify it appears in a private/incognito
browser window. MP4/WebM video uploads work the same way (maximum 25 MB/file).
For videos, browser playback depends on the actual codec, not just the extension.

## 4. Push the NEW project to GitHub

Create an empty GitHub repository without an initial README, license or
.gitignore. The project already includes .gitignore.

From this NEW project folder:

```powershell
git init
git add .
git status
```

Before committing, confirm .env.local, data/ and node_modules/ are NOT listed
as staged files. .env.example SHOULD be included; it contains placeholders only.
Then run (replace the repository URL with your real URL):

```powershell
git commit -m "Add Vercel-ready photography portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Do not force-push or overwrite an existing repository. These commands assume a
new empty repository. If Git asks for your identity, configure your own Git name
and email. Authenticate through GitHub's normal sign-in flow.

## 5. Deploy on Vercel

1. Open https://vercel.com and sign in.
2. Add New → Project → Import your GitHub repository.
3. Root Directory must be the folder containing package.json. When following
   the commands above it is the repository root. If you uploaded a parent
   folder instead, select the actual project subfolder.
4. Framework: Vite. Build Command: npm run build. Output Directory: dist.
   Install Command: npm ci. The included vercel.json sets these defaults.
5. Before clicking Deploy, add these Environment Variables using the SAME
   values from .env.local:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_PUBLISHABLE_KEY
6. Enable them for Production and, if needed, Preview and Development.
7. Click Deploy. Open the resulting website URL, then /admin to sign in.
8. In Supabase Authentication → URL Configuration, set Site URL to your final
   HTTPS Vercel URL. This prepares the project for future email-link flows;
   the current app signs in with email/password and has no recovery-link UI.

Changing Vercel environment variables requires a REDEPLOY, because Vite embeds
these values during the build. Restart npm run dev after changing .env.local.

You can shut down your computer after deployment. Vercel serves the website;
Supabase stores your data and files. Later Git pushes trigger new Vercel builds.
Publishing or editing a post does NOT need a Git push or website rebuild.

## Existing local photos and posts

They are NOT migrated automatically. Keep your old folder unchanged.
For a small portfolio:
1. Start the OLD site if you need to read/copy its titles and descriptions.
2. Stop its terminal with Ctrl+C before starting this version on the same port.
3. Sign in to the NEW site.
4. Re-upload original files from your computer or the OLD data/uploads folder.
5. Copy the titles/descriptions/categories from the old site or data/posts.json.
6. Re-upload oldest to newest if you want the same relative order. These are new
   posts with new publication dates, not preservation of historical timestamps.
7. Verify the new site before removing any old backup.

Never upload data/admin.json, passwords or a private backup to GitHub or the
public media bucket. The old password hash cannot become a Supabase password.

## Security and operational notes

- All published posts and media are PUBLIC. Only upload work you have permission
  to publish. Do not upload confidential photos or client/private documents.
- Supabase handles login/session refresh; the browser SDK stores the session in
  browser storage. Sign out on shared devices. Keep your browser and dependencies
  updated; never add untrusted scripts to this website.
- Database RLS and grants enforce approved-admin writes independently of the UI.
  No service/secret key is needed by the website or Vercel.
- The bucket restricts MIME types and file size. Browser signature checks catch
  accidental wrong files; they are not malware scanning or server-side content
  inspection. Only a trusted admin can upload.
- The bucket is public even when media is not linked to a post. Interrupted
  uploads or uncertain saves can leave an unused file. Check Storage → portfolio
  for orphan files before manually removing them. Never delete referenced files.
- Delete removes the database post first, then its object. Cleanup failures are
  displayed with the unused object's path. Remove that exact unused object in
  the Supabase dashboard. Deletion is permanent unless you kept a backup.
- For conflicting changes, use one admin editing session at a time. There is no
  multi-editor conflict/version history UI.
- The CSP supports standard *.supabase.co project domains. If you configure a
  custom Supabase domain, add that exact origin to CSP in vercel.json.
- Back up Supabase database content AND storage objects separately. Watch your
  Supabase/Vercel plan's storage, bandwidth, usage and availability limits.
- To remove admin access, delete that user's studio_admins row in the dashboard.
  Database/storage policies stop new writes immediately.
- To reset a password, use Supabase's supported admin/user recovery tools; this
  starter does not include a password recovery UI.

## Developer checks

```powershell
npm test
npm run build
```

Automated tests and the production build are checked before delivery.
Tests cover validation, ordering, upload/edit/delete behavior, cleanup failures,
and the real SQL schema's RLS and grants in an isolated PostgreSQL/WASM database
with minimal auth/storage schemas. They do not alter a live Supabase project.
Actual Supabase login/storage integration and the deployed browser still need
your post-configuration smoke test. No live project or deployment is included.

## Files to customize

- index.html: studio name, introduction, footer and form labels
- src/style.css: colors, fonts and layout
- src/app.js: frontend interactions
- src/portfolio.js: Supabase operations
- src/validation.js: input and media checks
- src/batch.js and src/batch.css: multiple-file upload queue and layout
- supabase/schema.sql: initial database and access rules
- vercel.json: hosting and security headers

## Troubleshooting

- package.json not found: open the correct extracted folder. Run dir and confirm
  package.json is visible before running npm commands.
- Supabase not connected: fill both .env.local values or Vercel variables.
- Invalid login credentials: use the new Supabase account, not the local one.
- Not an approved admin: run add-admin.sql with the correct Auth user's UUID.
- RLS/permission error: verify schema.sql completed and admin membership exists.
  Do not disable RLS or switch to a service_role key as a workaround.
- Empty portfolio: old local content does not move automatically.
- Upload rejected: check type, 25 MB limit, bucket settings and project quota.
- /admin returns 404 on Vercel: include vercel.json and use the correct root.

## Official references

- Supabase public keys: https://supabase.com/docs/guides/getting-started/api-keys
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Storage policies: https://supabase.com/docs/guides/storage/security/access-control
- Auth settings: https://supabase.com/docs/guides/auth/general-configuration
- Vercel builds: https://vercel.com/docs/builds/configure-a-build
- Vercel configuration: https://vercel.com/docs/project-configuration/vercel-json
