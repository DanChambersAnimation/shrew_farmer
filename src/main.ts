import "./style.css";
import * as THREE from "three";
import { spin } from "./spin.ts";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.querySelector<HTMLDivElement>("#app")!.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b06a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x445522, 1.5));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 5, 2);
scene.add(sun);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x8b5a2b }),
);
scene.add(cube);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const dt = timer.getDelta();
  cube.rotation.x = spin(cube.rotation.x, dt, 0.5);
  cube.rotation.y = spin(cube.rotation.y, dt, 1);
  renderer.render(scene, camera);
});
