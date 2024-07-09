 import { asyncHandler } from "../utils/asyncHandler.js";
 import { ApiError } from "../utils/ApiError.js";
 import { User } from "../models/user.model.js";
 import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlerwares/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { syncIndexes } from "mongoose";
import { application } from "express";

 const generateAccessTokenAndRefreshToken = async (userId) =>{
   try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}

   } catch (error) {
        throw new ApiError(500,"somting went wrong")
   }


 }

 const registerUser = asyncHandler(async(req,res)=>{
    //get user details from frontend 
    //validation - not empty
    //check if user already exist: username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object- create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res
    
    //gets values from frontend by destructuring 
    const{fullname,username,email,password}=req.body

    //validation - empty fields 
    if([fullname,username,email,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"all field are required")
     }

     //It performs a query to find a single document in the User collection that matches one of the specified conditions. 
     const existedUSer = await User.findOne({
        $or: [{ username },{ email }]
     })

     if(existedUSer){
        throw new ApiError(409,"User with username or email already exits")
     }

     //gets local path of avatar and coverImage
     //  The ternary operator is used to provide a default value (undefined in this case) if any part of the chain is missing, thus preventing runtime errors.
     const avtarLocalPath= req.files && req.files.avatar && req.files.avatar[0] ? req.files.avatar[0].path : undefined;
     const coverImageLocalPath= req.files && req.files.coverImage && req.files.coverImage[0] ? req.files.coverImage[0].path : undefined;
 
    //another way of checking any part of the chain is missing
    //  let coverImageLocalPath;
    //  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
    //     coverImageLocalPath= req.files?.coverImage[0]?.path;
    //  }

     // check is avatar localpath exists 
     if(!avtarLocalPath){
        throw new ApiError(400,"avatar file is required")
     }

     //uploading avatar and coverImage on cloudinary
    const avatar = await uploadOnCloudinary(avtarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
 

    if(!avatar){
        throw new ApiError(400,"avatar file is required")
    }

    //pushing it on db
   const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //removing password and refresh token
   const ceratedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!ceratedUser){
        throw new ApiError(500,"somthing went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200,ceratedUser,"User registered succefully")
    )

 })

 const login = asyncHandler(async (req,res)=>{
    // getting user credentials from frontend
    // username or email
    // find the user
    // password check
    // assign access token and refresh token
    // send cookies

    const {username,email,password} = req.body

    if(!(username || email) ){
        throw new ApiError(400,"username or email required")
    }

   const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentilas")
    }


   const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

  // getting updated user 
  const loggedInUser = await User.findById(user._id).
  select("-password -refreshToken")

  //prevents modifying cookies bby user
const options = {
    httpOnly: true,
    secure: true
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
    new ApiResponse(
        200, 
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
    )
)

 })

 const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
      }

      return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json( new ApiResponse(200,{},"user logged out"))


 })

 //refreshing user access token 
 const refreshAccessToken = asyncHandler(async(req,res)=>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
   }

   try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
    const user = User.findById(decodedToken?._id)
 
    if(!user){
     throw new ApiError(401,"Invalis refresh token")
    }
 
    if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError(401,"Refresh token expired or used")
    }
 
    const options ={
     httpOnly: true,
     secure : true
    }
 
    const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshtoken",newRefreshToken,options)
    .json( new ApiResponse(
        200,
        {
            accessToken, refreshToken: newRefreshToken
        },
        "Accedd Token refreshed"
    ))
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
   }
   
 })

 const changeCurrentPassword = asyncHandler(async(req,res)=>{

    const{currentPassword,newPassword} = req.body
    const user  = User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Incorect current password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "password changed successfully"
    ))

 })

 const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "current user fetched successfully"
    ))
 })

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {fullname,email}
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        user,
        "Account Details upated scuccessfully"
    ))

})

const updateAvatarImage = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400,"avatar file missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(500,"Error while uploading on avatar")
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
       $set:{
        avatar: avatar.url
       }
    },
    {new:true}
   ).select("-password")


   return res
   .status(200)
   .json(
        new ApiResponse(
            200,
            user,
            "avatar image updated successfully"
        )
   )

})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
 
    if(!coverImageLocalPath){
     throw new ApiError(400,"cover image file missing")
    }
 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
 
    if(!coverImage.url){
     throw new ApiError(500,"Error while uploading on cover image")
    }
 
    const user = await User.findByIdAndUpdate(
     req.user?._id,
     {
        $set:{
            coverImage: coverImage.url
        }
     },
     {new:true}
    ).select("-password")
 
 
    return res
    .status(200)
    .json(
         new ApiResponse(
             200,
             user,
             "coverImage image updated successfully"
         )
    )
 
 })
const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username}=req.params;

    if(!username?.trim()){
        throw new ApiError(400,"username not available")
    }

   const channel = await User.aggregate([
        {
            $match:{
                username : username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTO"
            }
        },
        {
            $addFields:{
                subscrbersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTO"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscrbersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }

    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})




 export {   
    registerUser,
    login,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatarImage,
    updateCoverImage,
    getUserChannelProfile
}