/**
 * Centralized navigation controller
 * Manages active states, scroll sync, and visibility for all navigation instances
 */

export function initNavigationController() {
  const allNavLinks = document.querySelectorAll('[data-nav-link]');
  const sections = new Map<Element, Element>();
  
  let isScrolling = false;
  let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  let updateTimeout: ReturnType<typeof setTimeout> | undefined;
  let currentActiveHref: string | null = null;

  // Build map of links to sections
  allNavLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      const section = document.querySelector(href);
      if (section) {
        sections.set(link, section);
      }
    }
  });

  // Update active link across all nav instances
  function setActiveLink(href: string | null) {
    if (currentActiveHref === href) return;
    
    allNavLinks.forEach((link) => {
      const linkHref = link.getAttribute("href");
      if (linkHref === href) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
    
    currentActiveHref = href;
  }

  // Find which section should be active based on scroll position
  function updateActiveSection() {
    if (isScrolling) return;

    const triggerPoint = window.innerHeight * 0.4;
    let bestSection: Element | null = null;
    let bestDistance = Infinity;
    let bestHref: string | null = null;

    sections.forEach((section, link) => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionBottom = rect.bottom;
      
      if (sectionBottom < 0 || sectionTop > window.innerHeight) return;
      
      let distance;
      if (sectionTop <= triggerPoint && sectionBottom >= triggerPoint) {
        distance = 0;
      } else if (sectionTop > triggerPoint) {
        distance = sectionTop - triggerPoint;
      } else {
        distance = triggerPoint - sectionBottom;
      }
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSection = section;
        bestHref = link.getAttribute("href");
      }
    });

    if (bestHref) {
      setActiveLink(bestHref);
    }
  }

  // Intersection Observer for efficient scroll detection
  const intersectionObserver = new IntersectionObserver(() => {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(updateActiveSection, 100);
  }, {
    root: null,
    threshold: [0, 1]
  });

  sections.forEach((section) => intersectionObserver.observe(section));
  updateActiveSection();

  // Handle link clicks
  allNavLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      isScrolling = true;
      
      const href = link.getAttribute("href");
      if (href) {
        setActiveLink(href);
        
        if (href.startsWith("#")) {
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: "smooth" });
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              isScrolling = false;
              updateActiveSection();
            }, 1000);
          }
        }
      }
    });
  });

  // Hide navigation bars when wood deck section enters viewport
  initWoodDeckVisibility();
}

function initWoodDeckVisibility() {
  const topBar = document.querySelector('[data-top-bar]') as HTMLElement;
  const bottomBar = document.querySelector('[data-bottom-bar]') as HTMLElement;
  const woodDeck = document.querySelector('#wood-deck');
  
  if (!woodDeck) return;

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const rect = entry.boundingClientRect;
        const shouldHide = entry.isIntersecting || rect.top < 0;
        
        [topBar, bottomBar].forEach(bar => {
          if (bar) {
            bar.style.opacity = shouldHide ? '0' : '1';
            bar.style.pointerEvents = shouldHide ? 'none' : 'auto';
          }
        });
      });
    },
    {
      rootMargin: '0px 0px -50% 0px',
    }
  );
  
  visibilityObserver.observe(woodDeck);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigationController);
} else {
  initNavigationController();
}
