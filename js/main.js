document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    direction: "vertical",
    gestureDirection: "vertical",
    smoothTouch: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // 2. Initialize Tiger Engine
  const tiger = new TigerExperience();

  // 3. Setup GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Sync Lenis with GSAP ScrollTrigger
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0, 0);

  // Respect reduced motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 4. Create Scrollytelling Timeline
  const sequenceTrigger = document.querySelector("#tiger-engine");

  if (sequenceTrigger && tiger.frameCount > 0 && !prefersReduced) {
    gsap.to(tiger.currentFrame, {
      value: tiger.frameCount,
      snap: "value", // Ensure we land on whole frame numbers
      ease: "none",
      scrollTrigger: {
        trigger: sequenceTrigger,
        start: "top top",
        end: "bottom bottom", // Scrubs over the 800vh distance
        scrub: 0.5, // Slight smoothing
        onUpdate: (self) => {
          // Update canvas frame based on currentFrame.value
          tiger.updateFrame(tiger.currentFrame.value);
        },
      },
    });
  }

  // 5. Carousel Navigation
  const track = document.querySelector(".carousel-track");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  if (track && prevBtn && nextBtn) {
    const scrollAmount = 300 + 24; // Card width (300) + gap (1.5rem ~ 24px)

    prevBtn.addEventListener("click", () => {
      track.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });

    nextBtn.addEventListener("click", () => {
      track.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  }

  // 6. Carousel Drag-to-Scroll
  if (track) {
    let isDown = false, startX, scrollLeft;

    track.addEventListener('pointerdown', (e) => {
      isDown = true;
      track.setPointerCapture(e.pointerId);
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
      track.style.cursor = 'grabbing';
    });

    const endDrag = () => {
      isDown = false;
      track.style.cursor = 'grab';
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointerleave', endDrag);
    track.addEventListener('pointercancel', endDrag);

    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const x = e.pageX - track.offsetLeft;
      const walk = x - startX;
      if (Math.abs(walk) < 5) return; // Dead zone to allow clicks
      e.preventDefault();
      track.scrollLeft = scrollLeft - walk * 1.5;
    });

    track.style.cursor = 'grab';
    track.style.userSelect = 'none';
  }

  // 7. Scroll-Triggered Section Reveals (post-hero)
  if (!prefersReduced) {
    gsap.utils.toArray('#post-hero section').forEach((section) => {
      const heading = section.querySelector('h2');
      const content = section.querySelectorAll('p, .btn, .carousel-card, .grid-item, .card-info');

      if (heading) {
        gsap.from(heading, {
          y: 80,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      }

      if (content.length) {
        gsap.from(content, {
          y: 60,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    });

    // 8. Parallax on Cinematic Banner
    const bannerImg = document.querySelector('.banner-image');
    if (bannerImg) {
      gsap.to(bannerImg, {
        backgroundPositionY: '30%',
        ease: 'none',
        scrollTrigger: {
          trigger: bannerImg,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    // 9. Hero Text Scroll Animations
    const heroText1 = document.getElementById('hero-text-1');
    const heroText2 = document.getElementById('hero-text-2');

    if (heroText1 && sequenceTrigger) {
      gsap.timeline({
        scrollTrigger: {
          trigger: sequenceTrigger,
          start: 'top top',
          end: '20% top',
          scrub: true,
        },
      })
      .fromTo(heroText1, { opacity: 0, y: 50 }, { opacity: 1, y: 0 })
      .to(heroText1, { opacity: 0, y: -50 }, '+=0.3');
    }

    if (heroText2 && sequenceTrigger) {
      gsap.timeline({
        scrollTrigger: {
          trigger: sequenceTrigger,
          start: '35% top',
          end: '55% top',
          scrub: true,
        },
      })
      .fromTo(heroText2, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 })
      .to(heroText2, { opacity: 0, scale: 1.1 }, '+=0.3');
    }
  }
});
