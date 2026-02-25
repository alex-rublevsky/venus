import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

interface LottieCursorProps {
  isVisible: boolean;
  animationPath?: string;
  size?: number;
}

export default function LottieCursor({ 
  isVisible: initialVisible, 
  animationPath = '/animations/eyes-cursor.json',
  size = 70
}: LottieCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Initialize Lottie animation
    animationRef.current = lottie.loadAnimation({
      container: cursor,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: animationPath,
    });

    // Mouse move handler using RAF for optimal performance
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      if (rafRef.current) return;
      
      rafRef.current = requestAnimationFrame(() => {
        if (cursor) {
          const x = mousePos.current.x - size / 2;
          const y = mousePos.current.y - size / 2;
          cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
        rafRef.current = undefined;
      });
    };

    // Cursor visibility handler
    const handleCursorVisibility = (e: Event) => {
      const customEvent = e as CustomEvent<{ visible: boolean }>;
      if (cursor) {
        cursor.style.opacity = customEvent.detail.visible ? '1' : '0';
      }
    };

    // Attach event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('cursor-visibility', handleCursorVisibility as EventListener);

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('cursor-visibility', handleCursorVisibility as EventListener);
      animationRef.current?.destroy();
    };
  }, [animationPath, size]);

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0,
        transition: 'opacity 0.2s ease',
        willChange: 'transform, opacity',
      }}
    />
  );
}
