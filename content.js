let blurOverlay = null;
let isMoving = false;
let isResizing = false;
let initialMouseX = 0;
let initialMouseY = 0;
let initialOverlayX = 0;
let initialOverlayY = 0;
let startWidth = 0;
let startHeight = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleBlur") {
    if (blurOverlay) {
      removeBlurOverlay();
    } else {
      createBlurOverlay();
    }
  }
});

function createBlurOverlay() {
  const youtubeContainer =
    document.querySelector(".ytp-chrome-bottom")?.parentElement;
  const twitchContainer = document.querySelector(".video-player__container");
  const videoContainer = youtubeContainer || twitchContainer;

  if (!videoContainer) return;

  blurOverlay = document.createElement("div");
  blurOverlay.className = "blur-overlay";

  const inner = document.createElement("div");
  inner.className = "blur-overlay-inner";
  blurOverlay.appendChild(inner);

  const handle = document.createElement("div");
  handle.className = "resize-handle";
  blurOverlay.appendChild(handle);

  const containerRect = videoContainer.getBoundingClientRect();
  blurOverlay.style.width = "150px";
  blurOverlay.style.height = "150px";
  blurOverlay.style.left = `${containerRect.width / 2 - 75}px`;
  blurOverlay.style.top = `${containerRect.height / 2 - 75}px`;

  inner.addEventListener("mousedown", startMove);
  handle.addEventListener("mousedown", startResize);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", stopAction);

  videoContainer.appendChild(blurOverlay);
}

function removeBlurOverlay() {
  if (blurOverlay) {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopAction);
    blurOverlay.remove();
    blurOverlay = null;
  }
}

function startMove(e) {
  if (e.target.classList.contains("resize-handle")) return;

  isMoving = true;
  const rect = blurOverlay.getBoundingClientRect();

  initialMouseX = e.clientX;
  initialMouseY = e.clientY;
  initialOverlayX = rect.left;
  initialOverlayY = rect.top;

  e.preventDefault();
}

function startResize(e) {
  isResizing = true;
  startWidth = parseFloat(blurOverlay.style.width);
  startHeight = parseFloat(blurOverlay.style.height);
  initialMouseX = e.clientX;
  initialMouseY = e.clientY;
  e.preventDefault();
}

function handleMouseMove(e) {
  if (!isMoving && !isResizing) return;

  const containerRect = blurOverlay.parentElement.getBoundingClientRect();

  if (isMoving) {
    const deltaX = e.clientX - initialMouseX;
    const deltaY = e.clientY - initialMouseY;

    let newLeft = initialOverlayX - containerRect.left + deltaX;
    let newTop = initialOverlayY - containerRect.top + deltaY;

    // Constrain to container bounds
    newLeft = Math.max(
      0,
      Math.min(newLeft, containerRect.width - blurOverlay.offsetWidth)
    );
    newTop = Math.max(
      0,
      Math.min(newTop, containerRect.height - blurOverlay.offsetHeight)
    );

    blurOverlay.style.left = `${newLeft}px`;
    blurOverlay.style.top = `${newTop}px`;
  }

  if (isResizing) {
    const deltaX = e.clientX - initialMouseX;
    const deltaY = e.clientY - initialMouseY;

    let newWidth = Math.max(50, startWidth + deltaX);
    let newHeight = Math.max(50, startHeight + deltaY);

    // Constrain to container bounds
    newWidth = Math.min(
      newWidth,
      containerRect.width - parseFloat(blurOverlay.style.left)
    );
    newHeight = Math.min(
      newHeight,
      containerRect.height - parseFloat(blurOverlay.style.top)
    );

    blurOverlay.style.width = `${newWidth}px`;
    blurOverlay.style.height = `${newHeight}px`;
  }
}

function stopAction() {
  isMoving = false;
  isResizing = false;
}
