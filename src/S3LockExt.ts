import { v4 as uuidv4 } from "uuid";

import { Duration } from "./duration";

export interface Object {
  Key?: string;
}

export function createObjectKey(prefix: string, expires: Duration): string {
  const ext = new S3LockExt(expires);
  return `${prefix}${ext}`;
}

export function validateObjectKey(prefix: string, obj: Object): string | null {
  if (!obj.Key) {
    return null;
  }

  const end = obj.Key.slice(prefix.length);
  const ext = S3LockExt.fromString(end);

  return ext.isExpired() ? null : obj.Key;
}

// Extension of the format "{created}.{uuid}.{expires}"
export class S3LockExt {
  uuid: string;
  createdAt: Date;
  expiresAt: Date;

  constructor(expires?: Duration) {
    this.createdAt = new Date();
    this.expiresAt = expires ? expires.after(this.createdAt) : new Date();
    this.uuid = uuidv4();
  }

  toString(): string {
    const created = this.createdAt.getTime();
    const expires = this.expiresAt.getTime();
    return `${created}.${this.uuid}.${expires}`;
  }

  isExpired(): boolean {
    const now = new Date();
    return this.expiresAt < now;
  }

  static fromString(key: string): S3LockExt {
    const parts = key.split(".");

    if (parts.length !== 3) {
      throw new Error(
        `Expected extension to have 3 dot-separated parts (saw [${parts.join(
          ",",
        )}])`,
      );
    }

    const getDatePart = (idx: number): Date => {
      return new Date(parseInt(parts[idx], 10));
    };

    const obj = new this();

    obj.uuid = parts[1];
    obj.createdAt = getDatePart(0);
    obj.expiresAt = getDatePart(2);

    return obj;
  }
}
