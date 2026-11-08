import "./style.css";
// Effects register themselves; the rack plays them through resolved moves.
import "./effects/library.ts";
import { ACESFilmicToneMapping, PCFSoftShadowMap, Timer, WebGLRenderer } from "three";
import { rooms } from "./core/room-registry.ts";
import { World } from "./core/world.ts";
import { Noclip } from "./dev/noclip.ts";
import { FrameRenderer } from "./render/frame.ts";
import { Bloom } from "./traits/bloom.ts";
import { INSPECT, type InspectInfo } from "./traits/inspectable.ts";
import { GameTimer } from "./traits/game-timer.ts";
import { GambitRack } from "./hud/gambit-rack-dom.ts";
import { CUE_CHANGED, NEXT_CUE } from "./traits/lighting-cues.ts";
import { ROUND_STARTED, RoundAudio } from "./traits/round-audio.ts";

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
const roundStart = document.querySelector<HTMLElement>("#round-start")!;
const roundStartButton = document.querySelector<HTMLButtonElement>("#round-start-button")!;
const gambitRackSlot = document.querySelector<HTMLElement>("#gambit-rack-slot")!;
const gambitSummary = document.querySelector<HTMLElement>("#gambit-summary")!;
const gambitRack = new GambitRack(gambitRackSlot, gambitSummary);
// The noclip panel builds its own markup so it never depends on index.html.
const noclipHud = Object.assign(document.createElement("div"), { id: "noclip", hidden: true });
noclipHud.innerHTML = "<strong>NOCLIP</strong> <code></code><small></small>";
document.body.appendChild(noclipHud);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = ACESFilmicToneMapping;
// Shadows are opt-in per light and per object (castShadow settings).
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const world = new World();
// Debug handle for the browser console in dev builds.
if (import.meta.env.DEV) (window as unknown as { world: World }).world = world;

const frame = new FrameRenderer(renderer);
// Debug handles for the browser console in dev builds (e.g. timing the renderer).
if (import.meta.env.DEV) Object.assign(window, { frame, renderer });

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight);
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

let cue = "";
world.events.on(CUE_CHANGED, (name) => {
  cue = String(name);
  showRoomLabel();
});

function showRoomLabel(): void {
  if (!def) return;
  const parts = [def.name];
  if (def.title) parts.push(def.title);
  if (cue) parts.push(`${cue} (L)`);
  if (world.projection === "orthographic") parts.push("orthographic (Q)");
  label.textContent = parts.join(" · ");
}

const roomName = new URLSearchParams(window.location.search).get("room") ?? DEFAULT_ROOM;
const def = rooms.get(roomName);
let awaitingRoundStart = false;
if (def) {
  rooms.load(world, roomName);
  showRoomLabel();
  if (world.current?.has(RoundAudio)) {
    world.current.settingsOf(GameTimer)!.running = false;
    awaitingRoundStart = true;
    gambitRackSlot.inert = true;
    roundStart.hidden = false;
    roundStartButton.focus();
  }
  // The rack reads the room's hand, so it is rebuilt per room.
  gambitRack.show(world.current ? { world, room: world.current } : null);
} else {
  const known = rooms
    .list()
    .map((r) => r.name)
    .join(", ");
  label.textContent = `Unknown room "${roomName}". Rooms: ${known}`;
}

roundStartButton.addEventListener("click", () => {
  const room = world.current;
  if (!room?.has(RoundAudio)) return;
  // This user gesture unlocks Web Audio and starts the clock together.
  room.emit(ROUND_STARTED);
  room.settingsOf(GameTimer)!.running = true;
  awaitingRoundStart = false;
  gambitRackSlot.inert = false;
  roundStart.hidden = true;
});

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
// Settings panel: bloom amount and day/night outside. It edits the room's own
// Bloom trait settings, so the value lives with the room like everything else.
const panel = Object.assign(document.createElement("div"), { id: "settings" });
panel.innerHTML = `
  <label>Bloom <input type="range" min="0" max="0.1" step="0.005" /> <output></output></label>
  <button type="button"></button>`;
document.body.appendChild(panel);
const bloomInput = panel.querySelector("input")!;
const bloomValue = panel.querySelector("output")!;
const outsideButton = panel.querySelector("button")!;
function showSettings(): void {
  const bloom = world.current?.settingsOf(Bloom);
  bloomInput.disabled = !bloom;
  bloomInput.title = bloom ? "" : "This room has no bloom";
  if (bloom && document.activeElement !== bloomInput) bloomInput.value = String(bloom.strength);
  bloomValue.textContent = bloom ? bloom.strength.toFixed(3) : "–";
  outsideButton.textContent = world.outside === "day" ? "☀ Day (T)" : "☾ Night (T)";
}
bloomInput.addEventListener("input", () => {
  const bloom = world.current?.settingsOf(Bloom);
  if (bloom) bloom.strength = Number(bloomInput.value);
  showSettings();
});
function toggleOutside(): void {
  world.outside = world.outside === "day" ? "night" : "day";
  showSettings();
}
outsideButton.addEventListener("click", () => {
  toggleOutside();
  outsideButton.blur();
});
showSettings();

window.addEventListener("keydown", (event) => {
  // Keys typed into the settings panel's controls aren't game keys.
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
  if (event.code === "KeyT" && !event.repeat) toggleOutside();
  if (event.code === "KeyN" && !event.repeat) {
    noclip.toggle();
    world.manualCamera = noclip.active;
    if (noclip.active) world.pointer.move(null);
    else document.exitPointerLock();
    canvas.style.cursor = "default";
  } else if (event.code === "KeyL" && !event.repeat) {
    world.events.emit(NEXT_CUE);
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
  world.update(awaitingRoundStart ? 0 : dt);
  renderRoundMeter();
  gambitRack.refresh(dt);
  showNoclip();
  frame.render(world);
  gambitRack.render(renderer);
});
