export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
      <p className="font-semibold">Error</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  )
}
