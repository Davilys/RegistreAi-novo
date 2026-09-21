import { useEffect, useRef } from 'react';

// One greeting per loaded page, including internal route changes. No cookies,
// storage, tracking events or personal identifiers are needed for this effect.
let greetingConsumed = false;
const DURATION_MS = 1000;
const VISIBLE_RATIO = 0.6;

export default function useMascotGreeting(enabled: boolean) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!enabled || !svg) return;
    if (greetingConsumed) {
      svg.dataset.greeting = 'done';
      return;
    }

    const eye = svg.querySelector<SVGGElement>('[data-reg-eye]');
    const arm = svg.querySelector<SVGGElement>('[data-reg-arm]');
    if (!eye || !arm || typeof window.matchMedia !== 'function' ||
        typeof window.IntersectionObserver !== 'function' ||
        typeof eye.animate !== 'function' || typeof arm.animate !== 'function') {
      svg.dataset.greeting = 'static';
      return;
    }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || typeof preference.addEventListener !== 'function') {
      greetingConsumed = true;
      svg.dataset.greeting = 'static';
      return;
    }

    let disposed = false;
    let inView = false;
    let started = false;
    let observer: IntersectionObserver | undefined;
    const animations: Animation[] = [];
    svg.dataset.greeting = 'waiting';

    function release() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      preference.removeEventListener('change', onPreferenceChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      // Also restores the exact original pose; no forwards fill or residual transform.
      for (const animation of animations) animation.cancel();
    }
    function finish(state: 'done' | 'static' = 'done') {
      if (disposed) return;
      svg!.dataset.greeting = state;
      release();
    }
    function start() {
      if (disposed || started || !inView || document.visibilityState !== 'visible') return;
      if (preference.matches || greetingConsumed) {
        finish('static');
        return;
      }
      started = true;
      greetingConsumed = true;
      observer?.disconnect();
      svg!.dataset.greeting = 'playing';
      const timing: KeyframeAnimationOptions = {
        duration: DURATION_MS, iterations: 1, fill: 'none', easing: 'linear',
      };
      try {
        const blink = eye!.animate([
          { transform: 'scaleY(1)', offset: 0 },
          { transform: 'scaleY(1)', offset: 0.12, easing: 'ease-in-out' },
          { transform: 'scaleY(0.08)', offset: 0.19, easing: 'ease-in-out' },
          { transform: 'scaleY(1)', offset: 0.28 },
          { transform: 'scaleY(1)', offset: 1 },
        ], { ...timing, id: 'reg-greeting-blink' });
        animations.push(blink);
        // Install the rejection handler immediately, even if the second animation fails.
        void blink.finished.catch(() => finish());
        const wave = arm!.animate([
          { transform: 'rotate(0deg)', offset: 0, easing: 'ease-in-out' },
          { transform: 'rotate(-7deg)', offset: 0.35, easing: 'ease-in-out' },
          { transform: 'rotate(4deg)', offset: 0.65, easing: 'ease-in-out' },
          { transform: 'rotate(0deg)', offset: 1 },
        ], { ...timing, id: 'reg-greeting-wave' });
        animations.push(wave);
        void Promise.all(animations.map(animation => animation.finished))
          .then(() => finish(), () => finish());
      } catch {
        // A decorative effect must never break the site or hide the mascot.
        finish('static');
      }
    }
    function onPreferenceChange() {
      if (!preference.matches) return;
      greetingConsumed = true;
      finish('static');
    }
    function onVisibilityChange() {
      if (started && document.visibilityState !== 'visible') finish();
      else start();
    }

    try {
      observer = new IntersectionObserver(entries => {
        if (disposed) return;
        const entry = entries.find(item => item.target === svg);
        if (!entry) return;
        inView = entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO;
        start();
      }, { threshold: VISIBLE_RATIO });
      preference.addEventListener('change', onPreferenceChange);
      document.addEventListener('visibilitychange', onVisibilityChange);
      observer.observe(svg);
    } catch {
      finish('static');
    }
    // Cleanup mirrors setup, including React StrictMode's initial extra cycle.
    return release;
  }, [enabled]);

  return ref;
}
