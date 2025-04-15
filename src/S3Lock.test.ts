import { Duration } from "./duration";
import { S3Lock } from "./S3Lock";
import { S3LockExt } from "./S3LockExt";

describe("S3Lock", () => {
  describe("durationTillExpiry", () => {
    test("returns the duration until the lock expires", () => {
      const bucket = "test-bucket";
      const name = "test-lock";
      const expires = new Duration("1h");
      const s3Lock = new S3Lock(bucket, name, expires);
      
      const now = new Date();
      const expiryTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      const ext = new S3LockExt();
      ext.createdAt = now;
      ext.expiresAt = expiryTime;
      ext.uuid = "test-uuid";
      
      const key = `${name}.${ext.toString()}`;
      const expectedDuration = Duration.until(expiryTime);
      const result = s3Lock.durationTillExpiry(key);
      
      expect(result.seconds()).toBeCloseTo(expectedDuration.seconds(), 0); // within 5 seconds
    });
  });
}); 