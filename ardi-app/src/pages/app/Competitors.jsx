import React from 'react'
import { Swords } from 'lucide-react'

export default function Competitors() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <Swords className="w-8 h-8 text-orange-400" />
      </div>
      <h1 className="text-2xl font-bold text-white">Competitors & Events</h1>
      <p className="text-slate-500 text-sm">Competitor pricing intelligence and local event tracking will appear here.</p>
      <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
        Coming soon
      </span>
    </div>
  )
}
