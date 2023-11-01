import { compareObjects } from "./sort-objects";

test("compares last modified first", () => {
  const newer = { LastModified: new Date("2023-02-01"), Key: "" };
  const older = { LastModified: new Date("2023-01-01"), Key: "" };

  expect(compareObjects(older, newer)).toEqual(-1);
  expect(compareObjects(older, older)).toEqual(0);
  expect(compareObjects(newer, older)).toEqual(1);
});

test("compares key if last modified is the same", () => {
  const date = new Date("2023-01-01");
  const uuid1 = { LastModified: date, Key: "uuid1" };
  const uuid2 = { LastModified: date, Key: "uuid2" };
  expect(compareObjects(uuid1, uuid2)).toEqual(-1);
  expect(compareObjects(uuid1, uuid1)).toEqual(0);
  expect(compareObjects(uuid2, uuid1)).toEqual(1);
});

test("sorting", () => {
  const date1 = new Date("2023-01-01");
  const date2 = new Date("2023-01-02");
  const date3 = new Date("2023-01-03");

  const objects = [
    { LastModified: date2, Key: "prefix/lock.uuid1" },
    { LastModified: date3, Key: "prefix/lock.uuid3" },
    { LastModified: date1, Key: "prefix/lock.uuid2" },
    { LastModified: date3, Key: "prefix/lock.uuid4" },
  ];

  expect(objects.sort(compareObjects)).toEqual([
    { LastModified: date1, Key: "prefix/lock.uuid2" },
    { LastModified: date2, Key: "prefix/lock.uuid1" },
    { LastModified: date3, Key: "prefix/lock.uuid3" },
    { LastModified: date3, Key: "prefix/lock.uuid4" },
  ]);
});
