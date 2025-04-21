import { Router } from 'express';
import {
      registerUser,
      loginUser,
      changeCurrentPassword,
      updateAccountDetails,
      logoutUser,
      deleteAdmin,
      downloadExcelRecord
} from "../controllers/admin.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/:adminId").delete(verifyJWT, deleteAdmin)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/excel-download").get(verifyJWT,downloadExcelRecord)


export default router