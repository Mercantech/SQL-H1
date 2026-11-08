// Run ONLY against the disposable gamehub lab. No real personal data.
const lab = db.getSiblingDB("gamehub");
lab.profiles.drop();
lab.profiles_bench.drop();

lab.profiles.insertMany([
  { _id: 1, handle: "Nova", region: "EU", rating: 1450, settings: { theme: "dark" }, games: [{ slug: "rocket", hours: 24 }, { slug: "valorant", hours: 12 }] },
  { _id: 2, handle: "Pixel", region: "EU", rating: 1280, settings: { theme: "light" }, games: [{ slug: "rocket", hours: 12 }, { slug: "minecraft", hours: 18 }] },
  { _id: 3, handle: "Rune", region: "EU", rating: 990, settings: { theme: "dark" }, games: [{ slug: "valorant", hours: 20 }] },
  { _id: 4, handle: "Echo", region: "NA", rating: 1600, settings: { theme: "dark" }, games: [] }
]);

// Same deterministic logical data as postgres/seed.sql; no randomness.
for (let start = 1; start <= 10000; start += 1000) {
  const batch = [];
  for (let id = start; id < start + 1000; id++) {
    batch.push({
      _id: id,
      handle: "Player" + String(id).padStart(5, "0"),
      region: id % 3 === 0 ? "NA" : "EU",
      rating: (id * 37) % 2000
    });
  }
  lab.profiles_bench.insertMany(batch);
}

const checksum = lab.profiles_bench.aggregate([
  { $group: { _id: null, count: { $sum: 1 }, idSum: { $sum: "$_id" }, ratingSum: { $sum: "$rating" } } }
]).toArray();
print("History profiles: " + lab.profiles.countDocuments({}));
print("Benchmark checksum (expect count 10000, idSum 50005000, ratingSum 9995000):");
printjson(checksum);
