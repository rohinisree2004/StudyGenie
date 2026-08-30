import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the materials directory exists
const uploadDir = path.resolve(__dirname, '../../uploads/materials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate clean, collision-free filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(sanitizedOriginal);
    const baseName = path.basename(sanitizedOriginal, ext).substring(0, 40);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File Type Filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf',
    '.doc',
    '.docx',
    '.ppt',
    '.pptx',
    '.txt',
    '.md',
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type (${ext}). Allowed formats: PDF, Word (doc, docx), PowerPoint (ppt, pptx), Text (txt, md), and Images (png, jpg, webp).`
      ),
      false
    );
  }
};

// Multer Upload Instance (25MB Limit)
export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 Megabytes
  },
  fileFilter,
});

/**
 * Helper to determine material fileType enum from filename or mimetype
 */
export const determineFileType = (filename = '', mimetype = '') => {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf' || mimetype.includes('pdf')) return 'pdf';
  if (ext === '.doc' || ext === '.docx' || mimetype.includes('word')) return 'docx';
  if (ext === '.ppt' || ext === '.pptx' || mimetype.includes('presentation')) return 'pptx';
  if (ext === '.txt' || ext === '.md' || mimetype.includes('text')) return 'txt';
  if (
    ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext) ||
    mimetype.startsWith('image/')
  ) {
    return 'image';
  }
  return 'other';
};
