import { useEffect, useState } from "react";

export default function useFps(): number {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let last = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      frameCount += 1;
      const delta = now - last;

      if (delta >= 1000) {
        setFps(Math.round((frameCount * 1000) / delta));
        frameCount = 0;
        last = now;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, []);

  return fps;
}
