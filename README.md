# Talentflow

Talentflow is a React + Vite recruitment and talent management prototype with an Express API and persistent SQLite database.

## Run locally

Requirements: Node.js 22.13+ and npm (PDF.js 6 requires this Node version). From the repository root:

```sh
npm install
npm run dev:all
```

Defaults work without a `.env` file. To customize them, copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell or `cp .env.example .env` in bash).

Vite serves the UI at <http://localhost:5173>; the API serves at <http://localhost:3001>. The database is created and migrated automatically at `backend/talentflow.sqlite`. It seeds India-based demo jobs with required skills, prioritizing Bengaluru and Karnataka and also covering Mysuru, Mangaluru, Hubballi, Hyderabad, Chennai, Pune, and Mumbai. These are clearly labelled demo roles, not verified live vacancies. To run separately, use `npm run dev` for Vite and `npm run dev:backend` for Express. API health: <http://localhost:3001/api/health>.

## Demonstrate the backend

Register a recruiter and a candidate through the existing portal screens. In the recruiter portal, **New position** publishes a persisted job; **Edit** updates its title, location, work mode, and skills. Country defaults to India. In **Find jobs**, filter by country, state, city, and work mode; Bengaluru/Bangalore, Mysuru/Mysore, and Mangaluru/Mangalore aliases are treated equivalently. Sign in as the candidate and apply; the Applications view reads persisted applications. Registering the same email twice returns a conflict. Candidates cannot publish jobs, recruiters cannot apply, and one candidate cannot apply twice to the same role. Recruiter application review is available at `GET /api/recruiter/applications` for the signed-in recruiter.

Direct API checks (PowerShell):

```powershell
Invoke-RestMethod http://localhost:3001/api/health
$email = "review-$([guid]::NewGuid().ToString('N'))@example.test"
Invoke-RestMethod -Method Post http://localhost:3001/api/auth/register -ContentType 'application/json' -Body (@{fullName='Review Recruiter';email=$email;password='test-password-123';role='recruiter'} | ConvertTo-Json)
Invoke-RestMethod -Method Post http://localhost:3001/api/auth/login -ContentType 'application/json' -Body (@{email=$email;password='test-password-123';role='recruiter'} | ConvertTo-Json) -SessionVariable session
Invoke-RestMethod -Method Post http://localhost:3001/api/jobs -WebSession $session -ContentType 'application/json' -Body '{"title":"Embedded Engineer","company":"Talentflow Demo","team":"Engineering","country":"India","state":"Karnataka","city":"Bengaluru","workMode":"Hybrid","requiredSkills":["C++","Embedded Systems"]}'
Invoke-RestMethod 'http://localhost:3001/api/jobs?country=India&state=Karnataka&city=Bangalore&workMode=Hybrid'
Invoke-RestMethod http://localhost:3001/api/jobs
```

The create call returns `{ job }` with persisted `country`, `state`, `city`, and `workMode`. Location filters can also be sent as query parameters to `GET /api/jobs` (`country`, `state`, `city`, `workMode`); the candidate UI applies the same filters to its displayed list. `PUT /api/jobs/:id` accepts the same location fields and is limited to the owning recruiter.

Use the browser UI for candidate registration and application checks; browser requests include the HttpOnly session cookie automatically. API responses use `{ user }`, `{ jobs }`, `{ job }`, or `{ applications }`; failures use `{ error }`.

## Resume-to-job fit demo

1. Sign in or register through the **Candidate** portal.
2. Open **Resume & Job Fit** in the candidate navigation and choose an available job. The seeded demo roles have required skill lists; recruiters can also add comma-separated required skills when publishing a role.
3. Upload a PDF or DOCX file (maximum 5 MB) and select **Analyze resume**. The report shows the selected job location, estimated match, matched and missing required skills, additional dictionary skills, a per-skill breakdown, and learning topics/projects ordered by the job's required-skill order. Location is displayed for context and is not part of the skill-match percentage.
4. Change the job selection and analyze again. Reports are private to the candidate account; they can be reopened or deleted from **Recent analyses**.

For a synthetic test resume, create a PDF or DOCX containing these terms: `Product Design, Figma, Accessibility, JavaScript, React.js, HTML, CSS, Git`. Against the sample **Senior Product Designer** role, this should match 3 of 5 required skills (60%), list **User Research** and **Design Systems** as missing, and recommend learning ideas for those two skills. This is invented test content, not a real person's resume. Scoring is deterministic keyword matching from the configurable `backend/skills.js` dictionary. It does not validate skill proficiency, infer personal traits, or make employment decisions. Scanned/image-only PDFs are not OCR processed and return a no-readable-text error.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/jobs` (also `/api/jobs/`), `POST /api/jobs`, `PUT /api/jobs/:id`
- `POST /api/jobs/:id/apply`, `GET /api/applications/me`, `GET /api/recruiter/applications`
- `POST /api/resumes/analyze` (candidate multipart fields: `resume` file and `jobId`)
- `GET /api/resumes/analyses`, `GET /api/resumes/analyses/:id`, `DELETE /api/resumes/analyses/:id` (candidate's own reports only)
- `PUT /api/users/me`, `GET /api/health`

Passwords are hashed with bcrypt. Sessions use an HttpOnly, SameSite=Lax cookie; the cookie is memory backed and expires after seven days, so restarting the API signs users out. SQLite enables foreign keys and uniquely constrains email and (job, candidate) applications. CORS allows the configured `FRONTEND_ORIGIN` with credentials.

PDF text is extracted with PDF.js; DOCX text is extracted with Mammoth. Uploads are limited to one file, 5 MB, PDF/DOCX, and 40 PDF pages. They are written under the non-public `backend/private-resumes/` directory using generated names, parsed without execution, and deleted after processing even on errors. Resume text and file contents are never saved to the database or returned. SQLite retains a SHA-256 digest, file type/size/timestamp, and the skills-only report until the candidate deletes the analysis (or the account/job is deleted). No recruiter resume access route exists.

## Limitations before production

This is an interview prototype. Its session store is in memory, has no CSRF protection or session revocation persistence, and is not suitable for multiple API instances. Production needs HTTPS, secure cookie settings, a persistent session store, CSRF defenses, rate limiting, account recovery, operational backups, stronger deployment secrets, and security review. Keyword extraction may miss synonyms or falsely count a term and is not a real proficiency assessment or machine-learning model. Employee talent content and recruiter analytics/candidate pipeline remain illustrative UI content. AI matching, resume parsing beyond PDF/DOCX text extraction, Talent Twin, and What-If simulation are not implemented.

## Commands

```sh
npm run dev:all     # frontend and backend together
npm run dev         # frontend only
npm run dev:backend # API only
npm run lint
npm run build
```
