import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
    },
    hostelerId: {
      type: Schema.Types.ObjectId,
      ref: "Hosteler",
    },
    paymentDate: {
      type: Date, 
    },
    paymentType: {
      type: String,
      enum: ["Cash", "Credit", "Debit", "Upi"], 
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model("Payment", paymentSchema);



