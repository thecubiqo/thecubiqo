'use client'

/**
 * Job Hunt Setup Page
 * Initial configuration for job hunt mode
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CreateJobHuntProfileRequest, WorkType, JobType } from '@/types/job-hunt'

export default function JobHuntSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState<CreateJobHuntProfileRequest>({
    target_roles: [],
    skills: [],
    years_of_experience: 0,
    work_type: [],
    job_types: [],
    target_locations: [],
  })

  // Temporary input states
  const [roleInput, setRoleInput] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [locationInput, setLocationInput] = useState('')

  const handleAddRole = () => {
    if (roleInput.trim() && !formData.target_roles.includes(roleInput.trim())) {
      setFormData({
        ...formData,
        target_roles: [...formData.target_roles, roleInput.trim()]
      })
      setRoleInput('')
    }
  }

  const handleRemoveRole = (role: string) => {
    setFormData({
      ...formData,
      target_roles: formData.target_roles.filter(r => r !== role)
    })
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      })
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    })
  }

  const handleAddLocation = () => {
    const locations = formData.target_locations || []
    if (locationInput.trim() && !locations.includes(locationInput.trim())) {
      setFormData({
        ...formData,
        target_locations: [...locations, locationInput.trim()]
      })
      setLocationInput('')
    }
  }

  const handleRemoveLocation = (location: string) => {
    const locations = formData.target_locations || []
    setFormData({
      ...formData,
      target_locations: locations.filter(l => l !== location)
    })
  }

  const toggleWorkType = (type: WorkType) => {
    if (formData.work_type.includes(type)) {
      setFormData({
        ...formData,
        work_type: formData.work_type.filter(t => t !== type)
      })
    } else {
      setFormData({
        ...formData,
        work_type: [...formData.work_type, type]
      })
    }
  }

  const toggleJobType = (type: JobType) => {
    if (formData.job_types.includes(type)) {
      setFormData({
        ...formData,
        job_types: formData.job_types.filter(t => t !== type)
      })
    } else {
      setFormData({
        ...formData,
        job_types: [...formData.job_types, type]
      })
    }
  }

  const handleSubmit = async () => {
    setError('')

    // Validation
    if (formData.target_roles.length === 0) {
      setError('Please add at least one target role')
      return
    }

    if (formData.skills.length === 0) {
      setError('Please add at least one skill')
      return
    }

    if (formData.work_type.length === 0) {
      setError('Please select at least one work type')
      return
    }

    if (formData.job_types.length === 0) {
      setError('Please select at least one job type')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/job-hunt/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create profile')
      }

      // Success - redirect to dashboard
      router.push('/job-hunt')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="font-bold tracking-widest text-sm">CubiQo™</span>
          </Link>
          <Link href="/job-hunt" className="text-sm hover:text-orange-500 transition-colors">
            Back
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Set Up Your Job Hunt Profile</h1>
            <p className="text-white/60">Tell us about your job preferences</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* Target Roles */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Target Roles</h2>
              <p className="text-sm text-white/60 mb-4">What job titles are you interested in?</p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRole()}
                  placeholder="e.g., Software Engineer"
                  className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-white/10 focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={handleAddRole}
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.target_roles.map((role) => (
                  <span key={role} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg flex items-center gap-2">
                    {role}
                    <button onClick={() => handleRemoveRole(role)} className="hover:text-blue-300">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Skills</h2>
              <p className="text-sm text-white/60 mb-4">What are your key skills?</p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="e.g., React, TypeScript"
                  className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-white/10 focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg flex items-center gap-2">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="hover:text-purple-300">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Work Type */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Work Type Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['remote', 'hybrid', 'onsite'] as WorkType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleWorkType(type)}
                    className={`p-4 rounded-lg border transition-all ${formData.work_type.includes(type)
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-zinc-800 border-white/10 hover:border-white/30'
                      }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Type */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Job Type Preferences</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['full-time', 'part-time', 'contract', 'internship'] as JobType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleJobType(type)}
                    className={`p-4 rounded-lg border transition-all ${formData.job_types.includes(type)
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-zinc-800 border-white/10 hover:border-white/30'
                      }`}
                  >
                    {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Years of Experience</h2>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-white/10 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Locations (Optional) */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Preferred Locations (Optional)</h2>
              <p className="text-sm text-white/60 mb-4">Where would you like to work?</p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                  placeholder="e.g., San Francisco, CA"
                  className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-white/10 focus:border-orange-500 focus:outline-none"
                />
                <button
                  onClick={handleAddLocation}
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(formData.target_locations || []).map((location) => (
                  <span key={location} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg flex items-center gap-2">
                    {location}
                    <button onClick={() => handleRemoveLocation(location)} className="hover:text-green-300">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Salary Range (Optional) */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold mb-4">Salary Range (Optional)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Minimum</label>
                  <input
                    type="number"
                    value={formData.salary_min || ''}
                    onChange={(e) => setFormData({ ...formData, salary_min: parseInt(e.target.value) || undefined })}
                    placeholder="50000"
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-white/10 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Maximum</label>
                  <input
                    type="number"
                    value={formData.salary_max || ''}
                    onChange={(e) => setFormData({ ...formData, salary_max: parseInt(e.target.value) || undefined })}
                    placeholder="150000"
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-white/10 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all font-semibold text-lg shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Profile...' : 'Create Profile & Start Job Hunt'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
