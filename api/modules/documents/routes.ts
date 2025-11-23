import { Router } from 'express'
import multer from 'multer'
import { authenticateToken } from '../../middleware/auth.js'
import {
    uploadDocumentHandler,
    listDocumentsHandler,
    getDocumentHandler,
    deleteDocumentHandler,
    getDocumentChunksHandler,
    reprocessDocumentHandler,
} from './controller.js'

const router = Router()

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'text/markdown',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/tiff',
            'image/bmp',
        ]

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`))
        }
    },
})

// All routes require authentication
router.use(authenticateToken)

// Document routes
router.post('/upload', upload.single('file'), uploadDocumentHandler)
router.get('/', listDocumentsHandler)
router.get('/:documentId', getDocumentHandler)
router.delete('/:documentId', deleteDocumentHandler)
router.get('/:documentId/chunks', getDocumentChunksHandler)
router.post('/:documentId/reprocess', reprocessDocumentHandler)

export default router
