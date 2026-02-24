import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useEffect, useState } from 'react';

interface ScrollTextRevealProps {
  paragraph: string;
  scrollOffset?: [string, string];
  insidePerspectiveWrapper?: boolean;
}

export default function ScrollTextReveal({ 
  paragraph, 
  scrollOffset = ["start 0.9", "start 0.65"],
  insidePerspectiveWrapper = false
}: ScrollTextRevealProps) {
  const container = useRef<HTMLParagraphElement>(null);
  const [adjustedOffset, setAdjustedOffset] = useState(scrollOffset);

  useEffect(() => {
    if (insidePerspectiveWrapper && container.current) {
      // The perspective wrapper applies:
      // - translateY(-100vh): shifts content up by 1 viewport
      // - scale(0.8 -> 1.0): affects visual size/position during scroll
      // - rotate(5deg -> 0deg): minor visual offset
      // 
      // Compensation: Add ~0.8 to base offsets to account for -100vh transform
      // (slightly less than 1.0 due to scale effects making content appear "closer")
      setAdjustedOffset(["start 1.7", "start 1.45"]);
    }
  }, [insidePerspectiveWrapper]);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: adjustedOffset
  });

  const words = paragraph.split(" ");
  
  return (
    <p 
      ref={container}         
      className="text-2xl lg:text-3xl font-semibold max-w-3xl mx-auto"
      style={{ lineHeight: '1.25' }}
    >
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + (1 / words.length);
        return <Word key={i} progress={scrollYProgress} range={[start, end]}>{word}</Word>;
      })}
    </p>
  );
}

interface WordProps {
  children: string;
  progress: any;
  range: [number, number];
}

const Word = ({ children, progress, range }: WordProps) => {
  const opacity = useTransform(progress, range, [0, 1]);
  
  return (
    <span className="relative mr-2 inline-block">
      <span className="absolute opacity-20 inset-0">{children}</span>
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
};
