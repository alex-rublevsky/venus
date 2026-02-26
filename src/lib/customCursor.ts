import lottie from 'lottie-web';
import type { AnimationItem } from 'lottie-web';

type CursorMode = 'hidden' | 'lottie' | 'text';

interface CursorConfig {
  mode: CursorMode;
  lottieAnimation?: string;
  text?: string;
  size?: number;
}

class CustomCursor {
  private container: HTMLDivElement;
  private lottieContainer: HTMLDivElement;
  private textContainer: HTMLDivElement;
  private animation: AnimationItem | null = null;
  private rafId: number | undefined;
  private mousePos = { x: 0, y: 0 };
  private currentMode: CursorMode = 'hidden';
  private isEnabled = false;
  private currentSize = 70;

  constructor() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'custom-cursor';
    Object.assign(this.container.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '0',
      transition: 'opacity 0.2s ease',
      willChange: 'transform, opacity',
    });

    // Create Lottie container
    this.lottieContainer = document.createElement('div');
    this.lottieContainer.className = 'custom-cursor__lottie';
    this.lottieContainer.style.display = 'none';
    this.container.appendChild(this.lottieContainer);

    // Create text container
    this.textContainer = document.createElement('div');
    this.textContainer.className = 'custom-cursor__text';
    Object.assign(this.textContainer.style, {
      display: 'none',
      position: 'relative',
      backgroundColor: 'var(--primary)',
      color: 'var(--primary-foreground)',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      transform: 'translate(-50%, -50%)',
      transition: 'transform 0.2s ease',
    });
    
    this.container.appendChild(this.textContainer);

    // Append to body
    document.body.appendChild(this.container);

    this.init();
  }

  private init() {
    const hasTouch = 'ontouchstart' in window;
    const mediaQuery = window.matchMedia('(min-width: 1280px)');

    // Desktop (no touch) = always enabled, Touch device = check screen size
    this.isEnabled = !hasTouch || mediaQuery.matches;

    // Handle screen size changes (only relevant for touch devices)
    if (hasTouch) {
      mediaQuery.addEventListener('change', (e) => {
        this.isEnabled = e.matches;
        if (!this.isEnabled && this.currentMode !== 'hidden') {
          this.hide();
        }
      });
    }

    // Mouse move handler using RAF for optimal performance
    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isEnabled) return;

      this.mousePos = { x: e.clientX, y: e.clientY };

      if (this.rafId) return;

      this.rafId = requestAnimationFrame(() => {
        this.updatePosition();
        this.rafId = undefined;
      });
    }, { passive: true });

    // Listen for cursor config events
    window.addEventListener('custom-cursor-show', ((e: CustomEvent<CursorConfig>) => {
      this.show(e.detail);
    }) as EventListener);

    window.addEventListener('custom-cursor-hide', () => {
      this.hide();
    });
  }

  private updatePosition() {
    if (this.currentMode === 'hidden') return;

    let x = this.mousePos.x;
    let y = this.mousePos.y;

    // Adjust position based on mode
    if (this.currentMode === 'lottie') {
      x -= this.currentSize / 2;
      y -= this.currentSize / 2;
    }

    this.container.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  private show(config: CursorConfig) {
    if (!this.isEnabled) return;

    const { mode, lottieAnimation, text, size = 70 } = config;

    // If already in this mode with same config, just ensure visibility
    if (this.currentMode === mode) {
      if (mode === 'text' && text && this.textContainer.textContent !== text) {
        this.textContainer.textContent = text;
      }
      this.container.style.opacity = '1';
      return;
    }

    // Hide current mode
    this.hideCurrentMode();

    // Show new mode
    this.currentMode = mode;
    this.currentSize = size;

    switch (mode) {
      case 'lottie':
        this.showLottie(lottieAnimation || '/animations/eyes-cursor.json', size);
        break;
      case 'text':
        this.showText(text || 'Click here');
        break;
    }

    this.container.style.opacity = '1';
    this.updatePosition();
  }

  private hide() {
    if (!this.isEnabled) return;
    this.container.style.opacity = '0';
    this.currentMode = 'hidden';
    
    // Cleanup after transition
    setTimeout(() => {
      if (this.currentMode === 'hidden') {
        this.hideCurrentMode();
      }
    }, 200);
  }

  private hideCurrentMode() {
    // Hide Lottie
    if (this.animation) {
      this.animation.destroy();
      this.animation = null;
    }
    this.lottieContainer.style.display = 'none';
    this.lottieContainer.innerHTML = '';

    // Hide text
    this.textContainer.style.display = 'none';
  }

  private showLottie(animationPath: string, size: number) {
    this.lottieContainer.style.display = 'block';
    this.lottieContainer.style.width = `${size}px`;
    this.lottieContainer.style.height = `${size}px`;

    this.animation = lottie.loadAnimation({
      container: this.lottieContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: animationPath,
    });
  }

  private showText(text: string) {
    this.textContainer.style.display = 'block';
    this.textContainer.textContent = text;
  }

  public destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.animation) {
      this.animation.destroy();
    }
    this.container.remove();
  }
}

// Initialize cursor when DOM is ready
let cursorInstance: CustomCursor | null = null;

function initCustomCursor() {
  if (cursorInstance) return;
  cursorInstance = new CustomCursor();
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomCursor);
} else {
  initCustomCursor();
}

// Re-initialize on Astro page navigation
document.addEventListener('astro:page-load', initCustomCursor);

// Export for manual control if needed
export { CustomCursor, initCustomCursor };
