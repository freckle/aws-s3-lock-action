export interface Object {
  LastModified?: Date;
  Key?: string;
}

export function compareObjects(a: Object, b: Object): number {
  return compareBy(a, b, [(x) => x.LastModified, (x) => x.Key]);
}

function compareBy<T>(a: T, b: T, fns: ((arg: T) => any)[]): number {
  // Go through each function
  for (const fn of fns) {
    // Call it on both items
    const ax = fn(a);
    const bx = fn(b);

    // If there's a difference, compare by it
    if (ax !== bx) {
      return ax > bx ? 1 : -1;
    }
  }

  // If we get here, all functions return equal values (or there were none)
  return 0;
}
