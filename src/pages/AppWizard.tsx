import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { WizardStepper } from '../components/WizardStepper'
import { useApi } from '../hooks/useApi'
import { Toaster, toast } from 'sonner'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'

const steps = [
  'Hedef Kullanıcı',
  'Temel Özellikler', 
  'Para Kazanma Modeli',
  'Teknik Karmaşıklık'
]

export function AppWizard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { apiCall } = useApi()
  const projectId = searchParams.get('project')
  
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState({
    targetUser: '',
    userPersona: '',
    coreFeatures: [] as string[],
    monetization: '',
    pricingModel: '',
    techComplexity: '',
    scaleExpectation: ''
  })

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = async () => {
    if (!projectId) {
      toast.error('Proje ID bulunamadı')
      return
    }

    try {
      const result = await apiCall('/wizards/app', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          answers
        })
      })

      if (result.success) {
        toast.success('App Wizard başarıyla tamamlandı!')
        navigate('/dashboard')
      } else {
        toast.error(result.error || 'Kayıt sırasında hata oluştu')
      }
    } catch (error) {
      toast.error('Kayıt sırasında hata oluştu')
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hedef Kullanıcı Kim?
              </label>
              <textarea
                value={answers.targetUser}
                onChange={(e) => setAnswers({ ...answers, targetUser: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Örn: Küçük işletme sahipleri, freelance tasarımcılar..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Personası
              </label>
              <textarea
                value={answers.userPersona}
                onChange={(e) => setAnswers({ ...answers, userPersona: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Hedef kullanıcınızın demografik bilgileri, problemleri, hedefleri..."
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temel Özellikler (virgülle ayırın)
              </label>
              <textarea
                value={answers.coreFeatures.join(', ')}
                onChange={(e) => setAnswers({ 
                  ...answers, 
                  coreFeatures: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Kullanıcı yönetimi, ödeme sistemi, raporlama..."
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para Kazanma Modeli
              </label>
              <select
                value={answers.monetization}
                onChange={(e) => setAnswers({ ...answers, monetization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                <option value="subscription">Abonelik</option>
                <option value="one_time">Tek Seferlik Ödeme</option>
                <option value="freemium">Freemium</option>
                <option value="ads">Reklam</option>
                <option value="commission">Komisyon</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiyatlandırma Modeli
              </label>
              <textarea
                value={answers.pricingModel}
                onChange={(e) => setAnswers({ ...answers, pricingModel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Aylık/ylık fiyatlar, paketler, özellikler..."
              />
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teknik Karmaşıklık Seviyesi
              </label>
              <select
                value={answers.techComplexity}
                onChange={(e) => setAnswers({ ...answers, techComplexity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                <option value="simple">Basit (CRUD uygulaması)</option>
                <option value="moderate">Orta (3. parti entegrasyonları)</option>
                <option value="complex">Karmaşık (AI/ML, real-time)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ölçek Beklentisi
              </label>
              <select
                value={answers.scaleExpectation}
                onChange={(e) => setAnswers({ ...answers, scaleExpectation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                <option value="small">Küçük (100-1000 kullanıcı)</option>
                <option value="medium">Orta (1000-10000 kullanıcı)</option>
                <option value="large">Büyük (10000+ kullanıcı)</option>
              </select>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">App Wizard</h1>
          <p className="text-gray-600">Uygulamanız için temel yapı taşlarını belirleyin</p>
        </div>

        <div className="mb-8">
          <WizardStepper 
            currentStep={currentStep} 
            totalSteps={steps.length} 
            stepTitles={steps}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderStepContent()}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </button>
          
          <div className="flex space-x-3">
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                İleri
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Kaydet ve Bitir
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}