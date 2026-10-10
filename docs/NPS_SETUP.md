# Setting up the NPS key (one time)

The game shows real National Park Service information and alerts. The key that allows this is kept as a
**GitHub secret**, so it is never in the code and never in the web page.

## Steps
1. Open your repo on github.com, then **Settings -> Secrets and variables -> Actions**.
2. On the **Secrets** tab (not "Variables"), click **New repository secret**.
3. Name: `NPS_API_KEY` (exactly this, capital letters). Secret: paste your NPS key. Click **Add secret**.
4. Go to the **Actions** tab, choose **Build and Deploy to GitHub Pages**, click **Run workflow**.
5. When it finishes, open the **Build project** step. You should see lines like `[nps] grsm: saved (3 alerts)`. GitHub hides the key itself in logs.
6. Reload the live site, pick Great Smoky Mountains, and open **Official NPS information** on the start screen.

## Good to know
- Never paste the key into a chat, a code file, or a README. If it is ever exposed, request a new one on the NPS developer site and update the secret.
- The site rebuilds every day, so alerts stay fresh. GitHub may pause scheduled runs if a public repo has no activity for 60 days. Pushing any change, or clicking **Run workflow**, wakes it up.
- If the key is missing or NPS is down, nothing breaks: the panel just says the information is not available.
- To test on your own computer: `NPS_API_KEY=your-key npm run fetch:nps` (the key stays in your terminal only).
