import "./preview.css";
import { AUDIO_CLIPS } from "./clips.ts";
import { clipUrl, playRecorded, setAudioListenerPose } from "./player.ts";

const root = document.querySelector<HTMLElement>("#audio-preview")!;
const header = document.createElement("header");
header.innerHTML = `<a href="./">← Game</a><h1>Audio samples</h1><p>${AUDIO_CLIPS.length} recorded cues for the round, gambits, and audience. For crowd clips, compare the original with a left or right seat. Headphones make the position easier to hear.</p>`;
root.appendChild(header);

const filters = document.createElement("div");
filters.className = "filters";
const search = document.createElement("input");
search.type = "search";
search.placeholder = "Search clips, captions, or voices";
search.setAttribute("aria-label", "Search audio clips");
const categoryFilter = document.createElement("select");
categoryFilter.setAttribute("aria-label", "Filter by category");
for (const category of ["all", "speaker", "gambit", "round", "crowd"]) {
  const option = document.createElement("option");
  option.value = category;
  option.textContent = category === "all" ? "All categories" : category;
  categoryFilter.appendChild(option);
}
const count = document.createElement("p");
count.className = "count";
filters.append(search, categoryFilter, count);
root.appendChild(filters);

const cards: { card: HTMLElement; query: string; category: string }[] = [];
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
  audio.preload = "none";
  audio.src = clipUrl(clip.id);
  audio.setAttribute("aria-label", clip.name);
  const inRoom = document.createElement("div");
  if (clip.category === "crowd") {
    inRoom.className = "seat-listen";
    for (const [label, x] of [
      ["Left seat", -3],
      ["Right seat", 3],
    ] as const) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "in-room";
      button.textContent = label;
      button.setAttribute("aria-label", `Hear ${clip.name} from the ${label.toLowerCase()}`);
      button.addEventListener("click", () => {
        audio.pause();
        setAudioListenerPose([0, 2.5, 5], [0, 0, -1]);
        playRecorded(clip.id, [x, 1.4, -1.5]);
      });
      inRoom.appendChild(button);
    }
  }
  const caption = document.createElement("p");
  caption.className = "caption";
  caption.textContent = `Caption: ${clip.caption}`;
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Generation request and filename";
  const request = document.createElement("pre");
  request.textContent = `${clip.filename}\n\n${JSON.stringify(clip.request, null, 2)}`;
  details.append(summary, request);
  card.append(category, title, purpose, audio);
  if (clip.category === "crowd") card.append(inRoom);
  card.append(caption, details);
  root.appendChild(card);
  cards.push({
    card,
    category: clip.category,
    query: [
      clip.id,
      clip.name,
      clip.purpose,
      clip.caption,
      clip.kind,
      clip.kind === "speech" ? clip.voiceName : "",
    ]
      .join(" ")
      .toLowerCase(),
  });
}

function filterCards(): void {
  const query = search.value.trim().toLowerCase();
  const selected = categoryFilter.value;
  let shown = 0;
  for (const item of cards) {
    const visible =
      (selected === "all" || item.category === selected) && item.query.includes(query);
    item.card.hidden = !visible;
    if (visible) shown++;
  }
  count.textContent = `${shown} of ${cards.length} clips`;
}

search.addEventListener("input", filterCards);
categoryFilter.addEventListener("change", filterCards);
filterCards();
