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

  // 4. Create Scrollytelling Timeline
  const sequenceTrigger = document.querySelector("#tiger-engine");

  if (sequenceTrigger && tiger.frameCount > 0) {
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
});
