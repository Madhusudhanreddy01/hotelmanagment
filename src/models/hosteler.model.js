import mongoose, { Schema } from "mongoose";

const hostelerSchema = new Schema(
  {
    phoneNumber: {
      type: Number,
      required: true,
      unique: true, 
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    roomAllocated: {
      type: Schema.Types.ObjectId,
      ref: "Room",
    },
    isPaid: {
      type: Boolean,
      default:false
    },
    avatar: {
      type: String, // cloudinary URL
    },
    paymentDetails: {
      type:Schema.Types.ObjectId,
      ref: "Payment",
    }
  },
  {
    timestamps: true,
  }
);

export const Hosteler = mongoose.model("Hosteler", hostelerSchema);
