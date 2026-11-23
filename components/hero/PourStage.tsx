"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  animate,
  createTimeline,
  onScroll,
  utils,
  type JSAnimation,
  type Timeline,
} from "animejs";
import { scrollToSection } from "@/lib/smooth-scroll";
import { Cup } from "./Cup";
import type { Cup3D } from "./cup3d";

const SESSION_KEY = "clap-intro-seen";

// Where the 3D cup stops tipping, in real degrees (upright is about 11, mouth-on is 90).
const TIP_END = 70;

// Where the centre of the cup's rim sits while it pours, as a share of the stage height.
// Above the middle, so the cup stays clear of the page bottom and the stream has room.
const RIM_REST = 0.36;

// How far the cup lifts at the end of the pour, as a share of the stage height.
const PULL_UP = 0.05;

// When the latte starts to rise on the pour timeline (the stream has run since 340). The track
// height in globals.css must grow with it: (LATTE_AT + 479) units * 196svh / 819 units + 100svh.
const LATTE_AT = 590;

const WAVE_PATH =
  "M0,60 C240,110 480,10 720,60 C960,110 1200,10 1440,60 C1680,110 1920,10 2160,60 C2400,110 2640,10 2880,60 L2880,120 L0,120 Z";

/**
 * Hero: loader + scroll-scrubbed pour, one cup.
 *
 * Without JS, or with reduced motion, the head script never adds `html.js-motion`
 * and this renders as a plain static hero (upright cup, no loader, no pour).
 * With motion on:
 *   1. Loader: the cup drops in and the latte fills it from the bottom (time-based, runs once).
 *   2. Pour: one timeline tied to scroll position with onScroll({ sync: true }).
 *      The cup tips toward you until its mouth faces the screen, a stream runs out
 *      of it, and the latte rises to fill the page. Scrolling up reverses it.
 * The cup, the stream's outline (an SVG path redrawn on scroll) and the 3D scene are the only
 * things redrawn per frame; everything else animates transform and opacity.
 */
