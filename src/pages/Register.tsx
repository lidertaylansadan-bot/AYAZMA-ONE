import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Toaster, toast } from 'sonner'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { motion } from 'framer-motion'
import { User, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'

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
        toast.success('Kayıt başarılı! Giriş yapabilirsiniz.')
      }
    } catch (error) {
      toast.error('Kayıt olurken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-premium-bg relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] rounded-full bg-indigo-600/10 blur-[80px] animate-float" />
      </div>

      <Toaster position="top-right" theme="dark" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10 p-4"
      >
        <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-glass-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 relative group"
            >
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src="/src/assets/logo.png" alt="Logo" className="w-12 h-12 brightness-0 invert relative z-10" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Hesap Oluştur</h2>
            <p className="text-premium-muted">Ayazma ONE dünyasına katılın</p>
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            <Input
              label="Tam Adınız"
              type="text"
              placeholder="Adınız Soyadınız"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
              className="bg-black/20 border-white/10 focus:border-indigo-500/50 rounded-xl"
            />

            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              className="bg-black/20 border-white/10 focus:border-indigo-500/50 rounded-xl"
            />

            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              className="bg-black/20 border-white/10 focus:border-indigo-500/50 rounded-xl"
            />

            <Button
              type="submit"
              loading={loading}
              variant="glow"
              className="w-full py-3 rounded-xl text-lg font-semibold shadow-lg shadow-indigo-500/25"
              icon={ArrowRight}
              iconPosition="right"
            >
              Kayıt Ol
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-premium-muted text-sm">
              Zaten hesabınız var mı?{' '}
              <Link
                to="/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}