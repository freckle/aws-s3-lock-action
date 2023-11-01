import { mapMaybe } from "./maybe";

test("mapMaybe", () => {
  const resultA = mapMaybe(["apple", "banana", "boat"], (x) =>
    x.startsWith("a") ? x : null,
  );
  const resultB = mapMaybe(["apple", "banana", "boat"], (x) =>
    x.startsWith("b") ? x : null,
  );

  expect(resultA).toEqual(["apple"]);
  expect(resultB).toEqual(["banana", "boat"]);
});
