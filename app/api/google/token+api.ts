export async function POST(request: Request): Promise<Response> {
  try {
    const { code, redirect_uri, code_verifier } = await request.json()

    if (!code || !redirect_uri) {
      return Response.json({ error: 'missing_params' }, { status: 400 })
    }

    const clientId     = process.env.GOOGLE_CLIENT_ID ?? ''
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? ''

    if (!clientSecret) {
      return Response.json({ error: 'server_not_configured' }, { status: 500 })
    }

    const params = new URLSearchParams({
      code,
      client_id:    clientId,
      client_secret: clientSecret,
      redirect_uri,
      grant_type:   'authorization_code',
      ...(code_verifier ? { code_verifier } : {}),
    })

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    })

    const data = await res.json()

    return Response.json(data, { status: res.status })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
