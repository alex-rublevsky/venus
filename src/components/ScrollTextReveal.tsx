import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

interface ScrollTextRevealProps {
  paragraph: string;
}

export default function ScrollTextReveal({ paragraph }: ScrollTextRevealProps) {
  const container = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 0.8", "start 0.15"]
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
