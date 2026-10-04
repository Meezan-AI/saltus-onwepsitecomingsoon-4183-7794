import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number };

const ORANGE = "255, 107, 0";
const BLUE = "120, 170, 255";

/**
 * Interactive neural-network canvas for the hero background.
 *
 * Performance guards: particle count scales with viewport area, DPR is capped at 2,
 * the loop pauses when the tab is hidden or the section scrolls out of view, and the
 * whole effect is skipped for `prefers-reduced-motion` users.
 */
export function NeuralBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let frame = 0;
    let running = true;
    const pointer = { x: -9999, y: -9999, active: false };

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = dpr();
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      // ~1 node per 16k px², clamped so phones stay light and 4K screens stay sane.
      const count = Math.round(Math.min(90, Math.max(26, (width * height) / 16000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.9,
      }));
    }

    const linkDist = () => (width < 640 ? 110 : 150);
    const pointerDist = () => (width < 640 ? 120 : 180);

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const link = linkDist();
      const reach = pointerDist();

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]!;

        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > width) a.vx *= -1;
        if (a.y < 0 || a.y > height) a.vy *= -1;
        a.x = Math.max(0, Math.min(width, a.x));
        a.y = Math.max(0, Math.min(height, a.y));

        // gentle attraction toward the cursor, capped so nodes never clump
        if (pointer.active) {
          const dx = pointer.x - a.x;
          const dy = pointer.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d < reach && d > 1) {
            const pull = (1 - d / reach) * 0.035;
            a.vx += (dx / d) * pull;
            a.vy += (dy / d) * pull;
            const speed = Math.hypot(a.vx, a.vy);
            if (speed > 0.75) {
              a.vx = (a.vx / speed) * 0.75;
              a.vy = (a.vy / speed) * 0.75;
            }
          }
        }
        a.vx *= 0.994;
        a.vy *= 0.994;
        if (Math.hypot(a.vx, a.vy) < 0.06) {
          a.vx += (Math.random() - 0.5) * 0.05;
          a.vy += (Math.random() - 0.5) * 0.05;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > link * link) continue;
          const d = Math.sqrt(d2);
          const alpha = (1 - d / link) * 0.32;
          const near =
            pointer.active && (Math.hypot(pointer.x - a.x, pointer.y - a.y) < reach || Math.hypot(pointer.x - b.x, pointer.y - b.y) < reach);
          ctx.strokeStyle = near ? `rgba(${ORANGE}, ${alpha * 1.5})` : `rgba(${BLUE}, ${alpha})`;
          ctx.lineWidth = near ? 1 : 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        const lit = pointer.active && Math.hypot(pointer.x - a.x, pointer.y - a.y) < reach;
        ctx.fillStyle = lit ? `rgba(${ORANGE}, 0.95)` : `rgba(${BLUE}, 0.6)`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, lit ? a.r * 1.5 : a.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      if (!running) return;
      draw();
      frame = requestAnimationFrame(loop);
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerType === "touch") return; // don't hijack scrolling on mobile
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.x <= rect.width && pointer.y >= 0 && pointer.y <= rect.height;
    }

    function onPointerLeave() {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    }

    function start() {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    resize();

    if (reduced) {
      draw(); // one static frame — still decorative, no animation
      return () => {};
    }

    frame = requestAnimationFrame(loop);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver((entries) => (entries[0]?.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none h-full w-full ${className}`} />;
}
