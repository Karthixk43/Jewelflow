const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const usingCloudStorage = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Resolve upload dir relative to the backend folder (not the process CWD),
// so images work no matter where the server is started from.
const envDir = process.env.UPLOAD_DIR || './uploads';
const uploadDir = path.isAbsolute(envDir) ? envDir : path.resolve(__dirname, '../../', envDir);
const productImagesDir = path.join(uploadDir, 'products');
const logosDir = path.join(uploadDir, 'logos');

if (!usingCloudStorage) {
  [uploadDir, productImagesDir, logosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

const storage = usingCloudStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        // Route by field name: 'logo' field → logos dir, everything else → products dir
        const dir = file.fieldname === 'logo' ? logosDir : productImagesDir;
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
      }
    });

// File filter — accept any photo format (JPEG, PNG, WebP, GIF, HEIC, BMP, AVIF...)
// The frontend converts everything to optimized JPEG before upload anyway.
const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload a photo.'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// Delete file utility
const deleteFile = (filepath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filepath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports = {
  upload,
  deleteFile,
  usingCloudStorage,
  uploadDir,
  productImagesDir,
  logosDir
};
