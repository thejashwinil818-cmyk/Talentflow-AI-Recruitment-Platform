// Transparent dictionary: add aliases and recommendation notes here as the demo grows.
export const skillDictionary = {
  'JavaScript': { aliases: ['javascript', 'js'], topic: 'Modern JavaScript, async code, and browser APIs', project: 'Build a searchable role board with filters and saved state.' },
  'TypeScript': { aliases: ['typescript', 'ts'], topic: 'Types, interfaces, generics, and narrowing', project: 'Add typed validation and API models to a small React app.' },
  'React': { aliases: ['react', 'react.js'], topic: 'Components, hooks, forms, and state management', project: 'Build an accessible multi-step application form.' },
  'Node.js': { aliases: ['node.js', 'nodejs'], topic: 'Node.js modules, async I/O, and service structure', project: 'Create a small command-line tool that reads and summarizes JSON.' },
  'Express': { aliases: ['express', 'express.js'], topic: 'Express routing, middleware, and request validation', project: 'Build a REST API with validation and role-based routes.' },
  'REST APIs': { aliases: ['rest api', 'rest apis', 'restful api', 'restful apis'], topic: 'HTTP methods, status codes, pagination, and API design', project: 'Document and implement CRUD endpoints for a simple resource.' },
  'HTML': { aliases: ['html', 'html5'], topic: 'Semantic HTML and accessible document structure', project: 'Rebuild a profile page using semantic landmarks and form labels.' },
  'CSS': { aliases: ['css', 'css3'], topic: 'Responsive layouts, flexbox, grid, and design tokens', project: 'Create a responsive dashboard layout from a small design spec.' },
  'Git': { aliases: ['git', 'github'], topic: 'Branches, commits, reviews, and resolving conflicts', project: 'Practice a feature branch, pull request, and review workflow.' },
  'SQL': { aliases: ['sql', 'structured query language'], topic: 'Joins, aggregates, constraints, and query design', project: 'Model a small hiring database and answer reporting questions.' },
  'SQLite': { aliases: ['sqlite', 'sqlite3'], topic: 'SQLite schema design, indexes, and transactions', project: 'Build a local persistence layer with foreign keys and migrations.' },
  'Python': { aliases: ['python'], topic: 'Python fundamentals, data structures, and testing', project: 'Write a tested script to normalize and summarize a CSV dataset.' },
  'AWS': { aliases: ['aws', 'amazon web services'], topic: 'Cloud fundamentals, IAM, and basic deployment', project: 'Deploy a small app with a documented least-privilege setup.' },
  'Docker': { aliases: ['docker', 'containers'], topic: 'Images, containers, volumes, and Compose', project: 'Containerize a web app and its local database.' },
  'Product Design': { aliases: ['product design', 'product designer'], topic: 'Problem framing, interaction design, and iteration', project: 'Redesign one user flow and document the decisions with a prototype.' },
  'Figma': { aliases: ['figma'], topic: 'Reusable components, variants, and prototyping', project: 'Create a small component library and prototype a key user journey.' },
  'Accessibility': { aliases: ['accessibility', 'wcag', 'accessible design'], topic: 'Keyboard access, semantics, contrast, and assistive technology', project: 'Audit a form and fix keyboard and screen-reader issues.' },
  'User Research': { aliases: ['user research', 'usability research', 'user interviews'], topic: 'Interview planning, usability sessions, and synthesis', project: 'Run a small usability study and summarize observed friction.' },
  'Design Systems': { aliases: ['design system', 'design systems'], topic: 'Tokens, component governance, and contribution workflows', project: 'Document tokens and build three reusable interface components.' },
  'Communication': { aliases: ['communication', 'stakeholder communication'], topic: 'Clear written updates, listening, and facilitation', project: 'Write a concise decision brief and facilitate a feedback session.' },
  'Recruiting': { aliases: ['recruiting', 'talent acquisition'], topic: 'Structured hiring, sourcing, and candidate experience', project: 'Draft a consistent interview plan and candidate communication flow.' },
  'Employee Relations': { aliases: ['employee relations', 'workplace relations'], topic: 'Policy basics, documentation, and fair issue resolution', project: 'Create a neutral case intake and escalation checklist.' },
  'Excel': { aliases: ['excel', 'microsoft excel', 'spreadsheets'], topic: 'Formulas, lookup functions, pivot tables, and clean data', project: 'Build a hiring pipeline tracker with a pivot summary.' },
  'Human Resources': { aliases: ['human resources', 'hr'], topic: 'HR operations, employee lifecycle, and records handling', project: 'Map onboarding steps and identify process handoff gaps.' },
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
export function extractSkills(text) {
  const source = text.toLocaleLowerCase()
  return Object.entries(skillDictionary)
    .filter(([, definition]) => definition.aliases.some((alias) => {
      const escaped = escapeRegex(alias.toLocaleLowerCase())
      return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i').test(source)
    }))
    .map(([skill]) => skill)
}

export function canonicalSkill(value) {
  const normalized = String(value).trim().toLocaleLowerCase()
  return Object.entries(skillDictionary).find(([name, definition]) => name.toLocaleLowerCase() === normalized || definition.aliases.some((alias) => alias.toLocaleLowerCase() === normalized))?.[0] || String(value).trim()
}

export function recommendationFor(skill) {
  return skillDictionary[skill] || {
    topic: `Core concepts and practical use of ${skill}`,
    project: `Build a small project that uses ${skill} and document what you learned.`,
  }
}
