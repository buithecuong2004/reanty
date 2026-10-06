/**
 * Reanty - Real Estate Landing Page Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const toggleBtn = document.querySelector('.c-header__toggle');
  const nav = document.querySelector('.c-nav');
  const header = document.querySelector('.c-header');

  if (toggleBtn && nav && header) {
    function preventTouchScroll(e) {
      if (!nav.contains(e.target)) {
        e.preventDefault();
      }
    }

    function setScrollLock(locked) {
      if (locked) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.documentElement.classList.add('u-no-scroll');
        document.body.classList.add('u-no-scroll');
        document.addEventListener('touchmove', preventTouchScroll, { passive: false });
      } else {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.documentElement.classList.remove('u-no-scroll');
        document.body.classList.remove('u-no-scroll');
        document.removeEventListener('touchmove', preventTouchScroll);
      }
    }

    function openNav() {
      const headerBottom = header.getBoundingClientRect().bottom;
      nav.style.top = `${headerBottom}px`;
      nav.style.height = `calc(100vh - ${headerBottom}px)`;
      toggleBtn.classList.add('c-header__toggle--active');
      nav.classList.add('c-nav--open');
      setScrollLock(true);
    }

    let closeNav = function () {
      toggleBtn.classList.remove('c-header__toggle--active');
      nav.classList.remove('c-nav--open');
      setScrollLock(false);
    };

    toggleBtn.addEventListener('click', () => {
      if (nav.classList.contains('c-nav--open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Reset when resizing window above tablet
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && nav.classList.contains('c-nav--open')) {
        closeNav();
      }
    });
  }

  // 2. Smooth Scroll & Active Menu on Click and Scroll
  const navLinks = document.querySelectorAll('.c-nav__link[href^="#"]');
  const navItems = Array.from(navLinks).map(link => {
    const id = link.getAttribute('href').replace('#', '');
    const section = document.getElementById(id);
    return { link, id, section };
  }).filter(item => item.section !== null);

  let isClickScrolling = false;
  let activeAnimationId = null;

  function setActiveNav(targetId) {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${targetId}`) {
        link.classList.add('c-nav__link--active');
      } else {
        link.classList.remove('c-nav__link--active');
      }
    });
  }

  // Smooth scroll using requestAnimationFrame with easeInOutCubic curve
  function customSmoothScrollTo(targetPosition, duration = 750) {
    if (activeAnimationId) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
    }

    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const distance = targetPosition - startPosition;
    if (Math.abs(distance) < 2) {
      isClickScrolling = false;
      return;
    }

    isClickScrolling = true;
    let startTime = null;

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animationStep(currentTime) {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * easeProgress);

      if (timeElapsed < duration) {
        activeAnimationId = requestAnimationFrame(animationStep);
      } else {
        window.scrollTo(0, targetPosition);
        activeAnimationId = null;
        isClickScrolling = false;
        updateActiveOnScroll();
      }
    }

    activeAnimationId = requestAnimationFrame(animationStep);
  }

  // Cancel programmatic scroll if user manually touches or scrolls with mousewheel
  window.addEventListener('wheel', () => {
    if (activeAnimationId) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
      isClickScrolling = false;
    }
  }, { passive: true });

  window.addEventListener('touchmove', () => {
    if (activeAnimationId) {
      cancelAnimationFrame(activeAnimationId);
      activeAnimationId = null;
      isClickScrolling = false;
    }
  }, { passive: true });

  // Handle smooth scroll on all internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      const targetId = href.replace('#', '');
      if (!targetId || targetId === 'login' || targetId === 'signup') return;

      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      e.preventDefault();

      // Close mobile nav drawer if open
      const navEl = document.querySelector('.c-nav');
      const toggleEl = document.querySelector('.c-header__toggle');
      if (navEl && navEl.classList.contains('c-nav--open')) {
        toggleEl?.classList.remove('c-header__toggle--active');
        navEl.classList.remove('c-nav--open');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        document.documentElement.classList.remove('u-no-scroll');
        document.body.classList.remove('u-no-scroll');
      }

      // Immediately activate header menu item
      setActiveNav(targetId);

      // Compute target scroll position with sticky header offset
      const headerEl = document.querySelector('.c-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 84;
      const targetTop = targetId === 'hero'
        ? 0
        : Math.max(0, targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight + 2);

      // Update URL hash without causing a browser jump
      if (history.pushState) {
        history.pushState(null, null, `#${targetId}`);
      }

      // Run smooth scroll animation with duration between 650ms and 900ms
      const scrollDistance = Math.abs(targetTop - (window.pageYOffset || document.documentElement.scrollTop));
      const dynamicDuration = Math.min(900, Math.max(650, Math.round(scrollDistance * 0.12)));
      customSmoothScrollTo(targetTop, dynamicDuration);
    });
  });

  // Scrollspy: update active nav item as user scrolls
  function updateActiveOnScroll() {
    if (isClickScrolling) return;

    const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const headerEl = document.querySelector('.c-header');
    const headerHeight = headerEl ? headerEl.offsetHeight : 84;

    // 1. Bottom of page -> activate last section (e.g. contact)
    if (scrollPos + windowHeight >= documentHeight - 40) {
      if (navItems.length > 0) {
        setActiveNav(navItems[navItems.length - 1].id);
      }
      return;
    }

    // 2. Near top of page -> activate hero
    if (scrollPos < 80) {
      setActiveNav('hero');
      return;
    }

    // 3. Find current section in view
    // Sorted by DOM offsetTop
    const sortedSections = [...navItems].sort((a, b) => a.section.offsetTop - b.section.offsetTop);
    const triggerPoint = scrollPos + headerHeight + 50;

    let currentId = sortedSections[0]?.id || 'hero';
    for (let i = 0; i < sortedSections.length; i++) {
      const top = sortedSections[i].section.offsetTop;
      const nextTop = (i < sortedSections.length - 1)
        ? sortedSections[i + 1].section.offsetTop
        : documentHeight;

      if (triggerPoint >= top && triggerPoint < nextTop) {
        currentId = sortedSections[i].id;
        break;
      }
    }

    if (currentId) {
      setActiveNav(currentId);
    }
  }

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    // Header shadow on scroll
    if (header) {
      if (window.scrollY > 20) {
        header.classList.add('c-header--scrolled');
      } else {
        header.classList.remove('c-header--scrolled');
      }
    }

    // Scrollspy throttling
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        updateActiveOnScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // 3. Featured Property Category Tabs
  const categoryTabs = document.querySelectorAll('.c-category-tabs__item');
  const propertyCards = document.querySelectorAll('.c-property-card');

  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('c-category-tabs__item--active'));
      tab.classList.add('c-category-tabs__item--active');

      const filter = tab.getAttribute('data-filter') || 'all';
      propertyCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || filter === category) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });

  // 4. Stepped House Tabs in Hero & Today Sells
  setupHouseTabs('.c-hero__pagination');
  setupHouseTabs('.c-today-sells__pagination');

  function setupHouseTabs(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const tabs = container.querySelectorAll('.c-house-tabs__item');
    const numbers = container.querySelectorAll('.c-house-tabs__number');
    const bar = container.querySelector('.c-house-tabs__bar');
    const track = container.querySelector('.c-house-tabs__progress');

    let currentIndex = 0;

    function updateTabs(activeIndex, isInitial = false) {
      if (!isInitial && activeIndex === currentIndex) return;
      currentIndex = activeIndex;

      // 1. Animate heights and widths of blocks: active increases, others decrease
      tabs.forEach((tab, index) => {
        if (index === activeIndex) {
          tab.classList.add('c-house-tabs__item--active');
        } else {
          tab.classList.remove('c-house-tabs__item--active');
        }
      });

      // 2. Animate scale of numbers: active scales to 1, others scale to 0.5
      numbers.forEach((num, index) => {
        if (index === activeIndex) {
          num.classList.add('c-house-tabs__number--active');
        } else {
          num.classList.remove('c-house-tabs__number--active');
        }
      });

      // 3. Move horizontal progress bar to matching position
      if (bar && track) {
        const trackWidth = track.clientWidth || 68;
        const barWidth = bar.clientWidth || 24;
        const maxShift = Math.max(0, trackWidth - barWidth);
        const step = maxShift / Math.max(1, tabs.length - 1);
        const shiftX = activeIndex * step;
        bar.style.transform = `translateX(${shiftX}px)`;
      }
    }

    // Attach click handlers to both tabs and numbers
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => updateTabs(index));
    });

    numbers.forEach((num, index) => {
      num.addEventListener('click', () => updateTabs(index));
    });

    // Initialize progress bar position
    updateTabs(0, true);
  }

    // 5. Testimonial Slider & Card Swap Animation
    const testimonials = [
      {
        name: 'Yunus Seyhan',
        role: 'Postgraduate Student',
        text: 'We make sure you have a fine distance with the sickness. We make you never lose hope. We make sure you have with the sickness.',
        stars: 5
      },
      {
        name: 'Sarah Jenkins',
        role: 'Interior Architect',
        text: 'Finding an apartment through Reanty was the smoothest experience of my relocation. The support team went above and beyond to secure our dream home.',
        stars: 5
      },
      {
        name: 'Marcus Vance',
        role: 'Senior Property Investor',
        text: 'Outstanding architectural spaces and curated homes. The verified listings and seamless closing process gave me total confidence in my purchase decision.',
        stars: 5
      }
    ];

    let currentTestimonialIndex = 0;
    let isCardSwapped = false;
    let isSliderTransitioning = false;

    const contentEl = document.querySelector('.c-testimonials__content');
    const quoteEl = document.querySelector('.c-testimonials__text');
    const authorEl = document.querySelector('.c-testimonials__author');
    const roleEl = document.querySelector('.c-testimonials__role');
    const testimonialPhoto = document.getElementById('testimonialPhoto');
    const prevBtn = document.querySelector('.c-testimonials__btn--prev');
    const nextBtn = document.querySelector('.c-testimonials__btn--next');

    function updateTestimonial(index) {
      if (!quoteEl || !authorEl || !roleEl) return;
      const item = testimonials[index];
      
      // Animate text fade & slide
      if (contentEl) {
        contentEl.classList.add('is-fading');
      }

      setTimeout(() => {
        quoteEl.textContent = item.text;
        authorEl.textContent = item.name;
        roleEl.textContent = item.role;
        if (contentEl) {
          contentEl.classList.remove('is-fading');
        }
      }, 200);

      // Trigger orange and grey card shuffle swap
      if (testimonialPhoto) {
        isCardSwapped = !isCardSwapped;
        if (isCardSwapped) {
          testimonialPhoto.classList.remove('is-unswapped');
          testimonialPhoto.classList.add('is-swapped');
        } else {
          testimonialPhoto.classList.remove('is-swapped');
          testimonialPhoto.classList.add('is-unswapped');
        }
      }
    }

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        if (isSliderTransitioning) return;
        isSliderTransitioning = true;

        currentTestimonialIndex = (currentTestimonialIndex - 1 + testimonials.length) % testimonials.length;
        updateTestimonial(currentTestimonialIndex);
        prevBtn.classList.add('c-testimonials__btn--active');
        nextBtn.classList.remove('c-testimonials__btn--active');

        setTimeout(() => {
          isSliderTransitioning = false;
        }, 450);
      });

      nextBtn.addEventListener('click', () => {
        if (isSliderTransitioning) return;
        isSliderTransitioning = true;

        currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
        updateTestimonial(currentTestimonialIndex);
        nextBtn.classList.add('c-testimonials__btn--active');
        prevBtn.classList.remove('c-testimonials__btn--active');

        setTimeout(() => {
          isSliderTransitioning = false;
        }, 450);
      });
    }

    // 6. Contact Form & Newsletter Submission
    const contactForm = document.querySelector('.c-contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('.c-contact-form__submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        setTimeout(() => {
          showToast('Thank you! Your message has been sent successfully.');
          contactForm.reset();
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 900);
      });
    }

    const newsletterForms = document.querySelectorAll('.c-newsletter-form, .c-footer__newsletter, #newsletterForm, #projectsNewsletterForm');
    newsletterForms.forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        if (input && input.value.trim()) {
          showToast('Subscribed! Thank you for joining our newsletter.');
          input.value = '';
        }
      });
    });


    function showToast(message) {
      const existingToast = document.querySelector('.c-toast');
      if (existingToast) existingToast.remove();

      const toast = document.createElement('div');
      toast.className = 'c-toast';
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => toast.classList.add('c-toast--show'), 50);
      setTimeout(() => {
        toast.classList.remove('c-toast--show');
        setTimeout(() => toast.remove(), 400);
      }, 3500);
    }

    // 9. Dream Living Feature Item Selection
    const featureItems = document.querySelectorAll('.c-feature-item');
    featureItems.forEach(item => {
      item.addEventListener('click', () => {
        featureItems.forEach(i => i.classList.remove('c-feature-item--highlight'));
        item.classList.add('c-feature-item--highlight');
      });
    });

    // 10. Scroll Reveal Animations (Vanilla HTML/CSS/JS - Bi-directional: Scroll Down & Scroll Up)
    function initScrollReveal() {
      const sections = Array.from(document.querySelectorAll('section')).filter(sec => {
        return !sec.closest('.c-header') && !sec.closest('.c-footer') && !sec.closest('.c-topbar');
      });

      if (!sections.length) return;

      sections.forEach(sec => {
        // 1. Section headers & titles
        const headers = sec.querySelectorAll(
          '.c-section-header, .c-today-sells__tag, .c-today-sells__title, .c-today-sells__desc, .c-services__header, .c-featured__header, .c-testimonial-header__container, .c-projects__header, .c-blog__header, .c-contact-section__header'
        );
        headers.forEach(h => h.classList.add('reveal'));

        // 2. Grids of cards with staggered delays
        const cardGrids = [
          { selector: '.c-guides__grid .c-guide-card', delay: 0.12 },
          { selector: '.c-services__grid .c-service-card', delay: 0.1 },
          { selector: '.c-featured__grid .c-featured__card', delay: 0.1 },
          { selector: '.c-projects__grid .c-project-card', delay: 0.12 },
          { selector: '.c-blog__grid .c-blog-card', delay: 0.12 },
          { selector: '.c-dream-living__features .c-feature-item', delay: 0.12 },
          { selector: '.c-checklist .c-checklist__item', delay: 0.08 }
        ];

        cardGrids.forEach(group => {
          const items = sec.querySelectorAll(group.selector);
          items.forEach((item, idx) => {
            item.classList.add('reveal');
            item.style.setProperty('--reveal-delay', `${idx * group.delay}s`);
          });
        });

        // 3. Special layouts
        if (sec.classList.contains('c-hero')) {
          const content = sec.querySelector('.c-hero__content');
          const media = sec.querySelector('.c-hero__media');
          const pagination = sec.querySelector('.c-hero__pagination');
          if (content) content.classList.add('reveal', 'reveal--left');
          if (media) media.classList.add('reveal', 'reveal--right');
          if (pagination) {
            pagination.classList.add('reveal');
            pagination.style.setProperty('--reveal-delay', '0.2s');
          }
        }

        if (sec.classList.contains('c-dream-living')) {
          const media = sec.querySelector('.c-dream-living__media');
          const title = sec.querySelector('.c-dream-living__title');
          const desc = sec.querySelector('.c-section-header__special-desc');
          if (media) media.classList.add('reveal', 'reveal--left');
          if (title) title.classList.add('reveal');
          if (desc) {
            desc.classList.add('reveal');
            desc.style.setProperty('--reveal-delay', '0.1s');
          }
        }

        if (sec.classList.contains('c-today-sells')) {
          const content = sec.querySelector('.c-today-sells__content');
          const media = sec.querySelector('.c-today-sells__media');
          if (content) content.classList.add('reveal', 'reveal--left');
          if (media) media.classList.add('reveal', 'reveal--right');
        }

        const featuredTabs = sec.querySelector('.c-featured__tabs');
        if (featuredTabs) {
          featuredTabs.classList.add('reveal');
          featuredTabs.style.setProperty('--reveal-delay', '0.15s');
        }

        if (sec.classList.contains('c-promo-unit')) {
          const wrap = sec.querySelector('.c-promo-unit__wrap');
          if (wrap) wrap.classList.add('reveal', 'reveal--scale');
        }

        if (sec.classList.contains('c-testimonials')) {
          const wrap = sec.querySelector('.c-testimonials__wrap');
          if (wrap) wrap.classList.add('reveal', 'reveal--scale');
        }

        const newsletter = sec.querySelector('.c-projects__newsletter');
        if (newsletter) {
          newsletter.classList.add('reveal', 'reveal--scale');
          newsletter.style.setProperty('--reveal-delay', '0.2s');
        }

        if (sec.classList.contains('c-contact-section')) {
          const content = sec.querySelector('.c-contact-section__content');
          const formCard = sec.querySelector('.c-contact-form-card');
          if (content) content.classList.add('reveal', 'reveal--left');
          if (formCard) formCard.classList.add('reveal', 'reveal--right');
        }

        if (!sec.querySelector('.reveal')) {
          sec.classList.add('reveal');
        }
      });

      const allReveals = document.querySelectorAll('.reveal');

      // Enable animation mode on body
      document.body.classList.add('has-scroll-anim');

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
            } else {
              // Re-arm when element leaves viewport so scrolling back up/down animates again
              entry.target.classList.remove('is-revealed');
            }
          });
        }, {
          root: null,
          rootMargin: '0px 0px -40px 0px',
          threshold: 0.1
        });

        allReveals.forEach(el => observer.observe(el));
      } else {
        allReveals.forEach(el => el.classList.add('is-revealed'));
      }
    }

    initScrollReveal();
  });
