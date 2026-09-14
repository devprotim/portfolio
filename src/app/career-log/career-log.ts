import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { LOG } from './career-log.data';
import { GRAPH_HEIGHT, layout, shaFor, type Graph, type GraphNode } from './career-log.layout';

interface Caption {
  sha: string;
  msg: string;
  ref: string;
  skill: string;
  color: string;
}

/** Seconds the marker rests on each commit before stepping to the next. */
const DWELL = 1.7;
/** Seconds for a blink to decay from full to nothing. */
const DECAY = 1.7;

@Component({
  selector: 'app-career-log',
  styleUrl: './career-log.scss',
  templateUrl: './career-log.html',
})
export class CareerLog {
  protected readonly log = LOG;
  protected readonly graphHeight = GRAPH_HEIGHT;

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Rendered server-side too, so the caption slot is never empty on load. */
  protected readonly caption = signal<Caption>({
    sha: shaFor(0),
    msg: LOG[0].msg,
    ref: 'main',
    skill: LOG[0].skill,
    color: '#a371f7',
  });

  private ctx?: CanvasRenderingContext2D;
  private graph?: Graph;
  private width = 0;
  private dpr = 1;
  /** Column width is capped, so a wide viewport leaves slack to centre. */
  private offsetX = 0;
  /** Everything drawn scales off column width, so the log fits any viewport. */
  private scale = 1;

  private focus = 0;
  private elapsed = 0;
  private hover: GraphNode | null = null;
  private shown = -1;

  private raf = 0;
  private lastFrame = 0;
  private running = false;
  private visible = true;
  private reduced = false;

  /** Fill for the hole in a merge ring, so it reads correctly in both themes. */
  private plate = '#f2f4f0';

