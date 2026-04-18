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
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(2, 3, 4);
  scene.add(dirLight);

  var group = new THREE.Group();
  group.rotation.set(0, 0.3, 0);
  scene.add(group);

  // Wall
  scene.add(Object.assign(
    new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ color: 0xede6d8 })),
    { position: new THREE.Vector3(0, 0, -0.6) }
  ));

  function buildPainting(texture) {
    var ratio = artW / artH;
    var maxDim = 1.8;
    var pw = ratio >= 1 ? maxDim : maxDim * ratio;
    var ph = ratio >= 1 ? maxDim / ratio : maxDim;
    var depth = Math.max(pw, ph) * 0.04;

    // MeshBasicMaterial for the front — no lighting needed, just shows the texture
    var frontMat = new THREE.MeshBasicMaterial({ map: texture });
    var sideMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e6 });
    var backMat = new THREE.MeshLambertMaterial({ color: 0xe5ddd0 });
    var painting = new THREE.Mesh(
      new THREE.BoxGeometry(pw, ph, depth),
      [sideMat, sideMat, sideMat, sideMat, frontMat, backMat]
    );
    group.add(painting);

    var border = 0.05;
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(pw + border * 2, ph + border * 2, depth + 0.02),
      new THREE.MeshLambertMaterial({ color: 0x1a1612 })
    );
    frame.position.z = -0.005;
    group.add(frame);
  }

  // Strategy 1: grab the already-loaded <img> from the page, draw to canvas
  // This image is already visible on screen — no CORS/fetch issues possible
  var pageImg = document.querySelector('.main-image img');
  var textureLoaded = false;

  if (pageImg && pageImg.complete && pageImg.naturalWidth > 0) {
    try {
      var cvs = document.createElement('canvas');
      cvs.width = pageImg.naturalWidth;
      cvs.height = pageImg.naturalHeight;
      var ctx = cvs.getContext('2d');
      ctx.drawImage(pageImg, 0, 0);
      // Test for tainted canvas
      ctx.getImageData(0, 0, 1, 1);
      buildPainting(new THREE.CanvasTexture(cvs));
      textureLoaded = true;
    } catch (e) {
      // Canvas is tainted — fall through to strategy 2
    }
  }

  // Strategy 2: fetch as blob → blob URL → TextureLoader
  if (!textureLoaded) {
    fetch(imageUrl, { mode: 'cors' })
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        var blobUrl = URL.createObjectURL(blob);
        new THREE.TextureLoader().load(blobUrl, function (texture) {
          buildPainting(texture);
          setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 2000);
        }, undefined, function () {
          // Strategy 3: direct TextureLoader (last resort)
          var loader = new THREE.TextureLoader();
          loader.crossOrigin = 'anonymous';
          loader.load(imageUrl, function (texture) {
            buildPainting(texture);
          }, undefined, function () {
            container.innerHTML = '<p style="text-align:center;padding:3rem;">Texture introuvable.</p>';
          });
        });
      })
      .catch(function () {
        // Fetch blocked (Brave Shields?) — try direct load
        var loader = new THREE.TextureLoader();
        loader.crossOrigin = 'anonymous';
        loader.load(imageUrl, function (texture) {
          buildPainting(texture);
        }, undefined, function () {
          container.innerHTML = '<p style="text-align:center;padding:3rem;">Texture introuvable.</p>';
        });
      });
  }

  // Pointer controls
  // Drag RIGHT → rotation.y increases → painting turns right
  // Drag UP → dy NEGATIVE → rotation.x -= NEGATIVE → increases → top toward camera
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

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    camera.position.z = Math.max(1.5, Math.min(5, camera.position.z + e.deltaY * 0.003));
  }, { passive: false });

  var lastPinchDist = 0;
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      lastPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      var dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      camera.position.z = Math.max(1.5, Math.min(5, camera.position.z - (dist - lastPinchDist) * 0.008));
      lastPinchDist = dist;
    }
  }, { passive: true });

  var animId;
  (function animate() {
    animId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  })();

  var ro = new ResizeObserver(function () {
    var w = container.clientWidth;
    var h = container.clientHeight || w * 0.75;
    renderer.setSize(w, h);
    camera.aspect = w / h;
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
