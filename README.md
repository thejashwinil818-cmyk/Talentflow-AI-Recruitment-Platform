# Talentflow

Talentflow is a React + Vite frontend prototype for a role-based recruitment and talent management platform. It provides separate Recruiter, Candidate, and Employee workspaces with a shared responsive interface and Light, Dark, and System themes.

## Current features

- Landing page and role selection, with separate sign-in and registration screens for all three roles.
- Demo account registration validates full name, email, password length, confirmation, and globally unique normalized email addresses. Each email belongs to one role.
- Demo sign-in checks registered accounts and prevents a user from entering a different role's workspace.
- Signed-in demo sessions restore on refresh. The Remember me checkbox selects local storage (persistent) or session storage (current browser tab).
- A shared account profile dialog displays the registered email as read-only and lets users update their full name. Candidate headline and focus fields are saved with the candidate demo account.
- Recruiter workspace: hiring overview, sample charts and funnel, searchable/filterable candidate pipeline, position drafts, activity, interviews, and CSV export.
- Candidate workspace: illustrative job listings, search and location filter, saved jobs, application tracker, notifications, and editable profile preview.
- Employee workspace: illustrative skill visualization, development milestones, searchable learning cards and resources, and progress controls.
- Shared Light, Dark, and System theme preference. Explicit theme choice persists in local storage; System follows the device color scheme.
- Responsive layouts for laptop and mobile screens.

## Routes

| Path | Screen |
| --- | --- |
| `/` | Landing page |
| `/portals` | Role selection |
| `/login/recruiter` | Recruiter sign-in and registration |
| `/login/candidate` | Candidate sign-in and registration |
| `/login/employee` | Employee sign-in and registration |
| `/dashboard/recruiter` | Recruiter dashboard |
| `/dashboard/candidate` | Candidate dashboard |
| `/dashboard/employee` | Employee dashboard |

Dashboard sections are client-side views within each portal and are not separate URL routes.

## Requirements

- Node.js (current LTS recommended) and npm
- A modern browser with Web Crypto support

## Install and run

From the project directory:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually <http://localhost:5173>. Select a portal, choose **Create an account**, register with a name, email, and password of at least eight characters, then sign in using the same portal. Use different email addresses to create accounts for different roles. To test role protection, try the same email from another role's sign-in page.

## Available commands

```sh
npm run lint    # Run Oxlint
npm run build   # Create the production bundle in dist/
npm run preview # Serve the production bundle locally
```

To preview the production build:

```sh
npm run build
npm run preview
```

## Demo authentication and privacy limitations

This project has no backend, database, or external authentication provider. Demo accounts are stored only in the current browser's local storage. Passwords are not stored as plaintext: the browser derives salted PBKDF2-SHA-256 hashes for local prototype verification. A successful demo session stores only the account email and role. The Remember me choice uses local storage or session storage for that session marker.

This browser-side flow is **not secure production authentication**. Users can inspect or modify browser storage, and client-side checks cannot enforce identity or authorization. Do not use real passwords or sensitive personal information. Production use requires a backend authentication service, secure server-side password hashing and session management, transport security, and proper authorization controls.

All people, companies, roles, match scores, charts, activity, interviews, and dashboard figures are illustrative. No AI model or inference service is connected; match indicators and skill values are sample content, not generated assessments. Demo actions do not contact external services.

## Project structure

```text
src/
  App.jsx       Screens, routing, dashboards, and shared UI
  App.css       Application component and responsive styles
  auth.js       Browser-only demo account store and password hashing
  index.css     Global styles and shared theme tokens
  main.jsx      React application entry point
public/         Static icons and favicon
```

## Technology

React, Vite, Web Crypto, and plain CSS. The project uses Oxlint and keeps navigation and prototype state in the existing React application.
