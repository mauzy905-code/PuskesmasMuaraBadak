export function isValidNIK(nik) {
  return /^\d{16}$/.test(String(nik || "").trim());
}

export function minVisitDateISO(minDaysAhead = 1) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + minDaysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function required(value) {
  return String(value || "").trim().length > 0;
}
