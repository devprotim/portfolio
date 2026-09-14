export type LaneId = 'main' | 'intern' | 'boxxport' | 'samarth' | 'fethr' | 'kestra' | 'keel';

export interface Lane {
  /** Branch name shown in the caption. */
  ref: string;
  /** What this chapter was. */
  note: string;
  color: string;
}

export interface Commit {
  lane: LaneId;
  /** The commit subject, shown in the caption. */
  msg: string;
  /** The résumé skill this commit stands for. */
  skill: string;
  /** Opens this lane off the named lane's most recent commit. */
  fork?: LaneId;
  /** Closes the named lane into this commit, making it a merge. */
  merge?: LaneId;
}

export const LANES: Record<LaneId, Lane> = {
  main: { ref: 'main', note: 'Career', color: '#a371f7' },
  intern: { ref: 'brain-crowd/intern', note: 'Internship, 2021 – 22', color: '#39d0d6' },
  boxxport: { ref: 'brain-crowd/boxxport', note: 'Boxxport, 2022 – 24', color: '#f0883e' },
  samarth: { ref: 'brain-crowd/samarth', note: 'Samarth eGov, 2024 – 25', color: '#f778ba' },
  fethr: { ref: 'fethr/interop', note: 'Fethr Health, 2025 –', color: '#3fb950' },
  kestra: { ref: 'fethr/orchestration', note: 'Workflow platform', color: '#58a6ff' },
  keel: { ref: 'personal/keel', note: 'Keel, personal', color: '#e3b341' },
};

/**
 * One commit per skill on the résumé, written the way that skill would really
 * have been committed. Lanes are chapters; `fethr` and `keel` never merge
 * because they have not.
 *
 * This list is the feature. The canvas code below it is generic; this is the
 * part to update when the career moves.
 */
