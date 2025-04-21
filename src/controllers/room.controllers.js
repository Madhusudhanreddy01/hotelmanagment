import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.model.js";
import { Room } from "../models/room.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const registerRoom = asyncHandler(async (req, res) => {
      const { roomNumber, price, capacity } = req.body;

      if (
            [roomNumber, price, capacity].some((field) => field === "")
      ) {
            throw new ApiError(400, "All fields are required");
      }

      const existedRoom = await Room.findOne({ room_number: roomNumber });

      if (existedRoom) {
            throw new ApiError(409, "Room already exists");
      }
      const room = await Room.create({
            room_number: roomNumber,
            price,
            capacity,
            admin_id: req.admin?._id
      });


      return res
            .status(201)
            .json(new ApiResponse(201, room, "Room registered Successfully"));

});

const updateRoomDetails = asyncHandler(async (req, res) => {

      const { roomNumber, price, capacity } = req.body;

      const { roomId } = req.params;

      if (!roomId) {
            throw new ApiError(400, "Invalid roomId")
      }

      const updatedRoom = await Room.findByIdAndUpdate(roomId, {
            $set: {
                  room_number: roomNumber,
                  price,
                  capacity
            }
      }, { new: true });

      if (!updatedRoom) {
            throw new ApiError(404, "Room not found or update operation failed");
      }


      return res.status(200).json(new ApiResponse(200, updatedRoom, "Room details updated successfully"));


})

const getAvailableRooms = asyncHandler(async (req, res) => {

      const availableRooms = await Room.aggregate([
            { $match: { "occupancy_status": true } },
            { $project: { room_number: 1, price: 1, capacity: 1, occupiedPeople: { $size: "$hostelersId" } } }
      ])

      if (!availableRooms || availableRooms.length === 0) {
            throw new ApiError(400, "No available rooms found");
      }

      return res.status(200).json(new ApiResponse(200, availableRooms, "Successfully retrieved available rooms"))
})

const checkRoomAvailability = asyncHandler(async (req, res) => {

      const { roomId } = req.params;

      if (!roomId) {
            throw new ApiError(400, "Invalid roomId");
      }

      const validRoomId = await Room.findById(roomId);

      if (!validRoomId) {
            throw new ApiError(404, "Room not found");
      }

      const room = await Room.aggregate([
            {
                  $match:
                  {
                        $and: [
                              { _id: validRoomId?._id },
                              {
                                    occupancy_status: true
                              }
                        ]
                  }
            },
            {
                  $project: {
                        room_number: 1,
                        price: 1,
                        capacity: 1,
                        hostelers_id: 1,
                        occupancy_status: 1,
                        occupiedPeople: { $size: "$hostelersId" }
                  }
            }
      ])

      if (!room || room.length === 0) {
            throw new ApiError(400, "Room is not available for booking")
      }

      return res.status(200).json(new ApiResponse(200, room, "Room is available for booking"));

})

const deleteRoom = asyncHandler(async (req, res) => { 

      const { roomId } = req.params;

      if (!roomId) {
            throw new ApiError(400, "Invalid roomId");
        }

      const room = await Room.findByIdAndDelete(roomId);

      if (!room) {
            throw new ApiError(404, "Room not found");
        }

      return res.status(200).json(new ApiResponse(200, "Room deleted successfully"));

 })

export {
      registerRoom,
      getAvailableRooms,
      checkRoomAvailability,
      updateRoomDetails,
      deleteRoom
};
