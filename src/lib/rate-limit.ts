import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1m'),
})

export async function checkRateLimit(ip: string): Promise<boolean> {
    const { success } = await ratelimit.limit(ip)
    return success
}
