class TigerExperience {
  constructor() {
    this.foregroundCanvas = document.getElementById("tiger-canvas");

    if (!this.foregroundCanvas) return;

    this.ctxFg = this.foregroundCanvas.getContext("2d", { alpha: false });

    // Define sequence properties
    this.frameCount = 217;
    this.images = [];
    this.currentFrame = { value: 1 };
    this.lastRenderedIndex = -1;

    // Target resolution of the assets
    this.baseWidth = 1920;
    this.baseHeight = 1080;

    // Retina / High-DPI canvas support (capped at 2x for performance)
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.foregroundCanvas.width = this.baseWidth * this.dpr;
    this.foregroundCanvas.height = this.baseHeight * this.dpr;
    this.ctxFg.scale(this.dpr, this.dpr);

    this.frameExt = 'jpg'; // Auto-detected in init()
    this.loadedCount = 0;

    // ── Preloader Config ──
    this.preloaderVideoSrc = 'assets/preloader-leopard-1.mp4';
    this.loadingOverlay = this.createLoadingOverlay();

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

  createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'tiger-loader';
    overlay.classList.add('tiger-loader');

    // Pick a random preloader video
    const videoSrc = this.preloaderVideoSrc;

    // Video element
    const video = document.createElement('video');
    video.id = 'loader-video';
    video.src = videoSrc;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute('playsinline', '');
    video.classList.add('loader-video');

    // Detect portrait vs landscape once metadata loads
    video.addEventListener('loadedmetadata', () => {
      if (video.videoHeight > video.videoWidth) {
        // Portrait video — add class so CSS can handle it
        video.classList.add('portrait');
      }
    });

    // Try to play (some browsers block autoplay)
    video.play().catch(() => {});

    // Bottom bar container (progress + percentage)
    const bottomBar = document.createElement('div');
    bottomBar.classList.add('loader-bottom');

    const track = document.createElement('div');
    track.classList.add('loader-bar-track');

    const fill = document.createElement('div');
    fill.id = 'loader-fill';
    fill.classList.add('loader-bar-fill');

    const text = document.createElement('span');
    text.id = 'loader-text';
    text.classList.add('loader-text');
    text.textContent = '0%';

    track.appendChild(fill);
    bottomBar.appendChild(track);
    bottomBar.appendChild(text);

    overlay.appendChild(video);
    overlay.appendChild(bottomBar);
    document.body.appendChild(overlay);
    return overlay;
  }

  updateLoadingProgress() {
    const pct = Math.round((this.loadedCount / this.frameCount) * 100);
    const fill = document.getElementById('loader-fill');
    const text = document.getElementById('loader-text');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${pct}%`;
  }

  hideLoader() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
          this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
      }, 600);
    }
  }

  detectFrameFormat() {
    return new Promise((resolve) => {
      const testImg = new Image();
      testImg.onload = () => resolve('webp');
      testImg.onerror = () => resolve('jpg');
      testImg.src = 'assets/frames/ezgif-frame-001.webp';
    });
  }

  async init() {
    // Auto-detect WebP frames (falls back to JPG if not available)
    this.frameExt = await this.detectFrameFormat();

    this.preloadImages()
      .then(() => {
        console.log(`All Tiger frames loaded (${this.frameExt}).`);
        this.hideLoader();
        this.render(1);
      })
      .catch((err) => {
        console.warn(
          "Tiger frames not found. They might not be generated/downloaded yet.",
          err,
        );
        this.hideLoader();
        this.drawFallback();
      });
  }

  preloadImages() {
    return new Promise((resolve, reject) => {
      let errorCount = 0;
      for (let i = 1; i <= this.frameCount; i++) {
        const img = new Image();

        const frameString = i.toString().padStart(3, "0");
        img.src = `assets/frames/ezgif-frame-${frameString}.${this.frameExt}`;

        img.onload = () => {
          this.loadedCount++;
          this.updateLoadingProgress();
          if (this.loadedCount === this.frameCount) {
            resolve();
          }
        };

        img.onerror = () => {
          errorCount++;
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
    const safeIndex = Math.min(Math.max(1, Math.round(index)), this.frameCount);
    if (safeIndex === this.lastRenderedIndex) return;

    const img = this.images[safeIndex - 1];

    if (img && img.complete && img.naturalHeight > 0) {
      // Crossfade for smooth motion when scrolling slowly (1-2 frame jumps)
      const frameDelta = Math.abs(safeIndex - this.lastRenderedIndex);

      if (frameDelta <= 2 && this.lastRenderedIndex > 0) {
        // Draw new frame over existing with slight transparency for motion blur
        this.ctxFg.globalAlpha = 0.85;
        this.ctxFg.drawImage(img, 0, 0, this.baseWidth, this.baseHeight);
        this.ctxFg.globalAlpha = 1.0;
      } else {
        // Clean draw for large jumps
        this.ctxFg.clearRect(0, 0, this.baseWidth, this.baseHeight);
        this.ctxFg.drawImage(img, 0, 0, this.baseWidth, this.baseHeight);
      }

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
