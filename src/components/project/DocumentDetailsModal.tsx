import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { CompressionDetails } from '../../api/documents'

interface DocumentDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    details: CompressionDetails | null
    loading: boolean
}

export default function DocumentDetailsModal({
    isOpen,
    onClose,
    details,
    loading,
}: DocumentDetailsModalProps) {
    if (!details && !loading) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sıkıştırma Detayları" size="lg">
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : details ? (
                <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">Strateji</div>
                            <div className="font-medium text-gray-900 capitalize">
                                {details.strategy === 'text-only' ? 'Metin Bazlı' : 'Optik V1'}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">Token Tasarrufu</div>
                            <div className="font-medium text-green-600">
                                {details.tokenSavingEstimate.toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">Ham Token</div>
                            <div className="font-medium text-gray-900">{details.rawTokenCount}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">Sıkıştırılmış</div>
                            <div className="font-medium text-blue-600">
                                {details.compressedTokenCount}
                            </div>
                        </div>
                    </div>

                    {/* Segments List */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Sıkıştırılmış Parçalar</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {details.segments.map((segment, index) => (
                                <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                #{segment.segmentIndex + 1}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Sayfa: {segment.pageNumbers.join(', ')}
                                            </span>
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">
                                            ~{segment.estimatedTokens} token
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 font-mono bg-gray-50 p-2 rounded">
                                        {segment.preview}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={onClose}>Kapat</Button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">Detaylar bulunamadı</div>
            )}
        </Modal>
    )
}
