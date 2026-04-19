// js/viewer3d.js — Minimal 3D painting viewer. Expects window.THREE.

window.init3DViewer = function (containerId, imageUrl, artW, artH) {
  var container = document.getElementById(containerId);
  if (!container || !window.THREE) return null;

  var w = container.clientWidth;
  var h = container.clientHeight || w * 0.75;

  // Clear loading text before inserting the canvas
  container.innerHTML = '';

  var scene = new THREE.Scene();

  // Living room wall background — warm gradient via a canvas
  var bgCvs = document.createElement('canvas');
  bgCvs.width = 512;
  bgCvs.height = 512;
  var bgCtx = bgCvs.getContext('2d');
  // Wall
  var wallGrad = bgCtx.createLinearGradient(0, 0, 0, 400);
  wallGrad.addColorStop(0, '#f0e8da');
  wallGrad.addColorStop(1, '#e2d5c0');
  bgCtx.fillStyle = wallGrad;
  bgCtx.fillRect(0, 0, 512, 400);
  // Baseboard
  bgCtx.fillStyle = '#d8cbb4';
  bgCtx.fillRect(0, 395, 512, 8);
  // Floor
  var floorGrad = bgCtx.createLinearGradient(0, 400, 0, 512);
  floorGrad.addColorStop(0, '#b8a68a');
  floorGrad.addColorStop(1, '#8c7a5e');
  bgCtx.fillStyle = floorGrad;
  bgCtx.fillRect(0, 403, 512, 109);
  // Subtle wall panel lines
  bgCtx.strokeStyle = 'rgba(0,0,0,0.04)';
  bgCtx.lineWidth = 1;
  [128, 256, 384].forEach(function (x) {
    bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, 395); bgCtx.stroke();
  });
  scene.background = new THREE.CanvasTexture(bgCvs);

  var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 0, 2.5);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Build a canvas texture — draw the page image if possible,
  // otherwise show a visible gradient fallback (never black).
  var cvs = document.createElement('canvas');
  cvs.width = 512;
  cvs.height = Math.round(512 * (artH / artW)) || 512;
  var ctx = cvs.getContext('2d');
  var imageOk = false;

  var pageImg = document.querySelector('.main-image img');
  if (pageImg && pageImg.complete && pageImg.naturalWidth > 0) {
    ctx.drawImage(pageImg, 0, 0, cvs.width, cvs.height);
    try {
      ctx.getImageData(0, 0, 1, 1);
      imageOk = true;
    } catch (e) {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
    }
  }

  if (!imageOk) {
    var grad = ctx.createLinearGradient(0, 0, cvs.width, cvs.height);
    grad.addColorStop(0, '#c09060');
    grad.addColorStop(1, '#806040');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Aperçu 3D', cvs.width / 2, cvs.height / 2 + 10);
  }

  var texture = new THREE.CanvasTexture(cvs);

  // Box with texture on ALL faces — single material, no array
  var ratio = artW / artH;
  var pw = ratio >= 1 ? 1.5 : 1.5 * ratio;
  var ph = ratio >= 1 ? 1.5 / ratio : 1.5;
  var mesh = new THREE.Mesh(
    new THREE.BoxGeometry(pw, ph, 0.08),
    new THREE.MeshBasicMaterial({ map: texture })
  );
  mesh.rotation.y = 0.4;
  scene.add(mesh);

  // Auto-rotate until user interacts
  var autoRotate = true;

  // Drag — only with exactly 1 finger (2+ fingers = pinch zoom, no rotation)
  var canvas = renderer.domElement;
  canvas.style.touchAction = 'none';
  var dragging = false, px = 0, py = 0, pointerCount = 0;

  canvas.addEventListener('pointerdown', function (e) {
    pointerCount++;
    autoRotate = false;
    if (pointerCount === 1) {
      dragging = true;
      px = e.clientX;
      py = e.clientY;
    } else {
      dragging = false;
    }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging || pointerCount !== 1) return;
    mesh.rotation.y += (e.clientX - px) * 0.01;
    mesh.rotation.x += (e.clientY - py) * 0.01;
    mesh.rotation.x = Math.max(-1, Math.min(1, mesh.rotation.x));
    px = e.clientX;
    py = e.clientY;
  });
  canvas.addEventListener('pointerup', function (e) {
    pointerCount = Math.max(0, pointerCount - 1);
    if (pointerCount === 0) dragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointercancel', function (e) {
    pointerCount = Math.max(0, pointerCount - 1);
    if (pointerCount === 0) dragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });

  // Zoom
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    camera.position.z = Math.max(1, Math.min(5, camera.position.z + e.deltaY * 0.005));
  }, { passive: false });

  // Pinch zoom
  var pinchDist = 0;
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      var d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      camera.position.z = Math.max(1, Math.min(5, camera.position.z - (d - pinchDist) * 0.01));
      pinchDist = d;
    }
  }, { passive: true });

  // Render
  var animId;
  (function loop() {
    animId = requestAnimationFrame(loop);
    if (autoRotate) mesh.rotation.y += 0.005;
    renderer.render(scene, camera);
  })();

  // Resize
  var ro = new ResizeObserver(function () {
    var nw = container.clientWidth;
    var nh = container.clientHeight || nw * 0.75;
    renderer.setSize(nw, nh);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);

  return function () {
    cancelAnimationFrame(animId);
    ro.disconnect();
    renderer.dispose();
    container.innerHTML = '';
  };
};
