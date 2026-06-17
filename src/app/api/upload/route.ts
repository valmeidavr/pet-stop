import { put } from '@vercel/blob'
import { requireUser } from '@/lib/session'

export async function POST(request: Request): Promise<Response> {
  await requireUser()
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'Arquivo ausente' }, { status: 400 })
  }
  const ext = file.name.split('.').pop() || 'jpg'
  const blob = await put(`fotos/${crypto.randomUUID()}.${ext}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return Response.json({ url: blob.url })
}
