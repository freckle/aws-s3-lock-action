import { normalizePrefix } from "./normalize-prefix";

test("empty values are returned as is", () => {
  expect(normalizePrefix("")).toBe("");
  expect(normalizePrefix(" ")).toBe("");
});

test("non-empty values drop leading slash and ensure trailing", () => {
  expect(normalizePrefix("some/thing ")).toBe("some/thing/");
  expect(normalizePrefix("some/thing/ ")).toBe("some/thing/");
  expect(normalizePrefix("/some/thing")).toBe("some/thing/");
  expect(normalizePrefix("/some/thing/")).toBe("some/thing/");
  expect(normalizePrefix("  some/thing ")).toBe("some/thing/");
});
