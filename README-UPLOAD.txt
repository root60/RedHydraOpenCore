UPLOAD INSTRUCTIONS

Upload these files to your GitHub repo:

1. Upload `.env.production` to the ROOT of the repo, beside package.json.

2. Upload `aiService.ts` to:
   src/services/aiService.ts

Replace the existing aiService.ts file.

After upload, commit changes.

Then check:
Actions > Deploy GitHub Pages

After the deploy is green, open:
https://root60.github.io/RedHydraOpenCore/

Hard refresh:
Ctrl + Shift + R

Clear old localStorage override once:
localStorage.removeItem("redhydra_llm_endpoint");
location.reload();

Dolphin endpoint:
https://itsredhydra-redhydraopencore-dolphin.hf.space
