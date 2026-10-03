// lib/djProfileUtils.js

export const formatZAR = (v) => `R${Number(v || 0).toLocaleString("en-ZA")}`;

export const timeAgo = (ts) => {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

export const formatDate = (d, opts = { day: "numeric", month: "short", year: "numeric" }) => {
  const date = new Date(d);
  return isNaN(date) ? "—" : date.toLocaleDateString("en-ZA", opts);
};

// Derive a DJ slug from stage name
export const slugify = (str) =>
  (str || "dj")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// Aggregate review stats
export const summarizeReviews = (reviews = []) => {
  if (!reviews.length) return { count: 0, average: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  reviews.forEach((r) => {
    const rating = Math.max(1, Math.min(5, Math.round(r.rating)));
    breakdown[rating] = (breakdown[rating] || 0) + 1;
    sum += rating;
  });
  return { count: reviews.length, average: sum / reviews.length, breakdown };
};

// Load/save reviews keyed by DJ slug
const REVIEWS_KEY = "gigzaReviews";

export const loadReviews = (slug) => {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {};
    return all[slug] || [];
  } catch {
    return [];
  }
};

export const saveReview = (slug, review) => {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {};
    all[slug] = [review, ...(all[slug] || [])];
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
};

// Seed a couple reviews so preview isn't empty
export const ensureSeedReviews = (slug, stageName) => {
  if (!slug) return;
  try {
    const all = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {};
    if (all[slug]?.length) return;
    all[slug] = [
      {
        id: "seed-1",
        client: "Sarah N.",
        rating: 5,
        text: `Absolutely nailed our wedding. ${stageName || "The DJ"} read the room perfectly all night.`,
        eventType: "Wedding Reception",
        date: "2026-09-14",
        verified: true,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
      },
      {
        id: "seed-2",
        client: "TechCorp SA",
        rating: 4,
        text: "Professional, on time, exactly the vibe we briefed. Will book again.",
        eventType: "Corporate Event",
        date: "2026-08-30",
        verified: true,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
      },
    ];
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
};