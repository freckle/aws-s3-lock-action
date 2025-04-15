import { Duration } from "./duration";
import { S3LockExt, createObjectKey, validateObjectKey } from "./S3LockExt";

describe("createObjectKey", () => {
  test("creates key like prefix.created.uuid.expires", () => {
    const key = createObjectKey("some/prefix.", new Duration("1m"));

    expect(key).toMatch(/^some\/prefix\.[0-9]+\.[a-f0-9-]+\.[0-9]+$/);
  });
});

describe("validateObjectKey", () => {
  test("skips objects without key", () => {
    expect(validateObjectKey("some/prefix.", {})).toBeNull();
  });

  test("skips objects that have expired", () => {
    const oneHour = new Duration("1h");
    const ext = new S3LockExt(oneHour);
    ext.expiresAt = oneHour.before(new Date());
    const prefix = "some/prefix.";

    const key = `${prefix}${ext}`;

    expect(validateObjectKey(prefix, { Key: key })).toBeNull();
  });

  test("returns keys that have no expired", () => {
    const ext = new S3LockExt(new Duration("1h"));
    const prefix = "some/prefix.";
    const key = `${prefix}${ext}`;

    expect(validateObjectKey(prefix, { Key: key })).toEqual(key);
  });
});

describe("S3LockExt", () => {
  test("round trips", () => {
    const exp = new Duration("1m");
    const ext = new S3LockExt(exp);
    expect(S3LockExt.fromString(ext.toString())).toEqual(ext);
  });

  test("sets expiresAt based on createdAt", () => {
    const exp = new Duration("100ms");
    const ext = new S3LockExt(exp);

    expect(ext.expiresAt.getTime() - ext.createdAt.getTime()).toEqual(100);
  });

  test("sorts by created then uuid", () => {
    const makeExt = (nowS: string, uuid: string): S3LockExt => {
      const now = new Date(nowS);
      const exp = new Duration("1m");
      const ext = new S3LockExt(exp);
      ext.createdAt = now;
      ext.expiresAt = exp.after(now);
      ext.uuid = uuid;
      return ext;
    };

    const ext1 = makeExt("2023-01-01", "uuid2");
    const ext2 = makeExt("2023-01-02", "uuid1");
    const ext3 = makeExt("2023-01-03", "uuid3");
    const ext4 = makeExt("2023-01-03", "uuid4");
    const exts = [ext2, ext4, ext1, ext3];

    expect(exts.sort()).toEqual([ext1, ext2, ext3, ext4]);
  });

  describe("fromKey", () => {
    test("extracts extension from a key with prefix", () => {
      const createdAt = new Date("2023-01-01T12:00:00Z");
      const expiresAt = new Date("2023-01-01T13:00:00Z");
      const uuid = "test-uuid";
      
      const ext = new S3LockExt();
      ext.createdAt = createdAt;
      ext.expiresAt = expiresAt;
      ext.uuid = uuid;
      
      const prefix = "test/prefix/";
      const key = `${prefix}${ext.toString()}`;
      
      const result = S3LockExt.fromKey(prefix, key);
      
      expect(result.uuid).toEqual(uuid);
      expect(result.createdAt.getTime()).toEqual(createdAt.getTime());
      expect(result.expiresAt.getTime()).toEqual(expiresAt.getTime());
    });
    
    test("handles keys with different prefixes", () => {
      const createdAt = new Date("2023-01-01T12:00:00Z");
      const expiresAt = new Date("2023-01-01T13:00:00Z");
      const uuid = "test-uuid";
      
      const ext = new S3LockExt();
      ext.createdAt = createdAt;
      ext.expiresAt = expiresAt;
      ext.uuid = uuid;
      
      const prefix = "custom/prefix/";
      const key = `${prefix}${ext.toString()}`;
      
      const result = S3LockExt.fromKey(prefix, key);
      
      expect(result.uuid).toEqual(uuid);
      expect(result.createdAt.getTime()).toEqual(createdAt.getTime());
      expect(result.expiresAt.getTime()).toEqual(expiresAt.getTime());
    });
  });
});
