```
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Toaster, toast } from 'sonner'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { motion } from 'framer-motion'
import { User, Mail, Lock } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[100px]" />
      </div>

      <Toaster position="top-right" theme="dark" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10 p-4"
      >
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-white/10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <img src="/src/assets/logo.png" alt="Logo" className="w-10 h-10 brightness-0 invert" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Hesap Oluştur</h2>
            <p className="text-gray-400">Ayazma ONE dünyasına katılın</p>
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
            />

            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            
            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25"
            >
              {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-700/50 text-center">
            <p className="text-gray-400 text-sm">
              Zaten hesabınız var mı?{' '}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
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
```