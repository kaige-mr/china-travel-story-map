import { get, set } from "idb-keyval";
import "fake-indexeddb/auto";

async function test() {
  const hugeString = "a".repeat(100 * 1024 * 1024); // 100 MB string
  console.log("Saving...");
  await set("huge", hugeString);
  console.log("Saved. Reading...");
  const read = await get("huge");
  console.log("Read length:", read.length);
}

test().catch(console.error);
