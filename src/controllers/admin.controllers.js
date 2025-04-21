import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.model.js";
import ExcelJS from 'exceljs';
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import axios from 'axios';

const generateAccessAndRefereshTokens = async (userId) => {
      try {
            const user = await Admin.findById(userId);
            const accessToken = user.generateAccessToken();

            return { accessToken };
      } catch (error) {
            throw new ApiError(
                  500,
                  "Something went wrong while generating referesh and access token"
            );
      }
};

const registerUser = asyncHandler(async (req, res) => {
      const { fullName, email, username, password } = req.body;

      if (
            [fullName, email, username, password].some((field) => field?.trim() === "")
      ) {
            throw new ApiError(400, "All fields are required");
      }

      const existedUser = await Admin.findOne({
            $or: [{ username }, { email }],
      });

      if (existedUser) {
            throw new ApiError(409, "Admin with email or username already exists");
      }

      const user = await Admin.create({
            fullName,
            email,
            password,
            username: username.toLowerCase(),
      });

      const createdUser = await Admin.findById(user._id).select("-password");

      if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
      }

      return res
            .status(201)
            .json(new ApiResponse(200, createdUser, "Admin registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
      const { email, username, password } = req.body;
      
      if (!username && !email) {
            throw new ApiError(400, "username or email is required");
      }

      const user = await Admin.findOne({
            $or: [{ username }, { email }],
      });

      if (!user) {
            throw new ApiError(404, "User does not exist");
      }

      const isPasswordValid = await user.isPasswordCorrect(password);

      if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
      }

      const { accessToken } = await generateAccessAndRefereshTokens(user._id)


      const loggedInUser = await Admin.findById(user._id).select("-password -refreshToken")

      const options = {
            httpOnly: true,
            secure: true
      }

      return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .json(
                  new ApiResponse(
                        200,
                        {
                              user: loggedInUser, accessToken
                        },
                        "Admin logged In Successfully"
                  )
            )
});

const logoutUser = asyncHandler(async (req, res) => {

      const options = {
            httpOnly: true,
            secure: true
      }

      return res
            .status(200)
            .clearCookie("accessToken", options)
            .json(new ApiResponse(200, {}, "User logged Out"))
})

const deleteAdmin = asyncHandler(async (req, res) => {

      const { adminId } = req.params;

      if(!adminId) {
            throw new ApiError(400, "Invalid adminId");
      }

      const admin = await Admin.findByIdAndDelete(adminId);

      if(!admin) {
            throw new ApiError(404, "Admin not found");
      }

      return res.status(200).json(new ApiResponse(200, "Admin deleted successfully"));


})

const changeCurrentPassword = asyncHandler(async (req, res) => {
      const { oldPassword, newPassword } = req.body

      const user = await Admin.findById(req.admin?._id)
      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

      if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid old password")
      }

      user.password = newPassword

      await user.save({ validateBeforeSave: false })

      return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
 
      const { fullName, email } = req.body

      if (!fullName || !email) {
            throw new ApiError(400, "All fields are required")
      }

      const user = await Admin.findByIdAndUpdate(
            req.admin?._id,
            {
                  $set: {
                        fullName,
                        email: email
                  }
            },
            { new: true }

      ).select("-password")
      
      return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully"))

})

const downloadExcelRecord = asyncHandler(async (req, res) => {

      let allHostelersDetailsUrl = "http://localhost:8000/api/v1/hosteler/all";

      let token = `Bearer ${process.env.TOKEN}`;
      
      const listOfHostelersDetails = await axios.get(allHostelersDetailsUrl, {
          headers: {
              Authorization: token
          }
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Hostelers Records Excel');

      const desiredHeaders = ['hostelerId', 'phoneNumber', 'name', "isPaid", "room", "price"];

      const headers = Object.keys(listOfHostelersDetails?.data?.data[0]);

      worksheet.addRow(headers);

      listOfHostelersDetails?.data?.data.forEach(row => {
            const values = headers.map(header => row[header]);
            worksheet.addRow(values);
        });
      await workbook.xlsx.writeFile('Hostelersexcel.xlsx');
      const buffer = await workbook.xlsx.writeBuffer();

      res.setHeader('Content-Disposition', 'attachment; filename=hostelers.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
      
    
})


export {
      registerUser,
      loginUser,
      changeCurrentPassword,
      updateAccountDetails,
      logoutUser,
      deleteAdmin,
      downloadExcelRecord
};
