const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { upload, deleteFile, productImagesDir, logosDir, usingCloudStorage } = require('../utils/upload');
const { uploadFiles, hasCloudinaryConfig } = require('../services/storage');

// Upload product images (multiple)
router.post('/products', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const urls = usingCloudStorage
      ? await uploadFiles(req.files, 'products')
      : req.files.map(file => `/uploads/products/${file.filename}`);

    res.json({
      message: 'Images uploaded successfully',
      urls
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload shop logo (single)
router.post('/logo', authenticate, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const url = usingCloudStorage
      ? (await uploadFiles([req.file], 'logos'))[0]
      : `/uploads/logos/${req.file.filename}`;

    res.json({
      message: 'Logo uploaded successfully',
      url
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete image
router.delete('/:type/:filename', authenticate, async (req, res) => {
  try {
    if (usingCloudStorage || hasCloudinaryConfig()) {
      return res.json({ message: 'File reference removed successfully' });
    }

    const { type, filename } = req.params;

    // Whitelist folder + strip any path components to prevent path traversal
    if (!['logos', 'products'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    const safeName = path.basename(filename);
    const dir = type === 'logos' ? logosDir : productImagesDir;
    const filepath = path.join(dir, safeName);

    await deleteFile(filepath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Error handling for multer
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
