import express from 'express';
import fs from 'fs';
import upload from '../middlewares/uploadMiddleware.js';
import { uploadFileToR2 } from '../services/r2Service.js';

const router = express.Router();

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const file = req.file;
    const rawExt = file.originalname ? file.originalname.split('.').pop().toLowerCase() : 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
    const folder = ['products', 'reviews', 'teams'].includes(req.query.folder || req.body?.folder)
      ? (req.query.folder || req.body?.folder)
      : 'products';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${safeExt}`;
    const key = `${folder}/${fileName}`;

    let buffer = file.buffer;
    if (!buffer && file.path) {
      buffer = fs.readFileSync(file.path);
      try {
        fs.unlinkSync(file.path); // Clean up temporary disk upload
      } catch (_) {}
    }

    if (!buffer) {
      return res.status(400).json({ message: 'Unable to process image data' });
    }

    const publicUrl = await uploadFileToR2(buffer, key, file.mimetype || 'image/jpeg');
    res.json({ url: publicUrl, success: true });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
});

export default router;
