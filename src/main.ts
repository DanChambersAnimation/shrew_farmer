import "./style.css";
import { ACESFilmicToneMapping, Timer, WebGLRenderer } from "three";
import { rooms } from "./core/room-registry.ts";
import { World } from "./core/world.ts";
import { INSPECT, type InspectInfo } from "./traits/inspectable.ts";

// Every module in src/rooms registers its room with the registry.
import.meta.glob(["./rooms/*.ts", "!./rooms/*.test.ts"], { eager: true });

const DEFAULT_ROOM = "dev0";

const app = document.querySelector<HTMLDivElement>("#app")!;
const label = document.querySelector<HTMLDivElement>("#room-label")!;
const info = document.querySelector<HTMLDivElement>("#info")!;

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = ACESFilmicToneMapping;
app.appendChild(renderer.domElement);

const world = new World();
// Debug handle for the browser console in dev builds.
if (import.meta.env.DEV) (window as unknown as { world: World }).world = world;

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

// Mouse -> pointer system. What hovering or clicking does is up to each object's traits.
const canvas = renderer.domElement;
function pointerAt(event: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  world.pointer.move({
    x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
    y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
  });
  canvas.style.cursor = world.pointer.interactive ? "pointer" : "default";
}
canvas.addEventListener("pointermove", pointerAt);
canvas.addEventListener("pointerleave", () => world.pointer.move(null));
canvas.addEventListener("click", (event) => {
  pointerAt(event);
  world.pointer.click();
});

world.events.on(INSPECT, (payload) => {
  const shown = payload as InspectInfo | null;
  info.hidden = !shown;
  if (shown) {
    info.querySelector("h2")!.textContent = shown.title;
    info.querySelector("p")!.textContent = shown.description;
  }
});

const timer = new Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  world.update(timer.getDelta());
  renderer.render(world.scene, world.camera);
});
