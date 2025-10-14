const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const userController = require('../controllers/user.controller');

// Test route that we know works
router.get('/test', function(req, res) {
  res.status(200).json({ message: "Test endpoint working" });
});
// Auth routes
router.post('/register', 
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  userController.registerUser
);

router.post('/login', userController.loginUser);
router.post('/logout', verifyJWT, userController.logoutUser);
router.post('/refresh-token', userController.refreshAccessToken);

// Secured routes
router.post('/change-password', verifyJWT, userController.changeCurrentPassword);
router.get('/current-user', verifyJWT, userController.getCurrentUser);
router.patch('/update-account', verifyJWT, userController.updateAccountDetails);
router.patch('/avatar', verifyJWT, upload.single("avatar"), userController.updateUserAvatar);
router.patch('/cover-image', verifyJWT, upload.single("coverImage"), userController.updateUserCoverImage);
router.get('/c/:username', verifyJWT, userController.getUserChannelProfile);
router.get('/history', verifyJWT, userController.getWatchHistory);

module.exports = router;