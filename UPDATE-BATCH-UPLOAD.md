# Update your existing website: multiple files, separate posts

Your Supabase project, users, current posts, photos, and Vercel settings stay the
same. This update changes the website code only. Do NOT rerun schema.sql or
add-admin.sql. Do NOT recreate your GitHub repository or Vercel project.

## 1. Copy the changed files

1. Download the updated ZIP and extract it into a separate temporary folder.
2. Keep your existing VS Code project folder with its .git and .env.local.
3. Back up any code you have customized since the original ZIP.
4. Copy these SIX files from the new ZIP into their matching locations in your
   existing project, replacing the existing files when prompted:

   - index.html
   - src/app.js
   - src/portfolio.js
   - src/batch.js (new file)
   - src/batch.css (new file)
   - tests/batch.test.js (new file)

If you customized index.html, app.js or portfolio.js yourself, merge those
changes instead of blindly replacing them. This update is based on the last
Vercel-ready ZIP provided in this conversation, not a fresh copy of your private
GitHub repository.

Keep your existing .env.local, .git folder and Supabase SQL files unchanged.
No packages were added or changed. The old single-post edit form still works.

## 2. Test on your computer

Open your ORIGINAL project folder in VS Code. Stop its server with Ctrl+C if it
is running, then run:

```powershell
npm test
npm run dev
```

Open the localhost link. Sign in, click **New posts**, then choose two small test
photos. Note: your local app uses your existing Supabase project, so publishing
these test photos will also make them available on your live site.

Check that:
- Both files appear in the upload window.
- Each has its own editable title, category and description.
- Clicking Publish creates two separate posts.
- Both say Published; each can then be edited or deleted individually.

## 3. Update GitHub and Vercel

In a terminal in your ORIGINAL project folder, run:

```powershell
git add index.html src/app.js src/portfolio.js src/batch.js src/batch.css tests/batch.test.js
git status
```

Confirm only the intended source/test files are staged, and .env.local is NOT
listed. Then run:

```powershell
git commit -m "Add multiple-file uploads as separate posts"
git push
```

Vercel builds the update from your existing GitHub connection. Wait for its new
deployment to be Ready, then reload your existing website. No new environment
variables or database changes are needed.

## How batch uploads work

- Click New posts and select up to 20 photos/videos (Ctrl-click on Windows,
  Command-click on Mac, or Shift-click for a range).
- Filename-based titles are pre-filled. Change each title before publishing.
- Each file gets its own optional category and description.
- Add more files with the same chooser, or remove a file before publishing.
- Each file remains limited to 25 MB. The existing total Supabase storage and
  bandwidth limits still apply. This feature does not increase those limits.
- Files publish sequentially in the order shown. The last successfully
  published file will appear first in the public newest-first list.
- Keep the upload window/tab open while publishing.
- If one fails, successful posts remain. Correct the failed entry or connection
  problem, then click Publish remaining. Confirmed successes are NOT repeated.
- If a save result is uncertain, the app deliberately will not retry that row.
  Open the portfolio in a new tab and check whether it already exists before
  starting another batch with that file.
- Closing the window clears unpublished selections, not existing published
  posts. A batch is not an album and there is no all-or-nothing transaction.
- For an existing post, Edit post still accepts just ONE replacement file.

## Validation

The tests cover ten separate uploads, distinct titles, partial failures,
retry-only-failed behavior and uncertain-result handling, alongside the existing
single-post and database-permission tests. Live browser upload testing requires
your signed-in Supabase project; no actual media is uploaded by these tests.
