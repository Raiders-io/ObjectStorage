const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3333'

export default async function verifyToken(token: string): Promise<number | null> {
	try {
		const res = await fetch(`${AUTH_SERVICE_URL}/auth/verify`, {
			headers: { Authorization: `Bearer ${token}` },
		})
		if (!res.ok)
			return null
		const body = (await res.json()) as { data: { userId: number } }
		return body.data.userId
	} catch {
		return null
	}
}
