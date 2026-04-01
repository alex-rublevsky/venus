import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import logoSvg from '../data/logo.svg?raw';
import logotypeSvg from '../data/logotype.svg?raw';

const MIN_DISPLAY = 100; // Minimum splash duration (prevents flash)
const MAX_WAIT = 10000; // Maximum wait time for images (prevents infinite wait)

export default function SplashLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;

    // Lock body scroll immediately
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    // iOS Safari: overflow:hidden on html/body alone doesn't prevent touch-scroll on older versions
    const preventTouchScroll = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', preventTouchScroll, { passive: false });

    const startTime = performance.now();
    const abortController = new AbortController();

    // Cleanup function
    const cleanup = () => {
      abortController.abort();
      document.removeEventListener('touchmove', preventTouchScroll);
    };

    // Wait for minimum display time
    const waitMinDisplay = () => {
      return new Promise<void>((resolve) => {
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY - elapsed);
        setTimeout(resolve, remaining);
      });
    };

    // Wait for critical images to load
    const waitForCriticalImages = () => {
      return new Promise<void>((resolve) => {
        const checkImages = () => {
          if (abortController.signal.aborted) return;

          const images = document.querySelectorAll<HTMLImageElement>('[data-splash-critical]');
          
          if (images.length === 0) {
            // No critical images found yet, poll again
            requestAnimationFrame(checkImages);
            return;
          }

          // Images found, wait for them to load
          const imagePromises = Array.from(images).map(img => {
            if (img.complete) {
              return Promise.resolve();
            }
            return new Promise<void>((resolveImg) => {
              const onLoad = () => {
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onLoad);
                resolveImg();
              };
              img.addEventListener('load', onLoad);
              img.addEventListener('error', onLoad); // Resolve on error too
            });
          });

          Promise.all(imagePromises).then(() => resolve());
        };

        requestAnimationFrame(checkImages);
      });
    };

    // Timeout promise
    const timeout = (ms: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      });
    };

    // Find visible navbar logo
    const findVisibleNavbarLogo = (): HTMLElement | null => {
      const logo = document.querySelector<HTMLElement>('[data-navbar-logo]');
      if (!logo) return null;
      
      const rect = logo.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return logo;
      }
      return null;
    };

    // Find hero logotype
    const findHeroLogotype = (): HTMLElement | null => {
      const logotype = document.querySelector<HTMLElement>('[data-hero-logotype]');
      if (!logotype) return null;
      
      const rect = logotype.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return logotype;
      }
      return null;
    };

    // Dismiss splash with View Transition
    const dismissSplash = async () => {
      await waitMinDisplay();

      // Prepare for transition (keep scroll locked)
      window.scrollTo({ top: 0, behavior: 'instant' } as ScrollToOptions);

      const navbarLogo = findVisibleNavbarLogo();
      const heroLogotype = findHeroLogotype();

      // Set up scroll unlock to fire exactly when nail finishes falling
      const nailEl = document.querySelector('.nail-sticking');
      const unlockScroll = () => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.removeEventListener('touchmove', preventTouchScroll);
      };
      if (nailEl) {
        // Safety net: always unlock after 1.5s in case animationend never fires
        // (nail-fall is 1s, so 1.5s gives enough buffer on slow/old devices)
        const safetyTimer = setTimeout(unlockScroll, 1500);
        const unlockOnNailLand = (ev: Event) => {
          if ((ev as AnimationEvent).animationName === 'nail-fall') {
            clearTimeout(safetyTimer);
            unlockScroll();
            nailEl.removeEventListener('animationend', unlockOnNailLand);
          }
        };
        nailEl.addEventListener('animationend', unlockOnNailLand);
      } else {
        // Fallback if nail element not found — match nail-fall duration
        setTimeout(unlockScroll, 1000);
      }

      // Check if View Transition API is supported
      if (!document.startViewTransition || !navbarLogo || !heroLogotype) {
        // Fallback: instant removal
        setVisible(false);
        document.documentElement.classList.add('splash-revealed');
        cleanup();
        return;
      }

      // Suppress ALL other view-transition-names (except site-logo and site-logotype)
      const suppressedVtNames: Array<{ el: HTMLElement; name: string }> = [];
      document.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
        const vtn = el.style.viewTransitionName;
        if (vtn && vtn !== 'none' && vtn !== '' && vtn !== 'site-logo' && vtn !== 'site-logotype') {
          suppressedVtNames.push({ el, name: vtn });
          el.style.viewTransitionName = 'none';
        }
      });

      // Add CSS scoping class to <html>
      document.documentElement.classList.add('splash-dismissing');

      // Add splash-revealed class to trigger entrance animations (like nail falling) BEFORE transition
      // This makes the nail start falling while the splash is transitioning out
      document.documentElement.classList.add('splash-revealed');

      try {
        const transition = document.startViewTransition(() => {
          flushSync(() => {
            // Remove splash from DOM (creates "new" snapshot without splash)
            setVisible(false);
          });
          // Assign viewTransitionName to navbar logo and hero logotype INSIDE callback
          navbarLogo.style.viewTransitionName = 'site-logo';
          heroLogotype.style.viewTransitionName = 'site-logotype';
        });

        await transition.finished;
      } catch (error) {
        // Transition failed, just hide splash
        setVisible(false);
        document.documentElement.classList.add('splash-revealed');
      } finally {
        // Cleanup after animation completes
        navbarLogo.style.viewTransitionName = '';
        heroLogotype.style.viewTransitionName = '';
        document.documentElement.classList.remove('splash-dismissing');
        
        // Restore all suppressed view-transition-names
        suppressedVtNames.forEach(({ el, name }) => {
          el.style.viewTransitionName = name;
        });
        
        // Don't call cleanup here anymore - we'll unlock scroll after nail falls
      }
    };

    // Wait for images or timeout, whichever comes first
    Promise.race([
      waitForCriticalImages(),
      timeout(MAX_WAIT)
    ]).then(() => {
      dismissSplash();
    });

    // Cleanup on unmount
    return cleanup;
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}
    >
      <div
        data-splash-logo
        className="splash-logo"
        style={{
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
          viewTransitionName: 'site-logo',
        }}
        dangerouslySetInnerHTML={{ __html: logoSvg }}
      />
      <div
        data-splash-logotype
        className="splash-logotype"
        style={{
          width: 'auto',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
          viewTransitionName: 'site-logotype',
        }}
        dangerouslySetInnerHTML={{ __html: logotypeSvg }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        .splash-logo svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .splash-logo path {
          fill: var(--primary);
        }
        .splash-logotype svg {
          height: 100%;
          width: auto;
          display: block;
        }
        .splash-logotype path {
          fill: var(--secondary);
        }
      `}</style>
    </div>
  );
}
