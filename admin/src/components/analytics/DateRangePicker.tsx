'use client'

import { useState, useEffect } from 'react'

interface DateRangePickerProps {
  onChange: (range: { start: Date; end: Date }) => void
  defaultRange?: '7d' | '30d' | '90d' | 'custom'
}

export default function DateRangePicker({ onChange, defaultRange = '30d' }: DateRangePickerProps) {
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d' | 'custom'>(defaultRange)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    const end = new Date()
    let start = new Date()
    
    if (defaultRange === '7d') {
      start.setDate(end.getDate() - 7)
    } else if (defaultRange === '30d') {
      start.setDate(end.getDate() - 30)
    } else if (defaultRange === '90d') {
      start.setDate(end.getDate() - 90)
    }
    
    onChange({ start, end })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRangeChange = (range: '7d' | '30d' | '90d' | 'custom') => {
    setSelectedRange(range)
    
    const end = new Date()
    let start = new Date()
    
    if (range === '7d') {
      start.setDate(end.getDate() - 7)
    } else if (range === '30d') {
      start.setDate(end.getDate() - 30)
    } else if (range === '90d') {
      start.setDate(end.getDate() - 90)
    } else if (range === 'custom' && customStart && customEnd) {
      start = new Date(customStart)
      const customEndDate = new Date(customEnd)
      end.setTime(customEndDate.getTime())
    }
    
    onChange({ start, end })
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 min-w-0">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleRangeChange('7d')}
          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            selectedRange === '7d'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => handleRangeChange('30d')}
          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            selectedRange === '30d'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          30 Days
        </button>
        <button
          onClick={() => handleRangeChange('90d')}
          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            selectedRange === '90d'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          90 Days
        </button>
        <button
          onClick={() => setSelectedRange('custom')}
          className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            selectedRange === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Custom
        </button>
      </div>
      {selectedRange === 'custom' && (
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="date"
            value={customStart}
            onChange={(e) => {
              setCustomStart(e.target.value)
              if (customEnd) {
                onChange({ start: new Date(e.target.value), end: new Date(customEnd) })
              }
            }}
            className="px-2 sm:px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs sm:text-sm min-w-0"
          />
          <span className="text-slate-400 text-xs sm:text-sm whitespace-nowrap">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => {
              setCustomEnd(e.target.value)
              if (customStart) {
                onChange({ start: new Date(customStart), end: new Date(e.target.value) })
              }
            }}
            className="px-2 sm:px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs sm:text-sm min-w-0"
          />
        </div>
      )}
    </div>
  )
}

