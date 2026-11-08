import "./preview.css";
import { AUDIO_CLIPS } from "./clips.ts";
import { clipUrl } from "./player.ts";

const root = document.querySelector<HTMLElement>("#audio-preview")!;
const header = document.createElement("header");
header.innerHTML = `<a href="./">← Game</a><h1>Audio samples</h1><p>Six provisional recordings for the first sound and speech review. Compare the two Personal Anecdote outcomes and the audience voices before expanding the cue sheet.</p>`;
root.appendChild(header);

for (const clip of AUDIO_CLIPS) {
  const card = document.createElement("section");
  card.className = "audio-card";
  const category = document.createElement("span");
  category.className = "category";
  category.textContent = `${clip.category} · ${clip.kind}${clip.kind === "speech" ? ` · ${clip.voiceName}` : ""}`;
  const title = document.createElement("h2");
  title.textContent = clip.name;
  const purpose = document.createElement("p");
  purpose.textContent = clip.purpose;
  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "metadata";
  audio.src = clipUrl(clip.id);
  audio.setAttribute("aria-label", clip.name);
  const caption = document.createElement("p");
  caption.className = "caption";
  caption.textContent = `Caption: ${clip.caption}`;
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Generation request and filename";
  const request = document.createElement("pre");
  request.textContent = `${clip.filename}\n\n${JSON.stringify(clip.request, null, 2)}`;
  details.append(summary, request);
  card.append(category, title, purpose, audio, caption, details);
  root.appendChild(card);
}
