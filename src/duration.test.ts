import {Duration} from './duration.js'

describe('Duration.parse', () => {
  test.each([
    ['0', 0],
    ['+0', 0],
    ['-0', 0],
    ['1ms', 1],
    ['5s', 5_000],
    ['1m', 60_000],
    ['15m', 900_000],
    ['1h', 3_600_000],
    ['1d', 86_400_000],
    ['1w', 604_800_000],
    ['1h30m', 5_400_000],
    ['1m30s', 90_000]
  ])('parses %s', (input, expected) => {
    expect(Duration.parse(input).milliseconds()).toEqual(expected)
  })

  test('parses fractional values', () => {
    expect(Duration.parse('1.5s').milliseconds()).toEqual(1_500)
  })

  test('applies a leading minus to the whole duration', () => {
    expect(Duration.parse('-1m').milliseconds()).toEqual(-60_000)
  })

  test('accepts an explicit leading plus', () => {
    expect(Duration.parse('+1m').milliseconds()).toEqual(60_000)
  })

  test.each(['µs', 'μs', 'us'])('accepts the %s microsecond unit', unit => {
    expect(Duration.parse(`1000${unit}`).milliseconds()).toEqual(1)
  })

  test('floors sub-millisecond units', () => {
    expect(Duration.parse('1ns').milliseconds()).toEqual(0)
  })

  test.each(['', 'abc', '5'])('rejects %s, which has no unit', input => {
    expect(() => Duration.parse(input)).toThrow(/invalid duration/)
  })

  test('rejects an unknown unit', () => {
    expect(() => Duration.parse('5x')).toThrow(/bad unit x/)
  })
})

describe('Duration constructor', () => {
  test('copies another Duration', () => {
    expect(new Duration(new Duration('1m')).milliseconds()).toEqual(60_000)
  })

  test('takes a number of milliseconds', () => {
    expect(new Duration(1_234).milliseconds()).toEqual(1_234)
  })

  test('parses a string', () => {
    expect(new Duration('1m').milliseconds()).toEqual(60_000)
  })

  test('defaults to zero', () => {
    expect(new Duration().milliseconds()).toEqual(0)
  })

  test('rejects a non-finite number', () => {
    expect(() => new Duration(Infinity)).toThrow(/invalid duration/)
    expect(() => new Duration(NaN)).toThrow(/invalid duration/)
  })

  test('rejects an unsupported type', () => {
    expect(() => new Duration(true as unknown as number)).toThrow(/invalid duration/)
  })
})

describe('Duration static constructors', () => {
  test.each([
    [Duration.milliseconds(2), 2],
    [Duration.seconds(2), 2_000],
    [Duration.minutes(2), 120_000],
    [Duration.hours(2), 7_200_000],
    [Duration.days(2), 172_800_000],
    [Duration.weeks(2), 1_209_600_000],
    [Duration.microseconds(2_000), 2],
    [Duration.nanoseconds(2_000_000), 2]
  ])('builds the expected millisecond value', (duration, expected) => {
    expect(duration.milliseconds()).toEqual(expected)
  })

  test('exposes unit constants', () => {
    expect(Duration.millisecond.milliseconds()).toEqual(1)
    expect(Duration.second.milliseconds()).toEqual(1_000)
    expect(Duration.minute.milliseconds()).toEqual(60_000)
    expect(Duration.hour.milliseconds()).toEqual(3_600_000)
    expect(Duration.day.milliseconds()).toEqual(86_400_000)
    expect(Duration.week.milliseconds()).toEqual(604_800_000)
  })
})

describe('Duration unit accessors', () => {
  test('converts down to smaller units', () => {
    const d = new Duration('1s')

    expect(d.nanoseconds()).toEqual(1_000_000_000)
    expect(d.microseconds()).toEqual(1_000_000)
    expect(d.milliseconds()).toEqual(1_000)
  })

  test('floors when converting up to larger units', () => {
    const d = new Duration('1w')

    expect(d.seconds()).toEqual(604_800)
    expect(d.minutes()).toEqual(10_080)
    expect(d.hours()).toEqual(168)
    expect(d.days()).toEqual(7)
    expect(d.weeks()).toEqual(1)
  })
})

describe('Duration.toString', () => {
  test.each([
    [0, '0'],
    [1, '1ms'],
    [1_000, '1s'],
    [60_000, '1m'],
    [3_600_000, '1h'],
    [5_400_000, '1h30m'],
    [90_000, '1m30s'],
    [3_661_001, '1h1m1s1ms'],
    [-1_000, '-1s']
  ])('renders %s as %s', (ms, expected) => {
    expect(new Duration(ms).toString()).toEqual(expected)
  })
})

describe('Duration arithmetic and comparison', () => {
  test('valueOf returns milliseconds', () => {
    expect(new Duration('1m').valueOf()).toEqual(60_000)
    expect(Duration.valueOf('1m')).toEqual(60_000)
  })

  test('abs drops the sign', () => {
    expect(new Duration(-5).abs().milliseconds()).toEqual(5)
  })

  test('truncate rounds to the nearest multiple', () => {
    expect(new Duration('1m40s').truncate('1m').milliseconds()).toEqual(120_000)
    expect(new Duration('1m10s').truncate('1m').milliseconds()).toEqual(60_000)
  })

  test('compares durations', () => {
    const oneMinute = new Duration('1m')

    expect(oneMinute.isGreaterThan('30s')).toBe(true)
    expect(oneMinute.isGreaterThan('2m')).toBe(false)
    expect(oneMinute.isLessThan('2m')).toBe(true)
    expect(oneMinute.isLessThan('30s')).toBe(false)
    expect(oneMinute.isEqualTo('60s')).toBe(true)
    expect(oneMinute.isEqualTo('30s')).toBe(false)
  })

  test('adds, subtracts, multiplies and divides', () => {
    expect(Duration.add('1m', '30s').milliseconds()).toEqual(90_000)
    expect(Duration.subtract('1m', '30s').milliseconds()).toEqual(30_000)
    expect(Duration.multiply('1s', 2).milliseconds()).toEqual(2_000)
    expect(Duration.divide('1m', '30s')).toEqual(2)
  })
})

describe('Duration date helpers', () => {
  const epoch = new Date('2024-01-01T00:00:00.000Z')

  test('after and before shift a date', () => {
    expect(new Duration('1m').after(epoch)).toEqual(new Date('2024-01-01T00:01:00.000Z'))
    expect(new Duration('1m').before(epoch)).toEqual(new Date('2023-12-31T23:59:00.000Z'))
  })

  test('between measures the gap between two dates', () => {
    const later = new Date('2024-01-01T00:05:00.000Z')

    expect(Duration.between(epoch, later).milliseconds()).toEqual(300_000)
    expect(Duration.between(later, epoch).milliseconds()).toEqual(-300_000)
  })

  test('since and until are relative to now', () => {
    vi.useFakeTimers()
    vi.setSystemTime(epoch)

    const past = new Duration('1m').before(epoch)
    const future = new Duration('1m').after(epoch)

    expect(Duration.since(past).milliseconds()).toEqual(60_000)
    expect(Duration.until(future).milliseconds()).toEqual(60_000)

    vi.useRealTimers()
  })
})