export function PourStage({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const html = document.documentElement;
    if (!html.classList.contains("js-motion")) return;

    const one = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
    const stage = one<HTMLElement>(".hero-stage");
    const cup = one<HTMLElement>(".cup");
    const body = one<SVGGElement>(".cup-body");
    const rim = one<SVGGElement>(".cup-rim");
    const coffee = one<SVGCircleElement>(".cup-coffee");
    const streamSvg = one<SVGSVGElement>(".pour-stream svg");
    const streamPath = one<SVGPathElement>(".pour-path");
    const latte = one<HTMLElement>(".latte");
    const wave = one<HTMLElement>(".wave");
    const hint = one<HTMLElement>(".hero-hint");
    const arrows = one<SVGElement>(".hint-arrows");

    let disposed = false;
    let finished = false;
    let intro: Timeline | null = null;
    let pour: Timeline | null = null;
    const loops: JSAnimation[] = [];
    const teardown: Array<() => void> = [];

    // The only ambient motion: a slow drift of the latte's surface.
    // Paused whenever the hero is off-screen.
    loops.push(animate(wave, { x: ["0%", "-50%"], duration: 12000, loop: true, ease: "linear" }));
    const io = new IntersectionObserver(([entry]) => {
      loops.forEach((a) => (entry.isIntersecting ? a.resume() : a.pause()));
    });
    io.observe(root);
    teardown.push(() => io.disconnect());

    // Desktop only: swap the SVG cup for the Blender model. Anything that fails
    // (no WebGL, network, small screens, touch) keeps the SVG cup untouched.
    let ready3D: Cup3D | null = null; // loaded
    let cup3d: Cup3D | null = null; // loaded and swapped in
    // Set once the page has decided which cup to use. A model that arrives after that is
    // thrown away (disposed) instead of sitting unused in memory with a live WebGL context.
    let swapDecided = false;
    // The latte colour comes from the CSS variable, so the CSS stays the one place to change it.
    const liquidColor = () => getComputedStyle(html).getPropertyValue("--liquid").trim() || "#d9b98f";
    const load3D = async () => {
      if (!window.matchMedia("(min-width: 768px) and (pointer: fine)").matches) return;
      try {
        const { mountCup3D } = await import("./cup3d");
        const handle = await mountCup3D(cup, liquidColor());
        if (disposed || swapDecided) {
          handle.dispose();
          return;
        }
        ready3D = handle;
        teardown.push(() => {
          handle.dispose();
          cup.classList.remove("cup--3d");
        });
      } catch {
        ready3D = null;
      }
    };
    const loading3D = load3D();
    const show3D = (fill: number) => {
      swapDecided = true;
      if (!ready3D) return;
      cup3d = ready3D;
      cup3d.setTilt(cup3d.restTilt);
      cup3d.setFill(fill);
      cup.classList.add("cup--3d");
    };

    // The poured stream is one path, redrawn as you scroll. Units are `u` (see globals.css),
    // measured from the lip, with y pointing down. Its shape never changes: it leaves the
    // inner opening of the glass (the sides follow that ellipse, so the stream and the latte
    // are one shape with no notch) and settles into a column that ends in a round U. Scrolling
    // only changes how far it hangs (`len`).
    const RIM_A = 62; // the latte's outline in the glass: half-width,
    const RIM_B = 60; // half-height,
    const RIM_Y = -48; // and centre, relative to the stream's origin
    const COLUMN = 37; // half-width of the column
    const FILLET = 14; // how softly the outline turns from the latte's edge into the column
    const U_DEPTH = 34; // how deep the rounded end is
    const flow = { len: 0 };
    const side = (y: number, column: number) => {
      const t = (y - RIM_Y) / RIM_B;
      const ellipse = RIM_A * Math.sqrt(Math.max(0, 1 - t * t));
      // smooth max of the two: the outline follows the latte, then turns into the column along
      // a soft concave curve. The 0.97 keeps the top corners inside the latte (no ears).
      return 0.97 * 0.5 * (ellipse + column + Math.sqrt((ellipse - column) ** 2 + FILLET ** 2));
    };
    const flowLength = () => (window.innerHeight * 1.25) / ((streamSvg.clientWidth || 1) / 140);
    let lastDrawn = -1;
    const drawStream = (len: number) => {
      const key = Math.round(len * 10);
      if (key === lastDrawn) return;
      lastDrawn = key;
      const capTop = len - U_DEPTH; // where the rounded end starts
      if (capTop < RIM_Y + RIM_B - U_DEPTH) {
        streamPath.setAttribute("d", ""); // still hidden behind the latte
        return;
      }
      const top = Math.min(RIM_Y, capTop - 1);
      const sideAt = (y: number) => side(y, COLUMN); // the width never changes
      const pts: string[] = [];
      const add = (x: number, y: number) => pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
      const steps = Math.max(6, Math.ceil((capTop - top) / 8));
      add(-sideAt(top), top);
      add(sideAt(top), top);
      for (let i = 1; i <= steps; i++) {
        const y = top + ((capTop - top) * i) / steps; // down the right side
        add(sideAt(y), y);
      }
      const w = sideAt(capTop);
      for (let i = 1; i < 20; i++) {
        const a = (Math.PI * i) / 20; // the round end, right to left
        add(w * Math.cos(a), capTop + U_DEPTH * Math.sin(a));
      }
      for (let i = steps; i >= 1; i--) {
        const y = top + ((capTop - top) * i) / steps; // up the left side
        add(-sideAt(y), y);
      }
      streamPath.setAttribute("d", `M${pts.join("L")}Z`);
    };
    const sizeStream = () => {
      // one viewBox unit = one `u` horizontally; the height follows the svg's own box so the
      // two axes always share a scale (the cup's width can still be settling on first layout)
      const w = streamSvg.clientWidth;
      if (!w) return;
      streamSvg.setAttribute("viewBox", `-70 -45 140 ${((140 * streamSvg.clientHeight) / w).toFixed(1)}`);
    };
    sizeStream();
    // the box is not final on the first pass (fonts, the cup's width clamp), so follow it
    const streamObserver = new ResizeObserver(sizeStream);
    streamObserver.observe(streamSvg);
    teardown.push(() => streamObserver.disconnect());

    // Centre the scroll arrow in the gap between the bottom of the resting glass and the top
    // of the dock. Offsets ignore transforms, so this is safe whenever it runs.
    const placeHint = () => {
      const nav = document.querySelector("nav");
      if (!nav) return;
      const center = one<HTMLElement>(".hero-center");
      const glassBottom = center.offsetTop + cup.offsetTop + 182 * (cup.offsetWidth / 200);
      const navTop = nav.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      const top = (glassBottom + navTop) / 2 - hint.offsetHeight / 2;
      hint.style.bottom = "auto";
      hint.style.top = `${Math.max(glassBottom + 8, top)}px`;
    };
    placeHint();
    window.addEventListener("load", placeHint);
    teardown.push(() => window.removeEventListener("load", placeHint));

    // How far the cup moves so the centre of its rim ends at RIM_REST of the stage height.
    // offsetTop ignores transforms, so this is safe mid-scroll.
    const riseShift = () => {
      const center = one<HTMLElement>(".hero-center");
      const rimY = center.offsetTop + cup.offsetTop + 40 * (cup.offsetWidth / 200);
      return stage.clientHeight * RIM_REST - rimY;
    };

    const buildPour = () => {
      const handle = cup3d as Cup3D | null;
      const tipping = { deg: handle?.restTilt ?? 0 };
      // Redraw once the scroll position has been applied. Tween callbacks can be skipped when
      // you jump straight back to the top (the cup stayed tipped), so this re-reads the values.
      let syncQueued = false;
      const sync = () => {
        syncQueued = false;
        handle?.setTilt(tipping.deg);
        drawStream(flow.len);
      };
      pour = createTimeline({
        defaults: { ease: "linear" },
        autoplay: onScroll({
          target: root,
          enter: "top top",
          leave: "bottom bottom",
          // a number below 1 smooths the scrub: the animation eases toward the scroll position
          sync: 0.65,
          onUpdate: () => {
            if (syncQueued) return;
            syncQueued = true;
            requestAnimationFrame(sync);
          },
          onEnter: () => stage.setAttribute("data-pouring", ""),
          onLeave: () => stage.removeAttribute("data-pouring"),
        }),
      });
      if (handle) {
        pour.add(
          tipping,
          {
            deg: [handle.restTilt, TIP_END],
            duration: 380,
            ease: "inOutSine",
            onUpdate: () => handle.setTilt(tipping.deg),
          },
          60,
        );
      } else {
        pour
          .add(body, { scaleY: [1, 0.04], duration: 380, ease: "inOutSine" }, 60)
          .add(body, { opacity: [1, 0], duration: 60 }, 380)
          .add(rim, { scaleY: [0.19, 1], duration: 380, ease: "inOutSine" }, 60);
      }
      pour
        .add(hint, { opacity: [1, 0], y: [0, 20], duration: 50 }, 0)
        // tip toward the viewer: the body folds away, the mouth opens to a full circle
        .add(cup, { scale: [1, 1.25], duration: 380, ease: "inOutSine" }, 60)
        // The cup rises for the whole pour, on an exponential curve tied to the scroll: most of
        // the rise comes right at the start, then it keeps creeping up (5% of the screen extra
        // by the end, like pulling the jug up) and never settles into a jump.
        .add(
          cup,
          { y: [0, riseShift() - stage.clientHeight * PULL_UP], duration: LATTE_AT + 180 - 60, ease: "outExpo" },
          60,
        )
        // the stream runs out, the latte rises to meet it
        .add(
          flow,
          {
            len: [0, flowLength()],
            duration: 130,
            ease: "outQuad",
            onUpdate: () => drawStream(flow.len),
          },
          340,
        )
        // The latte rises 1:1 with the scroll (115svh of travel over 115svh of scroll, see
        // the track height) and the menu follows right under its wave: #drinks is pulled up
        // by 100svh in CSS so its top edge trails the wave and never shows a gap or a seam.
        // It waits until LATTE_AT, so the stream keeps pouring for a while first.
        .add(latte, { y: ["115%", "0%"], duration: 479 }, LATTE_AT);
    };

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (disposed) return;
        placeHint();
        if (!pour) return;
        pour.revert();
        sizeStream();
        buildPour();
      }, 200);
    };
    window.addEventListener("resize", onResize);
    teardown.push(() => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    });

    // Click the cup before scrolling and it spins like a toppling top: it whirls once,
    // leans over and wobbles round in a circle, then slowly rights itself and settles facing
    // front. 3D cup only, and only while the page is at the top.
    let spinning: JSAnimation | null = null;
    const onCupClick = () => {
      if (!cup3d || !finished || spinning || window.scrollY > 24) return;
      const handle = cup3d;
      const run = { p: 0 };
      const outCubic = (t: number) => 1 - (1 - t) ** 3;
      spinning = animate(run, {
        p: [0, 1],
        duration: 1800,
        ease: "linear",
        onUpdate: () => {
          const t = run.p;
          const phase = outCubic(t) * Math.PI * 2; // the lean circles once
          const lean = 15 * (1 - t) ** 1.6 * Math.min(1, t / 0.07); // topples fast, then rights itself
          handle.setPose({
            spin: outCubic(t) * 360, // one full turn, so it ends facing front
            leanX: lean * Math.cos(phase),
            leanZ: lean * Math.sin(phase),
            lift: 0.1 * Math.sin(Math.PI * Math.min(1, t * 1.15)), // floats up a little and back
          });
        },
        onComplete: () => {
          handle.setPose({ spin: 0, leanX: 0, leanZ: 0, lift: 0 });
          spinning = null;
        },
      });
    };
    cup.addEventListener("click", onCupClick);
    // Idle float: while the page is at the top the glass bobs gently. Only the canvas moves
    // (a CSS transform, no extra WebGL renders). Scrolling eases it back to rest and stops it,
    // so it never fights the pour; scrolling back to the top starts it again.
    const bob = { phase: 0, amp: 0 };
    let floatLoop: JSAnimation | null = null;
    let floatEase: JSAnimation | null = null;
    const applyFloat = (canvas: HTMLElement) => {
      canvas.style.transform = bob.amp
        ? `translate3d(0, ${(Math.sin(bob.phase) * bob.amp * 7).toFixed(2)}px, 0)`
        : "";
    };
    const setFloating = (on: boolean) => {
      const canvas = cup.querySelector<HTMLElement>(".cup-canvas");
      if (!canvas) return;
      if (!floatLoop) {
        floatLoop = animate(bob, {
          phase: [0, Math.PI * 2],
          duration: 3600,
          loop: true,
          ease: "linear",
          autoplay: false,
          onUpdate: () => applyFloat(canvas),
        });
      }
      floatEase?.cancel();
      if (on) floatLoop.resume();
      floatEase = animate(bob, {
        amp: on ? 1 : 0,
        duration: 400,
        ease: "inOutSine",
        onUpdate: () => applyFloat(canvas),
        onComplete: () => {
          if (!on) floatLoop?.pause();
        },
      });
    };
    let floating = false;
    // Click the arrow and the page scrolls itself down to the menu on the pour's S-curve
    // (see lib/smooth-scroll.ts, shared with the Drinks icon in the dock).
    const onHintClick = () => {
      if (finished) scrollToSection("drinks");
    };
    const arrow = hint.querySelector<SVGElement>(".hint-arrows");
    arrow?.addEventListener("click", onHintClick);
    const updateCursor = () => {
      if (arrow) {
        const hintOn = finished && window.scrollY <= 24;
        arrow.style.pointerEvents = hintOn ? "auto" : "none";
        arrow.style.cursor = hintOn ? "pointer" : "";
      }
      const atTop = !!cup3d && finished && window.scrollY <= 24;
      cup.style.cursor = atTop ? "pointer" : "";
      if (atTop !== floating) {
        floating = atTop;
        setFloating(atTop);
      }
    };
    window.addEventListener("scroll", updateCursor, { passive: true });
    teardown.push(() => {
      cup.removeEventListener("click", onCupClick);
      window.removeEventListener("scroll", updateCursor);
      arrow?.removeEventListener("click", onHintClick);
      floatLoop?.revert();
      floatEase?.revert();
      spinning?.revert();
    });

    const finish = () => {
      if (finished || disposed) return;
      finished = true;
      placeHint();
      updateCursor();
      utils.set(hint, { opacity: 0 });
      html.classList.remove("js-loader");
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}
      animate(hint, { opacity: [0, 1], y: [10, 0], duration: 600, ease: "outQuad" });
      loops.push(
        animate(arrows, { y: [0, 6], duration: 1100, loop: true, alternate: true, ease: "inOutSine" }),
      );
      buildPour();
    };

    const needsLoader = html.classList.contains("js-loader") && window.scrollY < 40;
    if (!needsLoader) {
      html.classList.remove("js-loader");
      utils.set(cup, { opacity: 1 });
      // Deep link or reload mid-page: same rule as the loader path, so a slow model download
      // can never leave the pour unbuilt. After 2.5 seconds the SVG cup is used.
      Promise.race([loading3D, new Promise((r) => setTimeout(r, 2500))]).then(() => {
        if (disposed) return;
        show3D(1);
        finish();
      });
    } else {
      let seen = false;
      try {
        seen = sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {}

      // Give the model a moment to load so the loader plays on the 3D cup. If it is
      // slow, the SVG cup plays the loader and stays.
      Promise.race([loading3D, new Promise((r) => setTimeout(r, 2500))]).then(() => {
        if (disposed) return;
        show3D(0);

        let resolveIntro: () => void = () => {};
        const introDone = new Promise<void>((r) => (resolveIntro = r));

        const fillState = { v: 0 };
        const tl = createTimeline({
          defaults: { ease: "outQuad" },
          playbackRate: seen ? 2.4 : 1,
          onComplete: () => resolveIntro(),
        });
        intro = tl;
        tl.add(cup, { opacity: [0, 1], y: [30, 0], duration: 500 }, 0)
          .add(
            fillState,
            {
              v: [0, 1],
              duration: 1000,
              ease: "inOutSine",
              onUpdate: () => cup3d?.setFill(fillState.v),
            },
            500,
          )
          .add(coffee, { scale: [0, 1], opacity: [0, 1], duration: 1000, ease: "inOutSine" }, 500);

        const skip = () => {
          tl.complete();
          resolveIntro();
        };
        window.addEventListener("pointerdown", skip, { once: true });
        window.addEventListener("keydown", skip, { once: true });
        teardown.push(() => {
          window.removeEventListener("pointerdown", skip);
          window.removeEventListener("keydown", skip);
        });

        // Don't reveal "Scroll to start" until the page and fonts have really loaded.
        const loaded = new Promise<void>((resolve) => {
          const settle = () => {
            const fonts = document.fonts?.ready ?? Promise.resolve();
            Promise.race([fonts, new Promise((r) => setTimeout(r, 4000))]).then(() => resolve());
          };
          if (document.readyState === "complete") settle();
          else window.addEventListener("load", settle, { once: true });
        });

        Promise.all([introDone, loaded]).then(finish);
      });
    }

    return () => {
      disposed = true;
      teardown.forEach((fn) => fn());
      loops.forEach((a) => a.revert());
      intro?.revert();
      pour?.revert();
      stage.removeAttribute("data-pouring");
    };
  }, []);

  return (
    <section id="top" aria-label="Welcome">
      <div ref={rootRef} className="hero-track">
        <div className="hero-stage">
          <div className="hero-center">
            <div className="cup" aria-hidden="true">
              <span className="pour-stream">
                <svg preserveAspectRatio="none">
                  <path className="pour-path" />
                </svg>
              </span>
              <Cup />
            </div>
            {children}
          </div>

          <div className="hero-hint" aria-hidden="true">
            <svg
              className="hint-arrows"
              width="16"
              height="72"
              viewBox="0 0 16 72"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2v66" />
              <path d="M2.5 62.5L8 68l5.5-5.5" />
            </svg>
          </div>

          <div className="latte" aria-hidden="true">
            <div className="wave">
              <svg viewBox="0 0 2880 120" preserveAspectRatio="none">
                <path d={WAVE_PATH} />
              </svg>
            </div>
          </div>

          <svg
            className="static-wave"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,60 C240,110 480,10 720,60 C960,110 1200,10 1440,60 L1440,120 L0,120 Z"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
