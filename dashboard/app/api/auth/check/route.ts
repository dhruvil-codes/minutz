import { createServerClient } from "@supabase/ssr"
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Route handlers can be read-only in some contexts; auth still works without writes.
            }
          },
        },
      }
    )
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user) {
      return NextResponse.json({
        authenticated: true,
        user: { email: session.user.email, id: session.user.id }
      })
    }
    return NextResponse.json({ authenticated: false })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
