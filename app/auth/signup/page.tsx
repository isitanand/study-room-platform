'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signupAction, type AuthState } from '@/app/auth/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'

const initialState: AuthState = {}

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initialState)

  return (
    <div className="min-h-screen bg-[#f9f6f2] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Elegant Organic Blurred Highlights */}
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-[#0A7C6E]/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-[#000015]/5 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-[5px] border border-[#e7e7e7] mb-3.5 text-[#141414] bg-white">
            <svg
              className="w-6 h-6 stroke-[1.5] text-[#262626]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h1 className="text-heading-sm font-semibold text-[#141414] tracking-tight">StudyRoom</h1>
          <p className="text-[#737373] text-[13px] mt-1">Start your focused study journey</p>
        </div>

        <Card className="border border-[#e7e7e7] bg-white shadow-none rounded-[10px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-heading-sm text-[#141414] font-semibold tracking-tight">Create your account</CardTitle>
            <CardDescription className="text-[#4e4d4c] text-[13px] tracking-normal font-normal">
              Join thousands of students studying together
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={formAction} className="space-y-4">
              {/* Error message */}
              {state.error && (
                <div className="flex items-start gap-2.5 rounded-[5px] border border-[#cc3737]/20 bg-[#f4eee5] px-3.5 py-3 text-[#cc3737] text-[13px] font-normal">
                  <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-[#cc3737]" />
                  <span className="leading-relaxed">{state.error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-[#4e4d4c] text-[13px] font-medium">
                    Full name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="bg-white border border-[#e7e7e7] text-[#141414] placeholder:text-[#a1a1a1] focus-visible:ring-1 focus-visible:ring-[#0A7C6E] focus-visible:border-[#141414] rounded-[5px] h-11 text-[14px] font-normal shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-[#4e4d4c] text-[13px] font-medium">
                    Username <span className="text-[#cc3737] font-bold">*</span>
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="janedoe"
                    required
                    autoComplete="username"
                    className="bg-white border border-[#e7e7e7] text-[#141414] placeholder:text-[#a1a1a1] focus-visible:ring-1 focus-visible:ring-[#0A7C6E] focus-visible:border-[#141414] rounded-[5px] h-11 text-[14px] font-normal shadow-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#4e4d4c] text-[13px] font-medium">
                  Email <span className="text-[#cc3737] font-bold">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="bg-white border border-[#e7e7e7] text-[#141414] placeholder:text-[#a1a1a1] focus-visible:ring-1 focus-visible:ring-[#0A7C6E] focus-visible:border-[#141414] rounded-[5px] h-11 text-[14px] font-normal shadow-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#4e4d4c] text-[13px] font-medium">
                  Password <span className="text-[#cc3737] font-bold">*</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                  className="bg-white border border-[#e7e7e7] text-[#141414] placeholder:text-[#a1a1a1] focus-visible:ring-1 focus-visible:ring-[#0A7C6E] focus-visible:border-[#141414] rounded-[5px] h-11 text-[14px] font-normal shadow-none"
                />
              </div>

              <button
                id="signup-submit"
                type="submit"
                disabled={pending}
                className="btn-evernote-primary w-full h-11 text-[14px] mt-3.5 justify-center cursor-pointer shadow-none font-semibold"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-[13px] text-[#4e4d4c]">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-[#141414] font-semibold hover:underline ml-1"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

