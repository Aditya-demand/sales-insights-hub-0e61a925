export type SalesRow = {
  date: string; // YYYY-MM-DD
  product: string;
  category: string;
  region: string;
  channel: string;
  units: number;
  revenue: number;
};

const products = [
  { name: "Aurora Headphones", category: "Audio", price: 249 },
  { name: "Nimbus Speaker", category: "Audio", price: 179 },
  { name: "Pulse Smartwatch", category: "Wearables", price: 329 },
  { name: "Vertex Laptop", category: "Computers", price: 1499 },
  { name: "Lumen Monitor", category: "Computers", price: 549 },
  { name: "Orbit Camera", category: "Photo", price: 899 },
  { name: "Echo Earbuds", category: "Audio", price: 129 },
  { name: "Flux Tablet", category: "Computers", price: 699 },
  { name: "Halo Ring", category: "Wearables", price: 299 },
  { name: "Prism Drone", category: "Photo", price: 1199 },
];
const regions = ["North America", "Europe", "APAC", "LATAM"];
const channels = ["Online", "Retail", "Wholesale"];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateSampleData(): SalesRow[] {
  const rand = seededRand(42);
  const rows: SalesRow[] = [];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 365);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const txns = 6 + Math.floor(rand() * 10);
    for (let i = 0; i < txns; i++) {
      const p = products[Math.floor(rand() * products.length)];
      const units = 1 + Math.floor(rand() * 8);
      // Trend: grow over time + slight seasonality
      const dayIdx = Math.floor((d.getTime() - start.getTime()) / 86400000);
      const trend = 1 + dayIdx / 600;
      const season = 1 + 0.25 * Math.sin((dayIdx / 365) * Math.PI * 2);
      const revenue = Math.round(units * p.price * trend * season * (0.85 + rand() * 0.3));
      rows.push({
        date: d.toISOString().slice(0, 10),
        product: p.name,
        category: p.category,
        region: regions[Math.floor(rand() * regions.length)],
        channel: channels[Math.floor(rand() * channels.length)],
        units,
        revenue,
      });
    }
  }
  return rows;
}