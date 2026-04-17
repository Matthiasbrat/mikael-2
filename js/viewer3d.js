// js/viewer3d.js — Classic script (NOT an ES module).
// Expects window.THREE to be available (loaded before this script).
// Exposes window.init3DViewer.

window.init3DViewer = function (containerId, imageUrl, artW, artH) {
  var container = document.getElementById(containerId);
  if (!container || typeof THREE === 'undefined') return null;

  var cw = container.clientWidth;
  var ch = container.clientHeight || cw * 0.75;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0ebe3);

  var camera = new THREE.PerspectiveCamera(40, cw / ch, 0.1, 100);
  var theta = 0.4, phi = 1.25, radius = 2.8;
  function updateCamera() {
    camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
    camera.position.y = radius * Math.cos(phi);
    camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
    camera.lookAt(0, 0, 0);
  }
  updateCamera();

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(cw, ch);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(3, 4, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  scene.add(dirLight);
  scene.add(new THREE.HemisphereLight(0xfff5e6, 0xd4c8b0, 0.3));

  // Load painting texture
  var loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';
  loader.load(imageUrl, function (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;

    var ratio = artW / artH;
    var maxDim = 1.8;
    var pw = ratio >= 1 ? maxDim : maxDim * ratio;
    var ph = ratio >= 1 ? maxDim / ratio : maxDim;
    var depth = Math.max(pw, ph) * 0.04;

    var frontMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35 });
    var sideMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.85 });
    var backMat = new THREE.MeshStandardMaterial({ color: 0xe5ddd0, roughness: 0.9 });
    var painting = new THREE.Mesh(
      new THREE.BoxGeometry(pw, ph, depth),
      [sideMat, sideMat, sideMat, sideMat, frontMat, backMat]
    );
    painting.castShadow = true;

    var border = 0.05;
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.5, metalness: 0.1 });
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(pw + border * 2, ph + border * 2, depth + 0.02),
      frameMat
    );
    frame.position.z = -0.005;
    frame.castShadow = true;

    scene.add(frame);
    scene.add(painting);

    var wallMat = new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 1 });
    var wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), wallMat);
    wall.position.z = -(depth / 2 + 0.35);
    wall.receiveShadow = true;
    scene.add(wall);
  });

  // Manual pointer controls (orbit around the painting)
  var canvas = renderer.domElement;
  var isDragging = false, prevX = 0, prevY = 0;
  canvas.style.touchAction = 'none';

  canvas.addEventListener('pointerdown', function (e) {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!isDragging) return;
    theta -= (e.clientX - prevX) * 0.008;
    phi = Math.max(0.3, Math.min(2.6, phi + (e.clientY - prevY) * 0.008));
    prevX = e.clientX;
    prevY = e.clientY;
    updateCamera();
  });
  canvas.addEventListener('pointerup', function (e) {
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    radius = Math.max(1.2, Math.min(5, radius + e.deltaY * 0.003));
    updateCamera();
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
      radius = Math.max(1.2, Math.min(5, radius - (dist - lastPinchDist) * 0.008));
      lastPinchDist = dist;
      updateCamera();
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
