import env from '#start/env'

export default async function verifyToken(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${env.get('AUTH_SERVICE_URL')}api/v1/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const body = (await res.json()) as { data: { userId: string } }
    return body.data.userId
  } catch {
    return null
  }
}
