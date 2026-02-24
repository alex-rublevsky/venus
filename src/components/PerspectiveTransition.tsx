import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, type ReactNode } from 'react';

interface PerspectiveTransitionProps {
  children: ReactNode;
}

export default function PerspectiveTransition({ children }: PerspectiveTransitionProps) {
  const container = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"]
  });

  // Convert children array to sections
  const childArray = Array.isArray(children) ? children : [children];
  const [section1Content, section2Content] = childArray;

  return (
    <div ref={container} className="relative h-[200vh]">
      <Section1 scrollYProgress={scrollYProgress}>
        {section1Content}
      </Section1>
      <Section2 scrollYProgress={scrollYProgress}>
        {section2Content}
      </Section2>
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  scrollYProgress: any;
}

const Section1 = ({ children, scrollYProgress }: SectionProps) => {
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);

  return (
    <motion.div 
      style={{ scale, rotate }} 
      className="sticky top-0 h-screen w-full"
    >
      <div className="w-full h-full">
        {children}
      </div>
    </motion.div>
  );
};

const Section2 = ({ children, scrollYProgress }: SectionProps) => {
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [5, 0]);

  return (
    <motion.div 
      style={{ scale, rotate }} 
      className="relative min-h-screen w-full"
    >
      <div className="w-full">
        {children}
      </div>
    </motion.div>
  );
};
