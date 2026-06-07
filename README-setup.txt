# Connect RedHydra GitHub Pages website to Dolphin Space

Add `.env.production` to the root of your RedHydraOpenCore GitHub repo, beside `package.json`.

File content:

VITE_REDHYDRA_LLM_ENDPOINT=https://itsredhydra-redhydraopencore-dolphin.hf.space
VITE_REDHYDRA_BASE_MODEL=dphn/Dolphin3.0-Qwen2.5-0.5B

Then commit to the main branch. GitHub Actions should rebuild and redeploy the website.

After deployment, open:
https://root60.github.io/RedHydraOpenCore/

If the old version is still cached, hard refresh:
Ctrl + Shift + R

Temporary browser test:
localStorage.setItem("redhydra_llm_endpoint", "https://itsredhydra-redhydraopencore-dolphin.hf.space");
location.reload();
