# Shafayat Alam — Portfolio

**Live site:** https://shafayat-alam.github.io/Resume-Portfolio/

A data-driven portfolio hosted on GitHub Pages. All content lives in `Data/` — edit JSON files and push; the site updates automatically. Changing any data file also triggers automatic PDF portfolio generation.

---

## Repo Structure

```
Resume-Portfolio/
├── index.html
├── css/style.css
├── js/main.js
├── Data/
│   ├── projects.json          ← profile, skills, project order
│   ├── _template/
│   │   └── project.json       ← copy this to add a new project
│   └── {project-slug}/
│       ├── project.json       ← all content for one card
│       └── images/            ← 01.jpg, 02.jpg, 03.jpg (4:3, 1200×900px)
├── Resume/
│   ├── shafayat_alam_resume.tex        ← LaTeX resume source
│   └── Shafayat_Alam_Portfolio.pdf     ← auto-generated PDF portfolio
└── scripts/
    ├── generate-pdf.js        ← PDF generator
    └── watch.js               ← file watcher
```

---

## Editing Content

### Your profile, bio, and skills

Open `Data/projects.json` and edit the `profile` object:

```json
"profile": {
  "name":        "Shafayat Alam",
  "title":       "Mechanical Engineer · Roboticist",
  "bio":         "Your about section text...",
  "location":    "Long Island, NY",
  "email":       "you@email.com",
  "linkedin":    "https://linkedin.com/in/...",
  "github":      "https://github.com/...",
  "institution": "Stony Brook University",
  "degree":      "B.E. Mechanical Engineering, 2026"
}
```

Skills are in the `skills` array in the same file.

---

### Adding a new project card

1. Copy `Data/_template/` and rename the folder to a short kebab-case slug (e.g. `my-project`).
2. Fill in `Data/my-project/project.json`:

```json
{
  "id":          "my-project",
  "title":       "PROJECT TITLE IN UPPERCASE",
  "org":         "Organization or Team Name",
  "institution": "University, Company, or Lab",
  "period":      "Month YYYY – Month YYYY",
  "category":    "ROBOTICS",
  "images":      ["images/01.jpg", "images/02.jpg", "images/03.jpg"],
  "what":    ["What was built or investigated?"],
  "how":     ["What methods or tools were used?"],
  "results": ["What was achieved? Use <strong>numbers</strong>."],
  "report":  "",
  "links":   ["https://github.com/..."]
}
```

3. Drop images into `Data/my-project/images/` named `01.jpg`, `02.jpg`, `03.jpg`.
4. Add the slug to the `projects` array in `Data/projects.json` at whatever position you want it to appear.
5. Push — the site updates automatically.

---

### Editing an existing card

Open `Data/{project-slug}/project.json` and edit any field directly. Every bullet in `what`, `how`, and `results` is a plain string in the array — just change the text. Add or remove bullets freely.

To add a link button to a card:

```json
"links": [
  "https://github.com/Shafayat-Alam/your-repo",
  "https://arxiv.org/abs/..."
]
```

Leave it as `[]` for no links. Any number of links is supported.

To attach a report PDF, drop the file in the project folder and set:

```json
"report": "your-report.pdf"
```

---

## Resume (LaTeX)

The LaTeX source for the one-page resume is at:

```
Resume/shafayat_alam_resume.tex
```

Edit it directly and compile with any LaTeX distribution (`pdflatex`, Overleaf, etc.). It is kept in the same repo so resume and portfolio stay in sync.

---

## PDF Portfolio Generation

The portfolio auto-generates a styled PDF at `Resume/Shafayat_Alam_Portfolio.pdf` whenever data changes.

**Setup (first time only):**

```bash
# Install Node.js via nvm if not already installed
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20

# Install dependencies
npm install
```

**Generate once:**

```bash
npm run pdf
```

**Watch mode — auto-regenerates on every save to Data/:**

```bash
npm run watch
```

The PDF layout mirrors the site: name and contacts appear on every page, followed by the About section, Skills, then project cards (first card solo, then two per page stacked).

---

## Local Development

The site fetches JSON at runtime so you need a local server:

```bash
python -m http.server 8080
# then open http://localhost:8080
```

---

## Deployment

The site is deployed via GitHub Pages from the `main` branch root. Push any change and GitHub rebuilds the site automatically within ~1 minute.
