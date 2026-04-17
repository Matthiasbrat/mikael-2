// js/viewer3d.js — ES module, lazy-loaded via dynamic import() when user clicks "Voir en 3D".
// Three.js is fetched from CDN only at that point (~600 KB), not on initial page load.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

window.init3DViewer = function (containerId, imageUrl, artW, artH) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cw = container.clientWidth;
  const ch = container.clientHeight || cw * 0.75;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0ebe3);

  const camera = new THREE.PerspectiveCamera(40, cw / ch, 0.1, 100);
  camera.position.set(1.2, 0.3, 2.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(cw, ch);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 1;
  controls.maxDistance = 5;
  controls.maxPolarAngle = Math.PI * 0.85;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(3, 4, 5);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  scene.add(dir);
  scene.add(new THREE.HemisphereLight(0xfff5e6, 0xd4c8b0, 0.3));

  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  loader.load(imageUrl, function (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const ratio = artW / artH;
    const maxDim = 1.8;
    const pw = ratio >= 1 ? maxDim : maxDim * ratio;
    const ph = ratio >= 1 ? maxDim / ratio : maxDim;
    const depth = Math.max(pw, ph) * 0.04;

    const frontMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.85 });
    const backMat = new THREE.MeshStandardMaterial({ color: 0xe5ddd0, roughness: 0.9 });
    const painting = new THREE.Mesh(
      new THREE.BoxGeometry(pw, ph, depth),
      [sideMat, sideMat, sideMat, sideMat, frontMat, backMat]
    );
    painting.castShadow = true;

    const border = 0.05;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.5, metalness: 0.1 });
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(pw + border * 2, ph + border * 2, depth + 0.02),
      frameMat
    );
    frame.position.z = -0.005;
    frame.castShadow = true;

    const group = new THREE.Group();
    group.add(frame);
    group.add(painting);
    scene.add(group);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xede6d8, roughness: 1 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), wallMat);
    wall.position.z = -(depth / 2 + 0.35);
    wall.receiveShadow = true;
    scene.add(wall);
  });

  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  const ro = new ResizeObserver(function () {
    const w = container.clientWidth;
    const h = container.clientHeight || w * 0.75;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(container);

  return function dispose() {
    cancelAnimationFrame(animId);
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
    container.innerHTML = '';
  };
};