  constructor() {
    const destroyRef = inject(DestroyRef);

    // afterNextRender skips execution during server-side prerendering.
    afterNextRender(() => {
      const canvas = this.canvasRef().nativeElement;
      const host = this.element.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      this.ctx = ctx;

      // Capping at 2 upscales a blurry backing store on 2.5x and 3x displays.
      this.dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.readTheme();
      this.measure();

      const themeWatcher = new MutationObserver(() => {
        this.readTheme();
        this.draw();
      });
      themeWatcher.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });

      const scheme = window.matchMedia('(prefers-color-scheme: dark)');
      const onScheme = () => {
        this.readTheme();
        this.draw();
      };
      scheme.addEventListener('change', onScheme);

      // Not a ResizeObserver: measure() writes the host's width, which
      // reflows the very element any observer here would be watching, and
      // that loops. The breakout depends only on the viewport anyway.
      let pending = 0;
      const onResize = () => {
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(() => this.measure());
      };
      window.addEventListener('resize', onResize);

      // Nothing animates while the graph is off screen or the tab is hidden.
      const seer = new IntersectionObserver((entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
        this.sync();
      });
      seer.observe(host);

      const onVisibility = () => this.sync();
      document.addEventListener('visibilitychange', onVisibility);

      const onMove = (event: MouseEvent) => this.onPointer(event);
      const onLeave = () => this.setHover(null);
      canvas.addEventListener('mousemove', onMove);
      canvas.addEventListener('mouseleave', onLeave);

      this.sync();

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(this.raf);
        cancelAnimationFrame(pending);
        themeWatcher.disconnect();
        seer.disconnect();
        window.removeEventListener('resize', onResize);
        scheme.removeEventListener('change', onScheme);
        document.removeEventListener('visibilitychange', onVisibility);
        canvas.removeEventListener('mousemove', onMove);
        canvas.removeEventListener('mouseleave', onLeave);
      });
    });
  }

  private readTheme(): void {
    const styles = getComputedStyle(document.documentElement);
    this.plate = styles.getPropertyValue('--bg').trim() || '#f2f4f0';
  }

  private measure(): void {
    const canvas = this.canvasRef().nativeElement;
    const host = this.element.nativeElement;
    const parent = host.parentElement;
    if (!parent) return;

    // The CSS fallback breaks out with 100vw, which counts the scrollbar and
    // lands half its width off centre. Measured values do not: clientWidth
    // excludes the scrollbar, and the parent's content edge is exact.
    const viewport = document.documentElement.clientWidth;
    if (viewport < 1 || viewport === this.width) return;
    const box = parent.getBoundingClientRect();
    const contentLeft = box.left + (parseFloat(getComputedStyle(parent).paddingLeft) || 0);

    host.style.marginInline = '0';
    host.style.marginLeft = `${-contentLeft}px`;
    host.style.width = `${viewport}px`;
    host.style.setProperty('--bleed-pad', `${contentLeft}px`);

    // A fractional CSS width makes the browser resample the backing store into
    // the box, which softens every line uniformly.
    const width = Math.floor(viewport);
    this.width = width;
    // No lower clamp: a phone gets a denser braid rather than a clipped one.
    const gap = Math.min(34, (width - 28) / (LOG.length - 1));
    this.scale = Math.max(0.42, Math.min(1, gap / 22));
    this.graph = layout(gap);
    this.offsetX = Math.round((width - this.graph.width) / 2);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${this.graph.height}px`;
    canvas.width = Math.round(width * this.dpr);
    canvas.height = Math.round(this.graph.height * this.dpr);
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // A resting scatter, so the first painted frame is a living graph.
    const seed = Math.round(this.graph.nodes.length * 0.22);
    for (let i = 0; i < seed; i++) {
      const node = this.graph.nodes[Math.floor(Math.random() * this.graph.nodes.length)];
      node.v = 0.4 + Math.random() * 0.6;
    }

    this.shown = -1;
    this.writeCaption();
    this.draw();
  }

  private sync(): void {
    const shouldRun = this.visible && !document.hidden && !this.reduced;
    if (shouldRun === this.running) return;
    this.running = shouldRun;
    if (shouldRun) {
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame((now) => this.frame(now));
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  private frame(now: number): void {
    if (!this.running) return;
    const dt = Math.min(now - this.lastFrame, 60) / 1000;
    this.lastFrame = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame((next) => this.frame(next));
  }

  private update(dt: number): void {
    const graph = this.graph;
    if (!graph) return;

    for (const node of graph.nodes) {
      if (node.v > 0) node.v = Math.max(0, node.v - dt / DECAY);
    }

    if (!this.hover) {
      this.elapsed += dt;
      if (this.elapsed >= DWELL) {
        this.elapsed = 0;
        this.focus = (this.focus + 1) % graph.nodes.length;
        graph.nodes[this.focus].v = 1;
      }
    }

    // Unscheduled blinks elsewhere in the log.
    if (Math.random() < dt * 2.6) {
      const node = graph.nodes[Math.floor(Math.random() * graph.nodes.length)];
      node.v = 0.5 + Math.random() * 0.5;
    }

    this.writeCaption();
  }

  private current(): GraphNode | undefined {
    return this.hover ?? this.graph?.nodes[this.focus];
  }

  private writeCaption(): void {
    const node = this.current();
    if (!node || node.i === this.shown) return;
    this.shown = node.i;
    this.caption.set({
      sha: node.sha,
      msg: node.msg,
      ref: node.ref,
      skill: node.skill,
      color: node.color,
    });
  }

  private onPointer(event: MouseEvent): void {
    const graph = this.graph;
    if (!graph) return;
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    const mx = event.clientX - rect.left - this.offsetX;
    const my = event.clientY - rect.top;

    let best: GraphNode | null = null;
    let bestDistance = Math.max(10, 13 * this.scale);
    for (const node of graph.nodes) {
      const distance = Math.hypot(node.x - mx, node.y - my);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = node;
      }
    }
    this.setHover(best);
  }

  private setHover(node: GraphNode | null): void {
    if (node === this.hover) return;
    this.hover = node;
    if (node) node.v = 1;
    this.writeCaption();
    if (!this.running) this.draw();
  }

  /**
   * Rails and commits draw near-solid. Half-opacity lines on a warm ground read
   * as faded, and a shadow bloom on the blink smears the whole graph, so the
   * blink is a hard-edged ripple that expands as it fades instead.
   */
  private draw(): void {
    const ctx = this.ctx;
    const graph = this.graph;
    if (!ctx || !graph) return;

    ctx.clearRect(0, 0, this.width, graph.height);
    ctx.save();
    ctx.translate(this.offsetX, 0);
    const k = this.scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.2, 2 * k);

    const current = this.current();

    for (const rail of graph.rails) {
      if (rail.x0 === null) continue;
      ctx.strokeStyle = rail.color;
      ctx.globalAlpha = 0.92;
      if (rail.parent) {
        ctx.beginPath();
        this.elbow(rail.parent.x, rail.parent.y, rail.x0, rail.y, rail.parent.x + graph.gap * 0.5);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(rail.x0, rail.y);
      ctx.lineTo(rail.x1, rail.y);
      ctx.stroke();
    }

    for (const node of graph.nodes) {
      if (!node.mergeFrom) continue;
      ctx.globalAlpha = 0.92;
      ctx.strokeStyle = node.mergeFrom.color;
      ctx.beginPath();
      this.elbow(node.mergeFrom.x, node.mergeFrom.y, node.x, node.y, node.x - graph.gap * 0.5);
      ctx.stroke();
    }

    for (const node of graph.nodes) {
      const isCurrent = node === current;

      if (node.v > 0.03) {
        ctx.globalAlpha = 0.3 * node.v;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, (4 + 9 * (1 - node.v)) * k, 0, Math.PI * 2);
        ctx.fill();
      }

      // A commit that happened is not a ghost.
      ctx.globalAlpha = isCurrent ? 1 : 0.8 + 0.2 * node.v;
      ctx.fillStyle = node.color;
      ctx.strokeStyle = node.color;

      if (node.merge) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, (isCurrent ? 6 : 5.4) * k, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.plate;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3.6 * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1, 1.9 * k), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(node.x, node.y, (isCurrent ? 4.8 : 3.8) * k, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isCurrent) {
        ctx.globalAlpha = 0.62;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(6, 9.5 * k), 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = Math.max(1.2, 2 * k);
      }
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /**
   * A square turn with a small radius: run along the source lane, turn once,
   * run along the target lane. `turnX` always sits strictly between the two
   * ends, so the path never doubles back on itself.
   */
  private elbow(ax: number, ay: number, bx: number, by: number, turnX: number): void {
    const ctx = this.ctx!;
    const dir = by > ay ? 1 : -1;
    const r = Math.min(
      7 * this.scale,
      Math.abs(by - ay) / 2,
      Math.abs(turnX - ax),
      Math.abs(bx - turnX),
    );
    ctx.moveTo(ax, ay);
    ctx.lineTo(turnX - r, ay);
    ctx.quadraticCurveTo(turnX, ay, turnX, ay + dir * r);
    ctx.lineTo(turnX, by - dir * r);
    ctx.quadraticCurveTo(turnX, by, turnX + r, by);
    ctx.lineTo(bx, by);
  }
}
