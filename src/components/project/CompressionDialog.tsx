import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { CompressionStrategy } from '../../api/documents'

interface CompressionDialogProps {
    isOpen: boolean
    onClose: () => void
    onCompress: (strategy: CompressionStrategy, options: { ocrEnabled: boolean }) => Promise<void>
    documentTitle: string
}

export default function CompressionDialog({
    isOpen,
    onClose,
    onCompress,
    documentTitle,
}: CompressionDialogProps) {
    const [strategy, setStrategy] = useState<CompressionStrategy>('text-only')
    const [ocrEnabled, setOcrEnabled] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        setLoading(true)
        try {
            await onCompress(strategy, { ocrEnabled })
            onClose()
        } catch (error) {
            // Error handling is done in parent
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Dökümanı Sıkıştır">
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        <span className="font-medium text-gray-900">{documentTitle}</span> için sıkıştırma
                        stratejisi seçin.
                    </p>

                    <div className="space-y-4">
                        <div
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${strategy === 'text-only'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => setStrategy('text-only')}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">Metin Bazlı Sıkıştırma</span>
                                {strategy === 'text-only' && (
                                    <span className="text-blue-600">✓</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">
                                Metin içeriğini analiz eder ve gereksiz kısımları çıkararak özetler.
                                Hızlı ve etkilidir.
                            </p>
                        </div>

                        <div
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${strategy === 'optical-v1'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => setStrategy('optical-v1')}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">Optik Sıkıştırma (V1)</span>
                                {strategy === 'optical-v1' && (
                                    <span className="text-blue-600">✓</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">
                                Görsel düzeni ve yapıyı koruyarak sıkıştırır. Karmaşık dökümanlar
                                için idealdir.
                            </p>
                        </div>
                    </div>
                </div>

                {strategy === 'optical-v1' && (
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="ocr"
                            checked={ocrEnabled}
                            onChange={(e) => setOcrEnabled(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="ocr" className="text-sm text-gray-700">
                            OCR (Optik Karakter Tanıma) kullan
                        </label>
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Başlatılıyor...' : 'Sıkıştırmayı Başlat'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
