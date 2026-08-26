import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] dark:bg-[#0B0D12]">
      <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}
