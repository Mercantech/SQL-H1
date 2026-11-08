// This script intentionally removes/recreates ONE named benchmark index.
// It does not touch the four story profiles or any application data.
const lab = db.getSiblingDB("gamehub");
const collection = lab.profiles_bench;
if (collection.countDocuments({}) !== 10000) {
  throw new Error("Run /lab/seed.js first: expected 10000 benchmark profiles.");
}
const indexName = "ix_gamehub_ranking";
if (collection.getIndexes().some(index => index.name === indexName)) {
  collection.dropIndex(indexName);
}
const filter = { region: "EU", rating: { $gte: 1200 } };
const projection = { _id: 1, handle: 1, rating: 1 };
const ranking = { rating: -1, _id: 1 };
const query = () => collection.find(filter, projection).sort(ranking).limit(20);
print("Canonical top-20; compare these ids/handles/ratings with PostgreSQL:");
const rows = query().toArray();
printjson(rows);
// Compare against the equivalent local algorithm, independent of the query.
const logicalRows = Array.from({ length: 10000 }, (_, i) => i + 1)
  .filter(id => id % 3 !== 0 && (id * 37) % 2000 >= 1200)
  .sort((a, b) => ((b * 37) % 2000) - ((a * 37) % 2000) || a - b)
  .slice(0, 20);
if (rows.map(row => row._id).join(",") !== logicalRows.join(",")) {
  throw new Error("Canonical query returned unexpected ids.");
}

function measure(label) {
  query().toArray(); // One unrecorded warm-up per condition.
  for (let repeat = 1; repeat <= 7; repeat++) {
    const explain = query().explain("executionStats");
    const stats = explain.executionStats;
    printjson({
      condition: label,
      repeat,
      nReturned: stats.nReturned,
      executionTimeMillis: stats.executionTimeMillis,
      totalDocsExamined: stats.totalDocsExamined,
      totalKeysExamined: stats.totalKeysExamined,
      winningPlan: explain.queryPlanner.winningPlan
    });
  }
}

measure("before index");
collection.createIndex({ region: 1, rating: -1, _id: 1 }, { name: indexName });
measure("after index");
print("Timing is server explain time, not whole-client latency; 0 ms can be rounding.");
