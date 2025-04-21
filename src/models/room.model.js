import mongoose, { Schema } from "mongoose";


const roomsSchema = new Schema(
  {
    room_number: {
      type: Number,
      unique: true,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    capacity: {
      type: Number,
      required: true
    },
    occupancy_status: {
      type: Boolean,
      default: true
    },
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: "Admin"
    },
    hostelersId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Hosteler"
      }
    ]
  },
  {
    timestamps: true
  }
);

// Create the Room model based on the schema
export const Room = mongoose.model("Room", roomsSchema);
