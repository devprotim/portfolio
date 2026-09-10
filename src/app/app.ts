import { Component, afterNextRender, signal } from '@angular/core';

interface Project {
  id: string;
  title: string;
  summary: string;
  links: { label: string; href: string }[];
  tags: string[];
}

interface Role {
  when: string;
  title: string;
  org: string;
  summary: string;
}

interface StackGroup {
  label: string;
  value: string;
}

interface Contact {
  label: string;
  href: string;
  text: string;
  external: boolean;
}

interface SwitchVoice {
  impactHz: number;
  impactDecay: number;
  bodyFromHz: number;
  bodyToHz: number;
  gain: number;
}

@Component({
  imports: [],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('portfolio');

  readonly theme = signal<'light' | 'dark'>('light');

  private audioCtx?: AudioContext;

  readonly projects = signal<Project[]>([
    {
      id: '01',
      title: 'Keel',
      summary:
        'A multiplayer canvas for system architecture. Yjs CRDT over WebSocket gives live cursors, presence, offline-first editing through IndexedDB, and per-field conflict resolution so concurrent edits merge cleanly. A shared client and server validation engine runs 13 rules for circular dependencies, retry storms, single points of failure and missing dead-letter queues, with an optional AI review layer whose findings have to cite a real node or edge id.',
      links: [
        { label: 'keel-d2f5.onrender.com', href: 'https://keel-d2f5.onrender.com' },
        { label: 'github.com/devprotim/keel', href: 'https://github.com/devprotim/keel' },
      ],
      tags: ['Angular', 'Fastify', 'Yjs CRDT'],
    },
    {
      id: '02',
      title: 'Healthcare workflow automation',
      summary:
        'Workflow automation for healthcare data built on the Kestra orchestration engine, using HL7 for sharing clinical and administrative data between systems. I built the screens to configure and monitor runs, with execution history and error visibility for faster debugging, plus small utilities for data transformation and API bridging. Services are containerised with Docker so local and deployed environments match.',
      links: [],
      tags: ['Vue 3', 'Kestra', 'Docker'],
    },
    {
      id: '03',
      title: 'Boxxport marketplace',
      summary:
        'Container trading marketplace: buyer and seller dashboards, report generation, and location-based container search backed by REST APIs. Static site generation with asset optimisation, preloading and lazy loading moved the performance score from 60 to 90 and organic traffic up 20%. Container Radar and global search improved match success by 30% and cut bounce rate by 18%.',
      links: [],
      tags: ['Angular', 'SSG', 'Performance'],
    },
  ]);

  readonly roles = signal<Role[]>([
    {
      when: 'Dec 2025 – Present',
      title: 'Frontend Engineer',
      org: 'Fethr Health, Inc. · US, remote',
      summary:
        'Cerner FHIR OAuth2 integration using SMART Backend Services, with tenant auto-discovery, cached token minting and wildcard scope management. A no-code FHIR mapping UI over a 39-resource R4 schema seeded into PostgreSQL, resolving JSON output paths at runtime. A monitoring dashboard for connector health, message history and failures. Also the canvas-based drag-and-drop editor for a no-code workflow platform on top of Kestra.',
    },
    {
      when: 'Mar 2024 – Dec 2025',
      title: 'Software Engineer',
      org: 'Brain Crowd · Assam University, Silchar',
      summary:
        'Led the migration of Admission, Student Life Cycle, Academics and Programs workflows onto the Samarth eGov platform, cutting cross-division resolution time from days to hours. Modular architecture with lazy loading and state management in RxJS and NgRx, plus reusable accessible UI components. Wrote HLD and LLD diagrams and broke the work into sprint-sized epics and stories.',
    },
    {
      when: 'Aug 2022 – Mar 2024',
      title: 'Software Developer',
      org: 'Brain Crowd · Bengaluru',
      summary:
        'Full stack feature work on the Boxxport marketplace with cross-functional teams: dashboards, reporting, and the location-based search stack. Owned the performance and SEO pass that took the site from 60 to 90, and supported production bug fixes and rollouts alongside QA and product.',
    },
    {
      when: 'Oct 2021 – Aug 2022',
      title: 'Software Development Intern',
      org: 'Brain Crowd',
      summary:
        'Search and list infrastructure: pagination, lazy loading, throttling and debouncing, and dynamic query builders for filters. UI components for the Vessel Tracker, Carrier53 and Starthub Ventures applications.',
    },
  ]);

  readonly stack = signal<StackGroup[]>([
    { label: 'Languages', value: 'JavaScript, TypeScript, SQL' },
    { label: 'Frontend', value: 'Angular, Vue 3, SCSS' },
    { label: 'Backend', value: 'Node.js, REST APIs' },
    { label: 'Data', value: 'PostgreSQL, MySQL' },
    { label: 'Platform', value: 'Docker, AWS, Vercel, Vite' },
    { label: 'Domain', value: 'HL7, FHIR, Cerner EHR' },
  ]);

  readonly contacts = signal<Contact[]>([
    {
      label: 'Email',
      href: 'mailto:devprotim.sikdar@gmail.com',
      text: 'devprotim.sikdar@gmail.com',
      external: false,
    },
    {
      label: 'GitHub',
      href: 'https://github.com/devprotim',
      text: 'github.com/devprotim',
      external: true,
    },
    {
      label: 'LinkedIn',
      href: 'https://linkedin.com/in/dev-protim',
      text: 'in/dev-protim',
      external: true,
    },
  ]);

  constructor() {
    // localStorage/document only exist once this runs in the browser —
    // afterNextRender skips execution during server-side prerendering.
    afterNextRender(() => {
      const stored = localStorage.getItem('theme');
      const initial = stored === 'dark' || stored === 'light' ? stored : 'light';
      this.theme.set(initial);
      document.documentElement.setAttribute('data-theme', initial);
    });
  }

  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.playSwitch(next === 'dark');
  }

  // Mechanical switch click, synthesized: noise transient for the impact,
  // decaying resonant body for the clack. No audio file to load.
  private playSwitch(turningOn: boolean): void {
    if (!('AudioContext' in window)) return;

    if (!this.audioCtx) this.audioCtx = new AudioContext();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const voice = this.switchVoice(turningOn);
    const ctx = this.audioCtx;
    const t = ctx.currentTime;
    const vary = 0.96 + Math.random() * 0.08; // no two flicks identical

    const frames = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, voice.impactDecay);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = voice.impactHz * vary;
    band.Q.value = 1.3;
    const cut = ctx.createBiquadFilter();
    cut.type = 'highpass';
    cut.frequency.value = 550;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = voice.gain;
    noise.connect(band);
    band.connect(cut);
    cut.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);

    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(voice.bodyFromHz * vary, t);
    body.frequency.exponentialRampToValueAtTime(voice.bodyToHz, t + 0.03);
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(voice.gain * 0.36, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    body.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    body.start(t);
    body.stop(t + 0.06);
  }

  // Coming back off reads as a duller, lower, tighter version of the same
  // switch rather than a second one — roughly a three-quarter-octave drop.
  private switchVoice(turningOn: boolean): SwitchVoice {
    return turningOn
      ? { impactHz: 2600, impactDecay: 16, bodyFromHz: 940, bodyToHz: 430, gain: 0.5 }
      : { impactHz: 1550, impactDecay: 22, bodyFromHz: 610, bodyToHz: 275, gain: 0.42 };
  }
}
