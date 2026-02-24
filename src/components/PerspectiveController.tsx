import { useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';

export default function PerspectiveController() {
  const containerRef = useRef<HTMLElement | null>(null);
  const section1Ref = useRef<HTMLElement | null>(null);
  const section2Ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current = document.querySelector('[data-perspective-container]');
    section1Ref.current = document.querySelector('[data-perspective-section="1"]');
    section2Ref.current = document.querySelector('[data-perspective-section="2"]');
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scale1 = useTransform(scrollYProgress, [0.4, 1], [1, 0.8]);
  const rotate1 = useTransform(scrollYProgress, [0.4, 1], [0, -5]);
  const scale2 = useTransform(scrollYProgress, [0.4, 1], [0.8, 1]);
  const rotate2 = useTransform(scrollYProgress, [0.4, 1], [5, 0]);

  useMotionValueEvent(scrollYProgress, "change", () => {
    if (section1Ref.current) {
      const s1 = scale1.get();
      const r1 = rotate1.get();
      section1Ref.current.style.transform = `scale(${s1}) rotate(${r1}deg)`;
    }
    
    if (section2Ref.current) {
      const s2 = scale2.get();
      const r2 = rotate2.get();
      section2Ref.current.style.transform = `scale(${s2}) rotate(${r2}deg)`;
    }
  });

  return null;
}
