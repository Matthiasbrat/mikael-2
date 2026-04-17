// js/viewer3d.js — Classic script (NOT an ES module).
// Expects window.THREE to be available (loaded before this script).

window.init3DViewer = function (containerId, imageUrl, artW, artH) {
  var container = document.getElementById(containerId);
  if (!container || typeof THREE === 'undefined') return null;

  var cw = container.clientWidth;
  var ch = container.clientHeight || cw * 0.75;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0ebe3);

  var camera = new THREE.PerspectiveCamera(40, cw / ch, 0.1, 100);
  camera.position.set(0, 0, 3.2);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(cw, ch);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(3, 4, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  scene.add(dirLight);
  scene.add(new THREE.HemisphereLight(0xfff5e6, 0xd4c8b0, 0.3));

  // Group holds painting + frame — we rotate this, not the camera
  var group = new THREE.Group();
  group.rotation.y = 0.35;
  group.rotation.x = 0.1;
  scene.add(group);

  // Load painting texture — append query param to avoid CORS cache
  // collision with the same picsum URL loaded by <img> without crossOrigin
  var loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  loader.load(imageUrl, function (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;

    var ratio = artW / artH;
    var maxDim = 1.8;
    var pw = ratio >= 1 ? maxDim : maxDim * ratio;
    var ph = ratio >= 1 ? maxDim / ratio : maxDim;
    var depth = Math.max(pw, ph) * 0.04;

    // Painting: textured front, canvas-white sides, slightly darker back
    var frontMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35 });
    var sideMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.85 });
    var backMat = new THREE.MeshStandardMaterial({ color: 0xe5ddd0, roughness: 0.9 });
    var painting = new THREE.Mesh(
      new THREE.BoxGeometry(pw, ph, depth),
      [sideMat, sideMat, sideMat, sideMat, frontMat, backMat]
    );
    painting.castShadow = true;
    group.add(painting);

    // Dark frame border (slightly larger box behind)
    var border = 0.05;
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.5, metalness: 0.1 });
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(pw + border * 2, ph + border * 2, depth + 0.02),
      frameMat
    );
    frame.position.z = -0.005;
    frame.castShadow = true;
    group.add(frame);
  }, undefined, function (err) {
    console.error('Three.js texture load failed:', err);
    container.innerHTML = '<p style="color:var(--text);text-align:center;padding:3rem;">Impossible de charger la texture.</p>';
  });

  // Wall behind (catches shadows)
  var wallMat = new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 1 });
  var wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), wallMat);
  wall.position.z = -0.6;
  wall.receiveShadow = true;
  scene.add(wall);

  // Pointer controls — rotate the GROUP (intuitive: drag right → painting turns right)
  var canvas = renderer.domElement;
  canvas.style.touchAction = 'none';
  var isDragging = false, prevX = 0, prevY = 0;

  canvas.addEventListener('pointerdown', function (e) {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!isDragging) return;
    group.rotation.y += (e.clientX - prevX) * 0.008;
    group.rotation.x -= (e.clientY - prevY) * 0.006;
    group.rotation.x = Math.max(-0.7, Math.min(0.7, group.rotation.x));
    prevX = e.clientX;
    prevY = e.clientY;
  });
  canvas.addEventListener('pointerup', function (e) {
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });

  // Scroll zoom
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    camera.position.z = Math.max(1.5, Math.min(5, camera.position.z + e.deltaY * 0.003));
    camera.lookAt(0, 0, 0);
  }, { passive: false });

  // Pinch zoom
  var lastPinchDist = 0;
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      camera.position.z = Math.max(1.5, Math.min(5, camera.position.z - (dist - lastPinchDist) * 0.008));
      lastPinchDist = dist;
      camera.lookAt(0, 0, 0);
    }
  }, { passive: true });

  // Render loop
  var animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  // Resize
  var ro = new ResizeObserver(function () {
    var w = container.clientWidth;
    var h = container.clientHeight || w * 0.75;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);

  return function dispose() {
    cancelAnimationFrame(animId);
    ro.disconnect();
    renderer.dispose();
    container.innerHTML = '';
  };
};
