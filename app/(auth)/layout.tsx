export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] dark:bg-[#0B0D12] p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4F46E5] dark:text-[#6366F1]">
            Team Grid
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Professional team collaboration platform
          </p>
        </div>
        <div className="bg-white dark:bg-[#111827] p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
          {children}
        </div>
      </div>
    </div>
  )
}
