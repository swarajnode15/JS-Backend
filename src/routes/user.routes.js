import { Router } from "express"; 
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlerwares/multer.middleware.js"

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

export default router;