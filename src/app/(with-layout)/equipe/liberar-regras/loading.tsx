import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div id="main" className="wrapper flex flex-1 items-center justify-center">
      <Loader2 className="text-primary size-12 animate-spin" />
    </div>
  )
}
