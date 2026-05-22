# Shafayat Alam — Portfolio

Hosted on GitHub Pages.

## Adding or Updating Content

All content is driven by `data/content.json`. An AI assistant can read this file to understand the current structure and add new entries.

### Workflow for adding a new project

1. **Describe the project** to an AI (Claude, ChatGPT, etc.) and give it access to this repo.
2. The AI will copy the template from `data/template.json`, fill in the fields, and add the entry to `data/content.json`.
3. The AI will list what images it needs (up to 3 per project, 4:3 ratio, 1200×900px recommended).
4. You drop the images into `assets/images/[project-id]/` named `01.jpg`, `02.jpg`, `03.jpg`.
5. The AI updates the image paths in `content.json`.
6. Push to GitHub — site updates automatically.

### Adding a report PDF

Drop the PDF into `assets/reports/[project-id].pdf` and set `"report": "assets/reports/[project-id].pdf"` in the entry.

### File structure

```
portfolio/
├── index.html
├── css/style.css
├── js/main.js
├── data/
│   ├── content.json      ← edit this to update the site
│   └── template.json     ← blank entry schema for AI reference
├── assets/
│   ├── images/
│   │   └── [project-id]/
│   │       ├── 01.jpg
│   │       ├── 02.jpg
│   │       └── 03.jpg
│   └── reports/
│       └── [project-id].pdf
└── .nojekyll
```

## Local Development

The site fetches `data/content.json` at runtime, so you need a local server (not `file://`):

```bash
# Node
npx serve .

# Python
python -m http.server 8080
```

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo (e.g. `Shafayat-Alam/portfolio` or `Shafayat-Alam/Shafayat-Alam.github.io`).
2. Go to **Settings → Pages → Source → Deploy from branch → main / root**.
3. Site will be live at `https://shafayat-alam.github.io/portfolio` (or `https://shafayat-alam.github.io` if you use the `username.github.io` repo name).
