const express = require('express');
const userRouter = express.Router();
const { registerUser,
        loginUser,
        logoutUser, 
        changeCurrentPassword, 
        refreshAccessToken, 
        getCurrentUser, 
        updateAccountDetails, 
        updateUserAvatar, 
        updateUserCoverImage, 
        getUserChannelProfile, 
        getWatchHistory } = require('../controllers/user.controller.js');
const { verifyJWT } = require('../middlewares/auth.middleware.js')
const upload = require('../middlewares/multer.middleware.js');

userRouter
    .route('/register')
    .post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]),
    registerUser 
);

userRouter.route('/login').post(loginUser)


//secured routes
userRouter.route('/logout').post(verifyJWT,logoutUser);
userRouter.route('/refresh-token').post(refreshAccessToken)
userRouter.route('/change-password').post(verifyJWT,changeCurrentPassword)
userRouter.route('/current-user').get(verifyJWT,getCurrentUser)
userRouter.route('/update-account').patch(verifyJWT,updateAccountDetails) //if we use "put" everything will be updated
userRouter.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar)//used 2 middlewares
userRouter.route('/cover-Image',verifyJWT,upload.single("coverImage"),updateUserCoverImage)
userRouter.route('/c/:username').get(verifyJWT,getUserChannelProfile) // we were using params
userRouter.route('/history').get(verifyJWT,getWatchHistory)
module.exports = userRouter;