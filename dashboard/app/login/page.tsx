'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
      <div
        className="w-full max-w-sm p-8 rounded-xl"
        style={{ background: '#13131A', border: '1px solid #1E1E2E' }}
      >
        <div className="text-center mb-8">
          <p className="text-2xl font-bold" style={{ color: '#6366F1' }}>⚡ Minutz</p>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Invisible AI Meeting Intelligence</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="bg-[#0A0A0F] border-[#1E1E2E] text-[#F8FAFC] placeholder:text-[#64748B]"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="bg-[#0A0A0F] border-[#1E1E2E] text-[#F8FAFC] placeholder:text-[#64748B]"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full font-semibold"
            style={{ background: '#6366F1', color: '#fff' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <Button
          onClick={handleGoogle}
          variant="outline"
          className="w-full mt-3 border-[#1E1E2E] text-[#F8FAFC] bg-transparent hover:bg-[#1E1E2E]"
        >
          Continue with Google
        </Button>

        <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
          No account?{' '}
          <a href="/signup" style={{ color: '#6366F1' }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