export const COMMITS: Commit[] = [
  {
    lane: 'main',
    msg: 'init: b.tech cse, haldia institute',
    skill: 'B.Tech Computer Science and Engineering, CGPA 8.53',
  },

  {
    lane: 'intern',
    fork: 'main',
    msg: 'feat: debounce the vessel tracker search',
    skill: 'JavaScript · throttling and debouncing',
  },
  {
    lane: 'intern',
    msg: 'perf: paginate and lazy-load carrier53',
    skill: 'Pagination, lazy loading',
  },
  {
    lane: 'intern',
    msg: 'feat: dynamic query builder for filters',
    skill: 'Search filters, dynamic query building',
  },
  {
    lane: 'main',
    merge: 'intern',
    msg: 'merge: intern → software developer',
    skill: 'Brain Crowd, Oct 2021 – Aug 2022',
  },

  { lane: 'main', msg: 'chore: type the api client end to end', skill: 'TypeScript' },

  {
    lane: 'boxxport',
    fork: 'main',
    msg: 'feat: buyer and seller dashboards',
    skill: 'RESTful API design and integration, full stack delivery',
  },
  { lane: 'boxxport', msg: 'feat: location-based container search', skill: 'Match success up 30%' },
  {
    lane: 'boxxport',
    msg: 'perf: ssg + preload, lighthouse 60 → 90',
    skill: 'Static site generation, SEO · organic traffic up 20%',
  },
  {
    lane: 'boxxport',
    msg: 'fix(sql): n+1 on the seller report',
    skill: 'MySQL · one join instead of forty',
  },
  { lane: 'boxxport', msg: 'feat: container radar', skill: 'Bounce rate down 18%' },
  {
    lane: 'main',
    merge: 'boxxport',
    msg: 'merge: boxxport marketplace',
    skill: 'Brain Crowd Bengaluru, Aug 2022 – Mar 2024',
  },

  {
    lane: 'samarth',
    fork: 'main',
    msg: 'docs: hld + lld for the admissions move',
    skill: 'Technical documentation, solution design',
  },
  {
    lane: 'samarth',
    msg: 'refactor: lazy-load the student lifecycle',
    skill: 'Angular · modular architecture, lazy loading',
  },
  {
    lane: 'samarth',
    msg: 'feat(state): ngrx facade, rxjs switchMap',
    skill: 'RxJS, NgRx · advanced state management',
  },
  {
    lane: 'samarth',
    msg: 'feat(a11y): focus and aria on the tables',
    skill: 'HTML5, CSS/SCSS · reusable accessible components',
  },
  {
    lane: 'samarth',
    msg: 'fix: root-cause the stale enrolment cache',
    skill: 'Production support · RCA, hotfix, regression validation',
  },
  {
    lane: 'samarth',
    msg: 'chore: split the epic into sprint stories',
    skill: 'Agile ceremonies · planning, estimation, Jira',
  },
  {
    lane: 'main',
    merge: 'samarth',
    msg: 'merge: samarth egov migration',
    skill: 'Assam University · cross-division resolution, days to hours',
  },

  { lane: 'main', msg: 'build: webpack → vite', skill: 'Vite · 12 second dev start' },

  {
    lane: 'fethr',
    fork: 'main',
    msg: 'feat(auth): cerner smart backend services',
    skill: 'OAuth2, tenant auto-discovery, third-party EHR APIs',
  },
  {
    lane: 'fethr',
    msg: 'perf: cache minted tokens, wildcard scopes',
    skill: 'Token minting, scope management',
  },
  {
    lane: 'fethr',
    msg: 'chore(db): seed the fhir r4 schema',
    skill: 'PostgreSQL · 39 FHIR R4 resources',
  },
  {
    lane: 'fethr',
    msg: 'feat: drag-and-drop fhir field mapping',
    skill: 'No-code mapping UI, JSON paths resolved at runtime',
  },
  {
    lane: 'fethr',
    msg: 'feat: connector health dashboard',
    skill: 'Monitoring · message history, execution states, failures',
  },
  {
    lane: 'fethr',
    msg: 'feat(ui): filterable tables, drill-downs',
    skill: 'PrimeNG, Angular Material · reusable components',
  },

  {
    lane: 'kestra',
    fork: 'fethr',
    msg: 'feat(canvas): vue 3 node editor',
    skill: 'Vue 3 · drag-and-drop canvas editor',
  },
  {
    lane: 'kestra',
    msg: 'feat: trigger → map → transform → validate',
    skill: 'Kestra · modular workflow nodes and control flow',
  },
  {
    lane: 'kestra',
    msg: 'build: containerize the worker',
    skill: 'Docker · parity between local and production',
  },
  {
    lane: 'kestra',
    msg: 'feat: hl7 transform utilities',
    skill: 'HL7 · clinical and administrative data exchange',
  },
  {
    lane: 'fethr',
    merge: 'kestra',
    msg: 'merge: no-code orchestration platform',
    skill: 'Workflow platform on Kestra',
  },

  {
    lane: 'keel',
    fork: 'main',
    msg: 'feat: yjs crdt over websocket',
    skill: 'Yjs CRDT, WebSocket · live cursors and presence',
  },
  {
    lane: 'keel',
    msg: 'feat: offline-first edits in indexeddb',
    skill: 'IndexedDB, per-field conflict resolution',
  },
  {
    lane: 'keel',
    msg: 'feat: 13 rules, spof, retry storms, dlq',
    skill: 'Shared client/server validation engine',
  },
  {
    lane: 'keel',
    msg: 'feat(ai): findings must cite a node id',
    skill: 'AI review layer grounded in real nodes and edges',
  },
  {
    lane: 'keel',
    msg: 'ci: ship to render on tag',
    skill: 'Git, CI/CD, AWS, Vercel · deployment workflows',
  },
];

/*
 * TODO(human): the four competencies commits.
 *
 * Everything in COMMITS is a hard skill, and hard skills commit easily. The
 * résumé's Competencies line does not: peer code review, cross-functional
 * collaboration, asynchronous communication across timezones, and product
 * ownership are things you did, not things you built, and I would be
 * inventing them.
 *
 * Add four entries here in the same shape as COMMITS. They land on `main`, so
 * they read as how you work rather than what you shipped. Shape:
 *
 *   { lane: 'main', msg: 'review: address mapping feedback', skill: 'Peer code review' }
 *
 * Messages live in the caption, so anything up to about 46 characters reads
 * fine. The graph and the screen-reader list both pick these up automatically.
 */
export const COMPETENCIES: Commit[] = [];

export const LOG: Commit[] = [...COMMITS, ...COMPETENCIES];
