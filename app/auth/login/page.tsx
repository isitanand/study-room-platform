'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction, type AuthState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Loader2, AlertCircle } from 'lucide-react'

const initialState: AuthState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[300px] bg-indigo-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-4 shadow-lg shadow-violet-900/20">
            <BookOpen className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">StudyRoom</h1>
          <p className="text-zinc-500 text-sm mt-1">Focus together, achieve more</p>
        </div>

        <Card className="bg-zinc-900/80 border-zinc-800 shadow-2xl shadow-black/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white">Welcome back</CardTitle>
            <CardDescription className="text-zinc-400">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={formAction} className="space-y-4">
              {/* Error message */}
              {state.error && (
                <div className="flex items-start gap-2.5 rounded-lg bg-red-950/50 border border-red-900/50 px-3.5 py-3 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300 text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300 text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-zinc-800/60 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 h-11"
                />
              </div>

              <Button
                id="login-submit"
                type="submit"
                disabled={pending}
                className="w-full h-11 bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all duration-200 shadow-lg shadow-violet-900/30 mt-2"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/signup"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
