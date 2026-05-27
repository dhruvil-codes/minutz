'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
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

        <form onSubmit={handleSignUp} className="space-y-4">
          <Input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="bg-[#0A0A0F] border-[#1E1E2E] text-[#F8FAFC] placeholder:text-[#64748B]"
          />
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
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#6366F1' }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
