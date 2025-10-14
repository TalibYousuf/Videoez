const asyncHandler = require('../utils/asyncHandler')
const apiError = require('../utils/apiError.js')
const User = require('../models/user.model.js')
const uploadOnCloudinary = require('../utils/cloudinary.js')
const apiResponse = require('../utils/apiResponse.js')
const upload = require('../middlewares/multer.middleware.js');
const jwt = require('jsonwebtoken');


const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        //saving refresh token in database
        user.refreshToken = refreshToken 
        await user.save({validateBeforeSave: false})
        //now returning the access and refresh token
        return {accessToken,refreshToken}



    } catch (error) {
        throw new apiError(500,"something went wrong while generating refresh and access token")
    }
}

const registerUser =  asyncHandler( async (req,res)=>{
    // res.status(200).json({message:"OK"})
    //get details from the user front end 
    //validate the user details (!user)
    //check if user already exists (.findOne)
    //check for images and avatar
    //upload them to cloudinary
    //create user object and create call 
    //remove password and refresh token from response
    //check for user creation
    //return response

    const {fullname, email, password, username } = req.body 

    if(
        [fullname,email,username,password].some((field) => 
            field?.trim() === "")
        )
    {
        throw new apiError(400,"all fields are required")
    }
    const existedUser = await User.findOne({
        $or : [{ username },{ email }]
    })
    if(existedUser){
        throw new apiError(409,"USER ALREADY EXISTS")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    let coverImage;
    if (req.files?.coverImage?.length > 0) {
        coverImage = await uploadOnCloudinary(req.files.coverImage[0].path);
    }

    if(!avatar){
        throw new apiError(400,"avatar file is missing")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken "
    )
    if(!createdUser){
        throw new apiError(500,"something went wrong")
    }
    return res.status(201).json(
        new apiResponse(200,createdUser,"user registered successfully")
    )
})
const loginUser = asyncHandler( async (req,res)=>{
    //data
    //username or email
    //find the user
    //check the password
    //generate access and refresh token
    //send cookies
    //send response
    const {username,email,password} = req.body;
    if(!username && !email){
        throw new apiError(400,"username or email is required");
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new apiError(404,"user doesnot exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new apiError(401,"Invalid user credentials")
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new apiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})
const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200,{},"user logged out"))
})
const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken ;
    if(!incomingRefreshToken){
        throw new apiError(401,"authorized request");
    }

    try {
        //verifying the token
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new apiError(401,"Invalid refresh token");
        }
    
        //matching the two tokens
        if(incomingRefreshToken !==  user?.refreshToken){
            throw new apiError(401,"refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new apiResponse(200,{accessToken,refreshToken},"access token refreshed")
        )
    } catch (error) {
        throw new apiError(401,error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async (req,res)=>{
    const {oldPassword , newPassword} = req.body;

    //if we also want confirmed password
    // const {oldPassword,newPassword,confPassword} = req.body;
    // if(!(newPassword===confPassword)){
    //     throw new apiError(404,"passwords do not match");

    // }


    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new apiError(400,"invalid password");
    }
    user.password = newPassword; //setting the new password
    await user.save({validateBeforeSave: false});
    return res
    .status(200)
    .json(new apiResponse(200,{},"password changed successfully"));
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new apiResponse(200,req.user,"user details fetched successfully"));
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname , email} = req.body;
    if(!fullname || !email){
        throw new apiError(400,"all fields are necessary");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set : {
            fullname: fullname,
            email: email
        }
    },{new: true})
    .select("-password ")

    return res.status(200)
    .json(new apiResponse(200,user,"account details updated successfully"));
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path; //check if is is files or file
    if(!avatarLocalPath){
        throw new apiError(400,"avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new apiError(400,"error while uploading file in cloudinary ")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar : avatar.url
        }
    },{new: true})
    .select("-password");//removing the password for sensitive purposes

    return res.status(200)
    .json(new apiResponse(200,user,"avatar added successfully"));
})

const updateUserCoverImage = asyncHandler(async (req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new apiError(400,"cover image is missing");
    }
    const coverImage = uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new apiError(400,"error while uploading image to cloudinary");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage : coverImage
        }
    },{new: true})
    .select("-password");

    return res.status(200)
    .json(new apiResponse(200,user,"cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new apiError(400,"username is missing");
    }
    const channel = await User.aggregate([
        //first pipeline
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        //second pipeline
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // //3rd pipeline
        // {
        //     $lookup:{
        //         from: "subscriptions",
        //         localField: "_id",
        //         foreignField: "channel",
        //         as: "subscribers"
        //     }
        // },
        //4th 
        {
            $lookup:{
                from : "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"

            }
        },
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1


            }
        }
    ])

    if(!channel?.length){
        throw new apiError(404,"channel does not exits");
    }

    return res
    .status(200)
    .json(new apiResponse(200,channel[0],"user channel fetched successfully"));

})

const getWatchHistory = asyncHandler(async (req,res)=>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from : "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner" // to take out first value from the field we use $
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new apiResponse(200,user[0].watchHistory,"watch history fetched successfully"));
})


module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}