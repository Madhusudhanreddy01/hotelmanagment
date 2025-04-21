import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Hosteler } from "../models/hosteler.model.js";
import { Room } from "../models/room.model.js";
import { Payment } from "../models/payment.model.js";
import mongoose from "mongoose";

const registerHostelers = asyncHandler(async (req, res) => {
      const { name, phoneNumber, roomAllocated } = req.body;

      if ([name, phoneNumber, roomAllocated].some((field) => field === "")) {
            throw new ApiError(400, "All fields are required");
      }

      const existedHosteler = await Hosteler.findOne({
            $or: [{ name }, { phoneNumber }],
      });

      if (existedHosteler) {
            throw new ApiError(409, "Hosteler with email or username already exists");
      }

      const room = await Room.aggregate([
            {
                  $match: {
                        room_number: roomAllocated,
                  },
            },
            {
                  $project: {
                        price: 1,
                        capacity: 1,
                        room_number: 1,
                        occipancy_status: 1,
                        hostelersId: 1,
                        occupiedPeople: { $size: "$hostelersId" },
                  },
            },
      ]);

      if (!room || room.length === 0) {
            throw new ApiError(400, "Room not found");
      }

      if (room[0]?.capacity > room[0]?.hostelersId.length) {
            const createdHosteler = await Hosteler.create({
                  name,
                  phoneNumber,
                  roomAllocated: room[0]?._id || 0,
            });

            if (!createdHosteler) {
                  throw new ApiError(
                        400,
                        "Error occurred while creating a new hostel occupant"
                  );
            }

            if (room[0] && typeof room[0] === "object") {
                  room[0].hostelersId.push(createdHosteler?._id);

                  const updatedRoom = await Room.updateOne(
                        { _id: room[0]._id },
                        { $push: { hostelersId: createdHosteler?._id } }
                  );
            }
      } else {
            ApiError(400, "Room reached its occupancy limit");
      }

      if (room[0]?.capacity === room[0]?.hostelersId.length) {
            const updatedRoom = await Room.findOneAndUpdate(
                  { _id: room[0]._id },
                  { $set: { occupancy_status: false } },
                  { new: true }
            );
      }

      return res
            .status(201)
            .json(new ApiResponse(201, "Hosteler registered successfully"));
});

const updateHostelerDetails = asyncHandler(async (req, res) => {
      const { hostelerId } = req.params;

      if (!hostelerId) {
            throw new ApiError(400, "hostelerId required");
      }

      const { phoneNumber, name } = req.body;

      const updateDetails = await Hosteler.findByIdAndUpdate(
            hostelerId,
            {
                  $set: {
                        phoneNumber,
                        name,
                  },
            },
            {
                  new: true,
            }
      );

      return res
            .status(200)
            .json(new ApiResponse(200, updateDetails, "Updated details successfully"));
});

const deleteHostelers = asyncHandler(async (req, res) => {
      const { hostelerId } = req.params;

      if (!hostelerId) {
            throw new ApiError(400, "hostelerId required");
      }

      const deleteHosteler = await Hosteler.findByIdAndDelete(hostelerId);

      if (!deleteHosteler) {
            throw new ApiError(400, "Hosteler not found");
      }

      const room = await Room.findByIdAndUpdate(
            deleteHosteler.roomAllocated,
            {
                  $pull: { hostelersId: deleteHosteler._id },
                  $set: {
                        occupancy_status: true,
                  },
            },
            { new: true }
      );

      if (!room) {
            throw new ApiError(400, "Room not found");
      }

      return res
            .status(200)
            .json(new ApiResponse(200, "Hosteler deleted successfully"));
});

const hostelerDetails = asyncHandler(async (req, res) => {

      const { hostelerId } = req.params;

      if (!hostelerId) {
            throw new ApiError(400, "hostelerId required");
      }

      const hosteler = await Hosteler.findById(hostelerId);

      const hostelerDetails = await Hosteler.aggregate([
            {
                  $match: {
                        _id: hosteler._id,
                  },
            },
            {
                  $lookup: {
                        from: "rooms",
                        localField: "roomAllocated",
                        foreignField: "_id",
                        as: "room_details",
                  },
            },
            {
                  $unwind: "$room_details",
            },
            {
                  $project: {
                        phoneNumber: 1,
                        name: 1,
                        room: "$room_details.room_number",
                        price: "$room_details.price",
                        isPaid: 1,
                  },
            },
      ]);

      if (!hosteler || hosteler.length === 0) {
            throw new ApiError(400, "Hosteler not found");
      }

      return res
            .status(200)
            .json(
                  new ApiResponse(
                        200,
                        hostelerDetails,
                        "Hosteler details retrieved successfully"
                  )
            );
});

