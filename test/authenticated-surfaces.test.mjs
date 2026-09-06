import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authenticatedSurfaces = [
  "src/components/binder/BinderApp.tsx",
  "src/components/groups/GroupsPageClient.tsx",
  "src/components/groups/GroupDetailClient.tsx",
];

test("every authenticated interactive surface coordinates idle sessions", async () => {
  for (const path of authenticatedSurfaces) {
    const source = await readFile(path, "utf8");
    assert.match(source, /import \{ IdleLogout \}/, `${path} must import IdleLogout`);
    assert.match(source, /<IdleLogout \/>/, `${path} must render IdleLogout`);
  }
});
