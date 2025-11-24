import { useState, useEffect } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import Alert from '../ui/Alert'
import CompressionDialog from './CompressionDialog'
import DocumentDetailsModal from './DocumentDetailsModal'
import {
    getProjectDocuments,
    uploadDocument,
    deleteDocument,
    compressDocument,
    getCompressionDetails,
    type ProjectDocument,
    type CompressionStrategy,
    type CompressionDetails,
} from '../../api/documents'

interface DocumentsTabProps {
    projectId: string
}

export default function DocumentsTab({ projectId }: DocumentsTabProps) {
    const [documents, setDocuments] = useState<ProjectDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [title, setTitle] = useState('')

    // Compression State
    const [compressDialogDoc, setCompressDialogDoc] = useState<ProjectDocument | null>(null)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [selectedDetails, setSelectedDetails] = useState<CompressionDetails | null>(null)
    const [loadingDetails, setLoadingDetails] = useState(false)

    useEffect(() => {
        loadDocuments()
    }, [projectId])

    const loadDocuments = async () => {
        setLoading(true)
        setError(null)
        try {
            const docs = await getProjectDocuments(projectId)
            setDocuments(docs)
        } catch (e: any) {
            setError(e?.message || 'Dökümanlar yüklenemedi')
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            if (!title) {
                setTitle(file.name.replace(/\.[^/.]+$/, ''))
            }
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        setUploading(true)
        setUploadError(null)
        try {
            await uploadDocument(projectId, selectedFile, title)
            setSelectedFile(null)
            setTitle('')
            await loadDocuments()
        } catch (e: any) {
            setUploadError(e?.message || 'Yükleme başarısız')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (documentId: string) => {
        if (!confirm('Bu dökümanı silmek istediğinizden emin misiniz?')) return

        try {
            await deleteDocument(projectId, documentId)
            await loadDocuments()
        } catch (e: any) {
            setError(e?.message || 'Silme başarısız')
        }
    }

    const handleCompress = async (
        strategy: CompressionStrategy,
        options: { ocrEnabled: boolean }
    ) => {
        if (!compressDialogDoc) return

        try {
            await compressDocument(projectId, compressDialogDoc.id, strategy, options)
            await loadDocuments() // Refresh to show updated status
        } catch (e: any) {
            setError(e?.message || 'Sıkıştırma başlatılamadı')
        }
    }

    const handleViewDetails = async (documentId: string) => {
        setDetailsModalOpen(true)
        setLoadingDetails(true)
        setSelectedDetails(null)
        try {
            const details = await getCompressionDetails(projectId, documentId)
            setSelectedDetails(details)
        } catch (e: any) {
            // Error handled in modal
        } finally {
            setLoadingDetails(false)
        }
    }

    const getStatusBadge = (status: ProjectDocument['processing_status']) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
        }
        const labels = {
            pending: 'Bekliyor',
            processing: 'İşleniyor',
            completed: 'Hazır',
            failed: 'Hata',
        }
        return (
            <span className={`px-2 py-1 rounded-xs font-medium ${badges[status]}`}>
                {labels[status]}
            </span>
        )
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <Card>
                <div className="text-lg font-semibold mb-4">Yeni Döküman Yükle</div>
                {uploadError && <Alert variant="error">{uploadError}</Alert>}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Döküman Başlığı (Opsiyonel)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Döküman başlığı"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dosya Seç (PDF, DOCX, TXT, MD)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.docx,.doc,.txt,.md"
                            onChange={handleFileSelect}
                            className="w-full"
                        />
                        {selectedFile && (
                            <div className="mt-2 text-sm text-gray-600">
                                Seçili: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="w-full md:w-auto"
                    >
                        {uploading ? 'Yükleniyor...' : 'Yükle'}
                    </Button>
                </div>
            </Card>

            {/* Documents List */}
            <Card>
                <div className="text-lg font-semibold mb-4">Dökümanlar</div>

                {loading && <Spinner />}
                {error && <Alert variant="error">{error}</Alert>}

                {!loading && documents.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        Henüz döküman yüklenmemiş
                    </div>
                )}

                {!loading && documents.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Başlık
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tür
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Durum
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tarih
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {doc.title}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {doc.mime_type.split('/')[1]?.toUpperCase() || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {getStatusBadge(doc.processing_status)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {doc.processing_status === 'completed' && (
                                                <>
                                                    <button
                                                        onClick={() => setCompressDialogDoc(doc)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Sıkıştır
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewDetails(doc.id)}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        Detaylar
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Sil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Dialogs */}
            {compressDialogDoc && (
                <CompressionDialog
                    isOpen={!!compressDialogDoc}
                    onClose={() => setCompressDialogDoc(null)}
                    onCompress={handleCompress}
                    documentTitle={compressDialogDoc.title}
                />
            )}

            <DocumentDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                details={selectedDetails}
                loading={loadingDetails}
            />
        </div>
    )
}
