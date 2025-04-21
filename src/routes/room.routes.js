import { Router } from 'express';
import {
      registerRoom,
      getAvailableRooms,
      checkRoomAvailability,
      updateRoomDetails,
      deleteRoom
} from "../controllers/room.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/registerroom").post(registerRoom)

router.route("/:roomId").patch(updateRoomDetails).delete(deleteRoom)

router.route("/available-rooms").get(getAvailableRooms)

router.route("/room-availability/:roomId").get(checkRoomAvailability)


export default router