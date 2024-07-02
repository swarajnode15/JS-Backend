import { Router } from "express"; 
import { login, logoutUser, registerUser } from "../controllers/user.controller.js";
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

export default router;