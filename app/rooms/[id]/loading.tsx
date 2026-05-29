import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f9f6f2] text-[#4e4d4c] font-sans">
      <Loader2 className="w-8 h-8 text-[#141414] animate-spin mb-4" />
      <h3 className="text-[16px] font-semibold text-[#141414] tracking-tight">Entering Study Room...</h3>
      <p className="text-[13px] text-[#737373] mt-1">Preparing your workspace</p>
    </div>
  )
}
