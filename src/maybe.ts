export function mapMaybe<T, U>(xs: T[], f: (x: T) => U | null): U[] {
  // TS can't tell this won't be (U | null)[] without the as
  return xs.map(f).filter((u) => u !== null) as U[];
}
