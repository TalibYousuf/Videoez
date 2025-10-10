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
        throw apiError(400,"all fields are required")
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
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id);
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new apiResponse(200,{accessToken,refreshToken:newRefreshToken},"access token refreshed")
        )
    } catch (error) {
        throw new apiError(401,error?.message || "invalid refresh token")
    }
})
  
module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}