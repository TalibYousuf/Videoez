const express = require('express');
const userRouter = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/user.controller.js');
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

module.exports = userRouter;