const allhostelersDetails = asyncHandler(async (req, res) => {
      // const hostelersDetails = await Hosteler.find();

      const hostelersDetails = await Hosteler.aggregate([
            { $match: {} },
            {
                  $lookup: {
                        from: "rooms",
                        localField: "roomAllocated",
                        foreignField: "_id",
                        as: "room_details",
                  },
            },
            {
                  $unwind: "$room_details",
            },
            {
                  $project: {
                        phoneNumber: 1,
                        name: 1,
                        room: "$room_details.room_number",
                        price: "$room_details.price",
                        isPaid: 1,
                  },
            },
      ]);

      return res
            .status(200)
            .json(
                  new ApiResponse(
                        200,
                        hostelersDetails,
                        "All Hosteler details retrieved successfully"
                  )
            );
});

const paidHosteler = asyncHandler(async (req, res) => {

      const { hostelerId } = req.params;

      const { paymentType } = req.body;

      if (!paymentType) {
            throw new ApiError("paymentType is required");
      }

      if (!hostelerId) {
            throw new ApiError(400, "hostelerId required");
      }

      const hosteler = await Hosteler.findById(
            hostelerId,
      );

      const hostelerDetails = await Hosteler.aggregate([
            {
                  $match: {
                        "_id": hosteler?._id
                  }
            },
            {
                  $set: {
                        isPaid: true
                  }
            },
            {
                  $lookup: {
                        from: "rooms",
                        localField: "roomAllocated",
                        foreignField: "_id",
                        as: "room_details",
                  },
            },
            {
                  $unwind: "$room_details",
            },
            {
                  $project: {
                        phoneNumber: 1,
                        name: 1,
                        room: "$room_details.room_number",
                        price: "$room_details.price",
                        isPaid: 1,
                  },
            },
      ])

      if (!hostelerDetails || hostelerDetails.length === 0) {
            throw new ApiError(400, "Hosteler is not found");
      }

      const paymentDetails = await Payment.create({
            room: hosteler?.roomAllocated,
            hostelerId: hosteler?._id,
            paymentType: paymentType,
            paymentDate: new Date(),
      });

      if (!paymentDetails) {
            throw new ApiError(400, "Failed to create payment details.");
      }

      if (hosteler && paymentDetails) {
            hosteler.paymentDetails = paymentDetails?._id;
      }

      return res
            .status(200)
            .json(new ApiResponse(200, hostelerDetails, "Hosteler paid the amount"));
});

const allPaidHostelersDetails = asyncHandler(async (req, res) => {
      const paidHostelers = await Hosteler.find({ isPaid: true });

      if (!paidHostelers || paidHostelers.length === 0) {
            throw new ApiError(400, "No hostelers have made payments");
      }

      return res
            .status(200)
            .json(new ApiResponse(200, paidHostelers, "All paid Hostelers Details"));
});

const unPaidHostelersDetails = asyncHandler(async (req, res) => {

      // const hostelers = await Hosteler.find({ isPaid: false });

      const hostelers = await Hosteler.aggregate([
            {
                  $match: { isPaid: false }
            },
            {
                  $lookup: {
                        from: "rooms",
                        localField: "roomAllocated",
                        foreignField: "_id",
                        as: "room_details"
                  }
            },
            {
                  $unwind: "$room_details"
            },
            {
                  $project: {
                        phoneNumber: 1,
                        name: 1,
                        room: "$room_details.room_number",
                        price: "$room_details.price",
                        isPaid: 1
                  }
            }
      ]);


      if (!hostelers || hostelers.length === 0) {
            throw new ApiError(
                  400,
                  "No unpaid hostelers found. All hostelers have made payments"
            );
      }

      return res
            .status(200)
            .json(new ApiResponse(200, hostelers, "Details of unpaid hostelers"));
});

export {
      registerHostelers,
      updateHostelerDetails,
      deleteHostelers,
      hostelerDetails,
      allhostelersDetails,
      paidHosteler,
      allPaidHostelersDetails,
      unPaidHostelersDetails,
};
