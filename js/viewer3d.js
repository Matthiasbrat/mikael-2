// js/viewer3d.js — Classic script. Expects window.THREE (UMD r159).

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
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(3, 4, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  scene.add(dirLight);

  var group = new THREE.Group();
  group.rotation.set(0, 0.3, 0);
  scene.add(group);

  var wall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 1 })
  );
  wall.position.z = -0.6;
  wall.receiveShadow = true;
  scene.add(wall);

  function buildPainting(texture) {
    var ratio = artW / artH;
    var maxDim = 1.8;
    var pw = ratio >= 1 ? maxDim : maxDim * ratio;
    var ph = ratio >= 1 ? maxDim / ratio : maxDim;
    var depth = Math.max(pw, ph) * 0.04;

    var frontMat = new THREE.MeshStandardMaterial({ map: texture });
    var sideMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6 });
    var backMat = new THREE.MeshStandardMaterial({ color: 0xe5ddd0 });
    var painting = new THREE.Mesh(
      new THREE.BoxGeometry(pw, ph, depth),
      [sideMat, sideMat, sideMat, sideMat, frontMat, backMat]
    );
    painting.castShadow = true;
    group.add(painting);

    var border = 0.05;
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(pw + border * 2, ph + border * 2, depth + 0.02),
      new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.5, metalness: 0.1 })
    );
    frame.position.z = -0.005;
    frame.castShadow = true;
    group.add(frame);
  }

  // Strategy: fetch image as blob → create blob URL (same-origin) →
  // load via Three.js TextureLoader (handles all GPU upload internals).
  // This avoids ALL CORS/cache issues because blob URLs are same-origin.
  fetch(imageUrl, { mode: 'cors' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    })
    .then(function (blob) {
      var blobUrl = URL.createObjectURL(blob);
      var texLoader = new THREE.TextureLoader();
      texLoader.load(
        blobUrl,
        function (texture) {
          buildPainting(texture);
          setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 2000);
        },
        undefined,
        function () {
          container.innerHTML = '<p style="text-align:center;padding:3rem;color:var(--text);">Erreur de texture.</p>';
        }
      );
    })
    .catch(function (err) {
      container.innerHTML = '<p style="text-align:center;padding:3rem;color:var(--text);">Impossible de charger l\'image.<br><small>' + String(err) + '</small></p>';
    });

  // Pointer controls
  // Drag RIGHT → group.rotation.y increases → painting turns right ✓
  // Drag UP → screen dy is NEGATIVE → rotation.x -= negative → rotation.x INCREASES
  //   → top of painting tilts toward camera → "follow finger" convention ✓
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
    var dx = e.clientX - prevX;
    var dy = e.clientY - prevY;
    group.rotation.y += dx * 0.008;
    group.rotation.x -= dy * 0.006;
    group.rotation.x = Math.max(-0.7, Math.min(0.7, group.rotation.x));
    prevX = e.clientX;
    prevY = e.clientY;
  });
  canvas.addEventListener('pointerup', function (e) {
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    camera.position.z = Math.max(1.5, Math.min(5, camera.position.z + e.deltaY * 0.003));
    camera.lookAt(0, 0, 0);
  }, { passive: false });

  var lastPinchDist = 0;
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      var a = e.touches[0], b = e.touches[1];
      lastPinchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      var a = e.touches[0], b = e.touches[1];
      var dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      camera.position.z = Math.max(1.5, Math.min(5, camera.position.z - (dist - lastPinchDist) * 0.008));
      lastPinchDist = dist;
      camera.lookAt(0, 0, 0);
    }
  }, { passive: true });

  var animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

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
