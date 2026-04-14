const dayNames = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];

function normalize(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function witaNowParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Makassar",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const obj = {};
  for (const p of parts) {
    if (p.type === "weekday") obj.weekday = p.value;
    if (p.type === "hour") obj.hour = p.value;
    if (p.type === "minute") obj.minute = p.value;
  }
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayIndex = map[obj.weekday] ?? new Date().getDay();
  const hour = Number(obj.hour);
  const minute = Number(obj.minute);
  return { dayIndex, minutes: hour * 60 + minute };
}

function dayMatches(dayText, todayIndex) {
  const s = normalize(dayText);
  if (!s) return false;

  if (s.includes("setiap hari") || s.includes("tiap hari")) return true;

  const today = dayNames[todayIndex];
  if (s.includes(today)) return true;

  if (!s.includes("-")) return false;

  const positions = [];
  for (let i = 0; i < dayNames.length; i += 1) {
    const name = dayNames[i];
    const pos = s.indexOf(name);
    if (pos >= 0) positions.push({ idx: i, pos });
  }
  if (positions.length < 2) return false;
  positions.sort((a, b) => a.pos - b.pos);
  const start = positions[0].idx;
  const end = positions[positions.length - 1].idx;

  if (start <= end) return todayIndex >= start && todayIndex <= end;
  return todayIndex >= start || todayIndex <= end;
}

function parseIntervals(timeText) {
  const s = normalize(timeText);
  if (!s) return [];
  if (s.includes("tutup")) return [];

  const cleaned = s.replace(/\bwita\b/g, " ");
  const intervals = [];
  const re = /(\d{1,2})[.:](\d{2})\s*(?:-|–|—)\s*(\d{1,2})[.:](\d{2})/g;
  let m;
  while ((m = re.exec(cleaned))) {
    const sh = Number(m[1]);
    const sm = Number(m[2]);
    const eh = Number(m[3]);
    const em = Number(m[4]);
    if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) continue;
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (end <= start) continue;
    intervals.push({ start, end });
  }
  return intervals;
}

export function isServiceOpenNowWita(hoursRows) {
  if (!Array.isArray(hoursRows) || hoursRows.length === 0) return true;
  const { dayIndex, minutes } = witaNowParts();

  const todaysIntervals = [];
  for (const row of hoursRows) {
    if (!row) continue;
    if (!dayMatches(row.day, dayIndex)) continue;
    todaysIntervals.push(...parseIntervals(row.time));
  }
  if (todaysIntervals.length === 0) return false;
  return todaysIntervals.some((it) => minutes >= it.start && minutes < it.end);
}

export function getWitaDayLabel() {
  const { dayIndex } = witaNowParts();
  const labels = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return labels[dayIndex] || "";
}

