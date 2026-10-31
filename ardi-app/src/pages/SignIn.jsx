import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Zap, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { clsx } from 'clsx'

export default function SignIn() {
  const { login, loginAsDemo } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg glow-blue">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-blue">ARDI</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium tracking-wide">
            Autonomous Retail Decision Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="signin-email"
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
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
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

            {/* Submit */}
            <button
              id="signin-submit"
              type="submit"
              disabled={loading}
              className={clsx('btn-primary flex items-center justify-center gap-2 mt-2', loading && 'opacity-70 cursor-not-allowed')}
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
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
            id="signin-demo"
            onClick={handleDemo}
            disabled={loading}
            className="btn-demo flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            Login as Demo User
          </button>

          {/* Sign up link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
            >
              Create one
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
