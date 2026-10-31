import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Zap, Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { clsx } from 'clsx'

export default function SignUp() {
  const { login, loginAsDemo } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    login(form.email, form.password)
    navigate('/app/decision-hub')
  }

  const handleDemo = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    loginAsDemo()
    navigate('/app/decision-hub')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 mb-4 shadow-lg glow-purple">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-purple">ARDI</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium tracking-wide">
            Autonomous Retail Decision Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-semibold text-white mb-1">Create your account</h2>
          <p className="text-slate-400 text-sm mb-6">Join ARDI to start optimizing your retail decisions</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  className="input-field pl-10"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="input-field pl-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="input-field pl-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className={clsx(
                'w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500',
                'text-white font-semibold py-3 px-6 rounded-lg',
                'transition-all duration-300 ease-in-out',
                'shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:shadow-xl',
                'active:scale-[0.98] flex items-center justify-center gap-2 mt-2',
                loading && 'opacity-70 cursor-not-allowed',
              )}
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Demo login */}
          <button
            id="signup-demo"
            onClick={handleDemo}
            disabled={loading}
            className="btn-demo flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            Login as Demo User
          </button>

          {/* Sign in link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          © 2026 ARDI · Powered by AI
        </p>
      </div>
    </div>
  )
}
