import "./style.css";
import { ACESFilmicToneMapping, Timer, WebGLRenderer } from "three";
import { rooms } from "./core/room-registry.ts";
import { World } from "./core/world.ts";

// Every module in src/rooms registers its room with the registry.
import.meta.glob(["./rooms/*.ts", "!./rooms/*.test.ts"], { eager: true });

const DEFAULT_ROOM = "dev0";

const app = document.querySelector<HTMLDivElement>("#app")!;
const label = document.querySelector<HTMLDivElement>("#room-label")!;

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = ACESFilmicToneMapping;
app.appendChild(renderer.domElement);

const world = new World();

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight);
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const roomName = new URLSearchParams(window.location.search).get("room") ?? DEFAULT_ROOM;
const def = rooms.get(roomName);
if (def) {
  rooms.load(world, roomName);
  label.textContent = def.title ? `${def.name} · ${def.title}` : def.name;
} else {
  const known = rooms
    .list()
    .map((r) => r.name)
    .join(", ");
  label.textContent = `Unknown room "${roomName}". Rooms: ${known}`;
}

const timer = new Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  world.update(timer.getDelta());
  renderer.render(world.scene, world.camera);
});
