import { validProgress } from './store'
import type { Activity, Progress } from './types'
/** Optional integration boundary. Prototype rewards never become trusted server rewards. */
export class DjangoGameApi {
  constructor(private baseUrl: string) {}
  private async request(path: string, init: RequestInit = {}) {
    const csrf = document.cookie
      .split('; ')
      .find((c) => c.startsWith('csrftoken='))
      ?.split('=')
      .slice(1)
      .join('=')
    const response = await fetch(this.baseUrl.replace(/\/$/, '') + path, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRFToken': decodeURIComponent(csrf) } : {}),
        ...init.headers,
      },
    })
    if (!response.ok)
      throw new Error(`Game service returned ${response.status}`)
    return response.json()
  }
  async progress(): Promise<Progress> {
    const value = await this.request('/api/game/progress/')
    if (!validProgress(value)) throw Error('Invalid progress response')
    return value
  }
  async activity(activity: Activity) {
    return this.request('/api/game/activities/', {
      method: 'POST',
      headers: { 'Idempotency-Key': activity.id },
      body: JSON.stringify({
        id: activity.id,
        kind: activity.kind,
        animal_id: activity.animalId,
        client_timestamp: activity.at,
      }),
    })
  }
}
