import {Duration} from './duration.js'
import {Timer} from './timer.js'

describe(Timer.name, () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('expired', () => {
    test('is false before the expiry elapses', () => {
      const timer = new Timer(new Duration('1m'))

      vi.advanceTimersByTime(30_000)

      expect(timer.expired()).toBe(false)
    })

    test('is true after the expiry elapses', () => {
      const timer = new Timer(new Duration('1m'))

      vi.advanceTimersByTime(90_000)

      expect(timer.expired()).toBe(true)
    })

    test('is false at exactly the expiry, which is not yet greater than', () => {
      const timer = new Timer(new Duration('1m'))

      vi.advanceTimersByTime(60_000)

      expect(timer.expired()).toBe(false)
    })
  })

  describe('sleep', () => {
    test('resolves only once the duration has passed', async () => {
      const timer = new Timer(new Duration('1m'))
      const resolved = vi.fn()
      const sleeping = timer.sleep(new Duration('5s')).then(resolved)

      await vi.advanceTimersByTimeAsync(4_999)
      expect(resolved).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      await sleeping
      expect(resolved).toHaveBeenCalled()
    })
  })
})
