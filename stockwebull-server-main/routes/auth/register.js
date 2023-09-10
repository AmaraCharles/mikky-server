// var express = require("express");
// var { hashPassword, sendWelcomeEmail,resendWelcomeEmail } = require("../../utils");
// const UsersDatabase = require("../../models/User");
// var router = express.Router();
// const { v4: uuidv4 } = require("uuid");

// router.post("/register", async (req, res) => {
//   const { firstName, lastName, email, password, country } = req.body;

//   //   check if any user has that username
//   const user = await UsersDatabase.findOne({ email });

//   // if user exists
//   if (user) {
//     res.status(400).json({
//       success: false,
//       message: "email address is already taken",
//     });
//     return;
//   }

//   await UsersDatabase.create({
//     firstName,
//     lastName,
//     email,
//     password: hashPassword(password),
//     country,
//     amountDeposited: 0,
//     profit: 0,
//     balance: 0,
//     referalBonus: 0,
//     transactions: [],
//     withdrawals: [],
//     accounts: {
//       eth: {
//         address: "",
//       },
//       ltc: {
//         address: "",
//       },
//       btc: {
//         address: "",
//       },
//       usdt: {
//         address: "",
//       },
//     },
//     verified: false,
//     isDisabled: false,
//   })
//     .then((data) => {
//       return res.json({ code: "Ok", data: user });
//     })
//     .then(() => {
//       var token = uuidv4();
//       sendWelcomeEmail({ to: req.body.email, token });
//     })
//     .catch((error) => {
//       res.status(400).json({
//         success: false,
//         message: error.message,
//       });
//     });
// });



// router.post("/register/resend", async (req, res) => {
//   const { email } = req.body;
//   const user = await UsersDatabase.findOne({ email });

//   if (!user) {
//     res.status(404).json({
//       success: false,
//       status: 404,
//       message: "User not found",
//     });

//     return;
//   }

//   try {
    
//     res.status(200).json({
//       success: true,
//       status: 200,
//       message: "OTP resent successfully",
//     });

//     resendWelcomeEmail({
//       to:req.body.email
//     });


   

//   } catch (error) {
//     console.log(error);
//   }
// });

// module.exports = router;


const express = require("express");
const { hashPassword, sendWelcomeEmail, resendWelcomeEmail } = require("../../utils");
const UsersDatabase = require("../../models/User");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

// Function to generate a referral code
function generateReferralCode(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }

  return code;
}


module.exports = router;

// Your registration route
const mongoose = require('mongoose');
// Define your user schema
const userSchema = new mongoose.Schema({
  // Other user properties...

  referredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

// Create your User model
const User = mongoose.model('User', userSchema);

// Your registration route
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, country, referralCode } = req.body;

  try {
    // Check if any user has that email
    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "Email address is already taken",
      });
    }

    // Find the referrer based on the provided referral code
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      // You can remove the code that checks for a valid referral code here

      // Optionally, you can handle the case where the referral code is invalid
      // by setting referrer to null and proceeding with registration
    }

    // Create a new user with referral information
    const newUser = {
      firstName,
      lastName,
      email,
      password: hashPassword(password),
      country,
      amountDeposited: 0,
      profit: 0,
      balance: 0,
      referalBonus: 0,
      transactions: [],
      withdrawals: [],
      accounts: {
        eth: {
          address: "",
        },
        ltc: {
          address: "",
        },
        btc: {
          address: "",
        },
        usdt: {
          address: "",
        },
      },
      verified: false,
      isDisabled: false,
      referralCode: generateReferralCode(6), // Generate a referral code for the new user
      referredBy: referrer ? referrer._id : null, // Store the ID of the referrer if applicable
      referredUsers: [], // Initialize the referredUsers property as an empty array
    };

    // Create the new user in the database
    const createdUser = await User.create(newUser);
    const token = uuidv4();
    sendWelcomeEmail({ to: email, token });

    // If there's a referrer, update their referredUsers list
    if (referrer) {
      referrer.referredUsers.push(createdUser._id);
      await referrer.save();
    }

    return res.status(200).json({ code: "Ok", data: createdUser });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
module.exports = router;
