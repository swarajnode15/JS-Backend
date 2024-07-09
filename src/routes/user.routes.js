import { Router } from "express"; 
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, login, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateAvatarImage } from "../controllers/user.controller.js";
import {upload} from "../middlerwares/multer.middleware.js"
import { verifyJwt } from "../middlerwares/auth.middleware.js";

const router = Router()


//The upload.fields() method allows you to specify multiple fields for file uploads,
//each with its own field name and maximum file count. 
//When a request is made to the /register endpoint, 
//multer processes the incoming files and attaches them to the req.files object, 
//which you can then access in your registerUser function.
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    
    registerUser)

router.route("/login").post(login)

//secured routes 
router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt,changeCurrentPassword)
router.route("/current-user").get(verifyJwt,getCurrentUser)
router.route("/update-account").patch(verifyJwt,updateAccountDetails)

router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateAvatarImage)
router.route("/cover-image").patch(verifyJwt, upload.single("coverImage"))
router.route("/c/:username").get(verifyJwt, getUserChannelProfile)
router.route("/history").get(verifyJwt, getWatchHistory)

export default router;