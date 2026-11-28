import express from 'express';
import { saveUser, getUserProfile, updateProfile, addToWishlist, removeFromWishlist, deleteAccount } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/save', saveUser);
router.get('/profile/:id', getUserProfile);
router.put('/profile/:id', updateProfile);
router.delete('/account', deleteAccount);

// Wishlist
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

export default router;
