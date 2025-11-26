import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Toaster, toast } from 'sonner'
import { GradientButton } from '../components/ui/GradientButton'
import Input from '../components/ui/Input'
import { motion } from 'framer-motion'
import { User, Mail, Lock, ArrowRight } from 'lucide-react'

export function Register() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signUp(email, password, fullName)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Account created successfully! You can now sign in.')
      }
    } catch (error) {
      toast.error('Error creating account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background Effects matching Landing Page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/20 rounded-full blur-[100px] opacity-30" />
      </div>

      <Toaster position="top-right" theme="dark" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 p-4"
      >
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="text-center mb-8">
            <Link to="/" className="inline-block group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
              >
                <span className="text-white font-bold text-2xl">A1</span>
              </motion.div>
            </Link>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
            <p className="text-gray-400">Join the future of AI automation</p>
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
              className="bg-black/20 border-white/10 focus:border-indigo-500/50 rounded-xl text-white placeholder:text-gray-500"
            />

            <Input
              label="Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              className="bg-black/20 border-white/10 focus:border-indigo-500/50 rounded-xl text-white placeholder:text-gray-500"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              className="bg-black/20 border-white/10 focus:border-indigo-500/50 rounded-xl text-white placeholder:text-gray-500"
            />

            <GradientButton
              type="submit"
              isLoading={loading}
              fullWidth
              size="lg"
              icon={ArrowRight}
            >
              Create Account
            </GradientButton>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-premium-muted text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}