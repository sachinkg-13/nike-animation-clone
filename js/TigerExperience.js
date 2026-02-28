class TigerExperience {
  constructor() {
    this.foregroundCanvas = document.getElementById("tiger-canvas");

    if (!this.foregroundCanvas) return;

    this.ctxFg = this.foregroundCanvas.getContext("2d", { alpha: false });

    // Define sequence properties
    this.frameCount = 217; // Updated from 242 based on available assets
    this.images = [];
    this.currentFrame = { value: 1 };
    this.lastRenderedIndex = -1;

    // Target resolution of the assets
    this.baseWidth = 1920;
    this.baseHeight = 1080;

    // Setup internal canvas resolution
    // CSS object-fit will handle the display layout (contain vs cover)
    this.foregroundCanvas.width = this.baseWidth;
    this.foregroundCanvas.height = this.baseHeight;

    this.loadedCount = 0;
    this.init();

    // Add Resize Listener
    this.resizeTimeout = null;
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  handleResize() {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      // Re-trigger render to ensure crispness on resize
      this.render(this.currentFrame.value);
    }, 150); // Debounce duration
  }

  init() {
    this.preloadImages()
      .then(() => {
        console.log("All Tiger frames loaded.");
        // Draw first frame immediately
        this.render(1);
      })
      .catch((err) => {
        console.warn(
          "Tiger frames not found. They might not be generated/downloaded yet.",
          err,
        );
        // Draw a fallback frame so we know the canvas is working
        this.drawFallback();
      });
  }

  preloadImages() {
    return new Promise((resolve, reject) => {
      let errorCount = 0;
      for (let i = 1; i <= this.frameCount; i++) {
        const img = new Image();

        // Format: ezgif-frame-001.jpg
        const frameString = i.toString().padStart(3, "0");
        img.src = `assets/frames/ezgif-frame-${frameString}.jpg`;

        img.onload = () => {
          this.loadedCount++;
          if (this.loadedCount === this.frameCount) {
            resolve();
          }
        };

        img.onerror = () => {
          errorCount++;
          // If we fail loading a few, assume the sequence doesn't exist
          if (errorCount > 5 && this.loadedCount === 0) {
            reject("Assets missing. Create sequence in assets/frames/");
          }
        };

        this.images.push(img);
      }
    });
  }

  drawFallback() {
    this.ctxFg.fillStyle = "#111";
    this.ctxFg.fillRect(0, 0, this.baseWidth, this.baseHeight);
    this.ctxFg.fillStyle = "#fff";
    this.ctxFg.font = "50px sans-serif";
    this.ctxFg.textAlign = "center";
    this.ctxFg.fillText(
      "FRAME NOT FOUND",
      this.baseWidth / 2,
      this.baseHeight / 2,
    );
  }

  render(index) {
    // Ensure index is within bounds
    const safeIndex = Math.min(Math.max(1, Math.round(index)), this.frameCount);

    // Optimization: Don't redraw if it's the exact same frame
    if (safeIndex === this.lastRenderedIndex) return;

    const img = this.images[safeIndex - 1];

    if (img && img.complete && img.naturalHeight > 0) {
      this.ctxFg.clearRect(0, 0, this.baseWidth, this.baseHeight);

      // Draw to Foreground
      this.ctxFg.drawImage(img, 0, 0, this.baseWidth, this.baseHeight);

      this.lastRenderedIndex = safeIndex;
    }
  }

  // Called by GSAP ScrollTrigger
  updateFrame(newFrameIndex) {
    // Use requestAnimationFrame to sync drawing with the display refresh rate
    requestAnimationFrame(() => {
      this.render(Math.round(newFrameIndex));
    });
  }
}

window.TigerExperience = TigerExperience;
