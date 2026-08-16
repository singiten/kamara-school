// services/fileUpload.js - File Upload Configuration

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ✅ Base upload directories
const BASE_UPLOAD_DIR = path.join(__dirname, '../uploads');
const RESOURCES_DIR = path.join(BASE_UPLOAD_DIR, 'resources');
const REPORT_CARDS_DIR = path.join(BASE_UPLOAD_DIR, 'report-cards');

// ✅ Create directories
ensureDirectoryExists(BASE_UPLOAD_DIR);
ensureDirectoryExists(RESOURCES_DIR);
ensureDirectoryExists(REPORT_CARDS_DIR);

// ✅ File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    // Video
    'video/mp4',
    'video/webm',
    // Text
    'text/plain',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

// ✅ Storage configuration for resources
const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create year/month subfolder
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const subDir = path.join(RESOURCES_DIR, String(year), String(month));
    ensureDirectoryExists(subDir);
    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-').substring(0, 50);
    cb(null, `${baseName}-${unique}${ext}`);
  },
});

// ✅ Multer instances
const uploadResource = multer({
  storage: resourceStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

// ✅ Storage for report cards
const reportCardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const subDir = path.join(REPORT_CARDS_DIR, String(year), String(month));
    ensureDirectoryExists(subDir);
    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-').substring(0, 50);
    cb(null, `report-${baseName}-${unique}${ext}`);
  },
});

const uploadReportCard = multer({
  storage: reportCardStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
  },
});

// ✅ Helper: Get file type from mime type
const getFileType = (mimeType) => {
  const types = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'image/gif': 'image',
    'video/mp4': 'video',
    'video/webm': 'video',
    'text/plain': 'other',
  };
  return types[mimeType] || 'other';
};

// ✅ Helper: Get file icon
const getFileIcon = (fileType) => {
  const icons = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📑',
    pptx: '📑',
    image: '🖼️',
    video: '🎬',
    link: '🔗',
  };
  return icons[fileType] || '📎';
};

// ✅ Helper: Get readable file size
const getReadableSize = (bytes) => {
  if (bytes === 0) return '0 KB';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

module.exports = {
  uploadResource,
  uploadReportCard,
  getFileType,
  getFileIcon,
  getReadableSize,
  RESOURCES_DIR,
  REPORT_CARDS_DIR,
};