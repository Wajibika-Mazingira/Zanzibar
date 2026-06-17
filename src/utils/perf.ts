// Small performance instrumentation for CI / local profiling
export function startPerfReporting() {
  try {
    const perf: Record<string, number> = {};

    if ('PerformanceObserver' in window) {
      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              perf.fcp = Math.round(entry.startTime);
            }
          }
        });
        po.observe({ type: 'paint', buffered: true });
      } catch {}

      try {
        const po2 = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            perf.lcp = Math.round((entry as any).renderTime || entry.startTime);
          }
        });
        // @ts-ignore - LCP type may not be recognized in older TS libs
        po2.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
    }

    // Expose for tests / CI to read after load
    (window as any).__perfMetrics = perf;

    // Dump after load
    window.addEventListener('load', () => {
      setTimeout(() => {
        try {
          console.info('[perf] metrics', (window as any).__perfMetrics || perf);
        } catch {}
      }, 2000);
    });
  } catch (e) {
    // noop
  }
}
