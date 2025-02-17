let blurOverlay = null;
let isMoving = false;
let isResizing = false;
let activeHandle = null;
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
  const youtubeContainer = document.querySelector(".ytp-chrome-bottom")?.parentElement;
  const twitchContainer = document.querySelector(".video-player__container");
  const videoContainer = youtubeContainer || twitchContainer;

  if (!videoContainer) return;

  blurOverlay = document.createElement("div");
  blurOverlay.className = "blur-overlay";

  const inner = document.createElement("div");
  inner.className = "blur-overlay-inner";
  blurOverlay.appendChild(inner);

  // Create resize handles for all corners
  const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  corners.forEach(corner => {
    const handle = document.createElement("div");
    handle.className = `resize-handle ${corner}`;
    handle.dataset.corner = corner;
    blurOverlay.appendChild(handle);
  });

  const containerRect = videoContainer.getBoundingClientRect();
  blurOverlay.style.width = "300px";
  blurOverlay.style.height = `${containerRect.height}px`;
  blurOverlay.style.left = `${containerRect.width / 2 - 150}px`;
  blurOverlay.style.top = "0px";

  inner.addEventListener("mousedown", startMove);
  blurOverlay.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener("mousedown", (e) => startResize(e, handle.dataset.corner));
  });
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

function startResize(e, corner) {
  isResizing = true;
  activeHandle = corner;
  const rect = blurOverlay.getBoundingClientRect();
  startWidth = rect.width;
  startHeight = rect.height;
  initialMouseX = e.clientX;
  initialMouseY = e.clientY;
  initialOverlayX = rect.left;
  initialOverlayY = rect.top;
  e.preventDefault();
}

function handleMouseMove(e) {
  if (!isMoving && !isResizing) return;

  const containerRect = blurOverlay.parentElement.getBoundingClientRect();

  if (isMoving) {
    handleMove(e, containerRect);
  }

  if (isResizing) {
    handleResize(e, containerRect);
  }
}

function handleMove(e, containerRect) {
  const deltaX = e.clientX - initialMouseX;
  const deltaY = e.clientY - initialMouseY;

  let newLeft = initialOverlayX - containerRect.left + deltaX;
  let newTop = initialOverlayY - containerRect.top + deltaY;

  // Constrain to container bounds
  newLeft = Math.max(0, Math.min(newLeft, containerRect.width - blurOverlay.offsetWidth));
  newTop = Math.max(0, Math.min(newTop, containerRect.height - blurOverlay.offsetHeight));

  blurOverlay.style.left = `${newLeft}px`;
  blurOverlay.style.top = `${newTop}px`;
}

function handleResize(e, containerRect) {
  const deltaX = e.clientX - initialMouseX;
  const deltaY = e.clientY - initialMouseY;
  const minSize = 50;

  let newWidth = startWidth;
  let newHeight = startHeight;
  let newLeft = initialOverlayX - containerRect.left;
  let newTop = initialOverlayY - containerRect.top;

  // Handle different corners
  switch (activeHandle) {
    case 'top-left':
      newWidth = Math.max(minSize, startWidth - deltaX);
      newHeight = Math.max(minSize, startHeight - deltaY);
      newLeft += startWidth - newWidth;
      newTop += startHeight - newHeight;
      break;
    case 'top-right':
      newWidth = Math.max(minSize, startWidth + deltaX);
      newHeight = Math.max(minSize, startHeight - deltaY);
      newTop += startHeight - newHeight;
      break;
    case 'bottom-left':
      newWidth = Math.max(minSize, startWidth - deltaX);
      newHeight = Math.max(minSize, startHeight + deltaY);
      newLeft += startWidth - newWidth;
      break;
    case 'bottom-right':
      newWidth = Math.max(minSize, startWidth + deltaX);
      newHeight = Math.max(minSize, startHeight + deltaY);
      break;
  }

  // Constrain to container bounds
  newLeft = Math.max(0, Math.min(newLeft, containerRect.width - minSize));
  newTop = Math.max(0, Math.min(newTop, containerRect.height - minSize));
  newWidth = Math.min(newWidth, containerRect.width - newLeft);
  newHeight = Math.min(newHeight, containerRect.height - newTop);

  // Apply new dimensions and position
  blurOverlay.style.width = `${newWidth}px`;
  blurOverlay.style.height = `${newHeight}px`;
  blurOverlay.style.left = `${newLeft}px`;
  blurOverlay.style.top = `${newTop}px`;
}

function stopAction() {
  isMoving = false;
  isResizing = false;
  activeHandle = null;
}