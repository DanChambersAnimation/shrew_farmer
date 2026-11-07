import "./style.css";
import { ACESFilmicToneMapping, Timer, WebGLRenderer } from "three";
import { rooms } from "./core/room-registry.ts";
import { World } from "./core/world.ts";
import { Noclip } from "./dev/noclip.ts";
import { INSPECT, type InspectInfo } from "./traits/inspectable.ts";
import { GameTimer } from "./traits/game-timer.ts";

// Every module in src/rooms registers its room with the registry.
import.meta.glob(["./rooms/*.ts", "!./rooms/*.test.ts"], { eager: true });

const DEFAULT_ROOM = "dev0";

const app = document.querySelector<HTMLDivElement>("#app")!;
const label = document.querySelector<HTMLDivElement>("#room-label")!;
const info = document.querySelector<HTMLDivElement>("#info")!;
const roundMeter = document.querySelector<HTMLElement>("#round-meter")!;
const roundMeterTrack = document.querySelector<HTMLElement>("#round-meter-track")!;
const roundMeterFill = document.querySelector<HTMLElement>("#round-meter-fill")!;
const roundMeterMarker = document.querySelector<HTMLElement>("#round-meter-marker")!;
const roundMeterRemaining = document.querySelector<HTMLElement>("#round-meter-remaining")!;
// The noclip panel builds its own markup so it never depends on index.html.
const noclipHud = Object.assign(document.createElement("div"), { id: "noclip", hidden: true });
noclipHud.innerHTML = "<strong>NOCLIP</strong> <code></code><small></small>";
document.body.appendChild(noclipHud);

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

function showRoomLabel(): void {
  if (!def) return;
  const name = def.title ? `${def.name} · ${def.title}` : def.name;
  label.textContent = world.projection === "orthographic" ? `${name} · orthographic (Q)` : name;
}

const roomName = new URLSearchParams(window.location.search).get("room") ?? DEFAULT_ROOM;
const def = rooms.get(roomName);
if (def) {
  rooms.load(world, roomName);
  showRoomLabel();
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
  if (noclip.active) return;
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
  if (noclip.active) {
    void canvas.requestPointerLock();
    return;
  }
  pointerAt(event);
  world.pointer.click();
});

// Noclip camera (N): fly around to find a camera position for a room.
const noclip = new Noclip(world.camera);
let copied = "";
function showNoclip(): void {
  noclipHud.hidden = !noclip.active;
  if (!noclip.active) return;
  const locked = document.pointerLockElement === canvas;
  noclipHud.querySelector("code")!.textContent = noclip.snippet();
  noclipHud.querySelector("small")!.textContent =
    copied ||
    (locked
      ? "WASD move · R/F up/down · Shift fast · wheel zoom · C copy · Esc free mouse · N exit"
      : "Click the view to look around · C copy · N exit");
}
window.addEventListener("keydown", (event) => {
  if (event.code === "KeyN" && !event.repeat) {
    noclip.toggle();
    world.manualCamera = noclip.active;
    if (noclip.active) world.pointer.move(null);
    else document.exitPointerLock();
    canvas.style.cursor = "default";
  } else if (event.code === "KeyQ" && !event.repeat) {
    // Toggle between perspective and orthographic projection.
    world.projection = world.projection === "perspective" ? "orthographic" : "perspective";
    showRoomLabel();
  } else if (event.code === "KeyC" && noclip.active) {
    const text = noclip.snippet();
    navigator.clipboard?.writeText(text).then(
      () => (copied = "Copied camera settings to the clipboard"),
      () => (copied = "Couldn't copy; select the text above instead"),
    );
    setTimeout(() => (copied = ""), 2000);
  }
  noclip.press(event.code);
});
window.addEventListener("keyup", (event) => noclip.release(event.code));
window.addEventListener("blur", () => noclip.releaseAll());
document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === canvas) noclip.look(event.movementX, event.movementY);
});
canvas.addEventListener(
  "wheel",
  (event) => {
    if (!noclip.active) return;
    event.preventDefault();
    noclip.zoom(Math.sign(event.deltaY) * 2);
  },
  { passive: false },
);

world.events.on(INSPECT, (payload) => {
  const shown = payload as InspectInfo | null;
  info.hidden = !shown;
  if (shown) {
    info.querySelector("h2")!.textContent = shown.title;
    info.querySelector("p")!.textContent = shown.description;
  }
});

function renderRoundMeter(): void {
  const clock = world.current?.settingsOf(GameTimer);
  roundMeter.hidden = !clock;
  if (!clock) return;
  const progress = Math.min(1, clock.elapsedSeconds / clock.durationSeconds);
  const secondsLeft = Math.ceil(clock.durationSeconds - clock.elapsedSeconds);
  roundMeterFill.style.width = `${progress * 100}%`;
  roundMeterMarker.style.left = `${progress * 100}%`;
  roundMeterRemaining.textContent = secondsLeft > 0 ? `${secondsLeft}s` : "TIME!";
  roundMeter.dataset.complete = String(secondsLeft === 0);
  roundMeterTrack.setAttribute("aria-valuemax", String(clock.durationSeconds));
  roundMeterTrack.setAttribute("aria-valuenow", String(Math.floor(clock.elapsedSeconds)));
  roundMeterTrack.setAttribute(
    "aria-valuetext",
    `${Math.floor(clock.elapsedSeconds)} of ${clock.durationSeconds} seconds elapsed`,
  );
}

renderRoundMeter();

const timer = new Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const dt = timer.getDelta();
  noclip.update(dt);
  world.update(dt);
  renderRoundMeter();
  showNoclip();
  renderer.render(world.scene, world.viewCamera);
});
