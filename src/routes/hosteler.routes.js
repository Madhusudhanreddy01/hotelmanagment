import { Router } from 'express';
import { registerHostelers, updateHostelerDetails, deleteHostelers, hostelerDetails, allhostelersDetails, paidHosteler, allPaidHostelersDetails, unPaidHostelersDetails  } from "../controllers/hosteler.controllers.js"; 
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/all").get(allhostelersDetails)

router.route("/register").post(registerHostelers)

router.route("/updateDetails/:hostelerId").patch(updateHostelerDetails)

router.route("/:hostelerId").delete(deleteHostelers).get(hostelerDetails)

router.route("/paid/:hostelerId").patch(paidHosteler)

router.route("/paid-hostelers/details").get(allPaidHostelersDetails)

router.route("/unpaid-hostelers/details").get(unPaidHostelersDetails)

export default router