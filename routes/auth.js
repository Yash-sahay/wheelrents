const express = require('express');
const UserModel = require('../models/UserModel');
const router = express.Router();
const { body, checkSchema, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'xproject$unicon';

const multer = require('multer');
const FCMModel = require('../models/FCMModel');
const upload = multer({ dest: 'images/user' })

// ROUTE 1: Create a User using: POST "/api/auth/createuser". No login required

var TypeSchema = {
  "userType": {
    in: 'body',
    matches: {
      options: [/\b(?:host|client)\b/],
      errorMessage: "Try available roles [ 'host', 'client' ]"
    }
  }
}
router.post('/createuser', [
  body('name', 'Enter a valid name').isLength({ min: 3 }),
  body('email', 'Enter a valid email').isEmail(),
  body('userType', 'Enter a valid user type').isLength({ min: 1}),
  checkSchema(TypeSchema),
  body('password', 'Password must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {
  // If there are errors, return Bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    // Check whether the user with this email exists already
    let user = await UserModel.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ error: "Sorry a user with this email already exists" })
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);

    // Create a new user
    user = await UserModel.create({
      name: req.body.name,
      password: secPass,
      email: req.body.email,
      userType: req.body.userType,
      phoneNo: req.body.phoneNo
    });
    const data = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        userType: user.userType,
      }
    }
    const authtoken = jwt.sign(data, JWT_SECRET);


    // res.json(user)
    res.json({ ...data, authtoken })

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})


// ROUTE 2: Authenticate a User using: POST "/api/auth/login". No login required
router.post('/login', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password cannot be blank').exists(),
  body('fcm_token', 'fcm token cannot be blank').exists(),
], async (req, res) => {
  let success = false;
  // If there are errors, return Bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, fcm_token } = req.body;
  try {
    let user = await UserModel.findOne({ email });
    if (!user) {
      success = false
      return res.status(400).json({ error: "Please try to login with correct credentials" });
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      success = false
      return res.status(400).json({ success, error: "Please try to login with correct credentials" });
    }

    let aleadyfcmCheck = await FCMModel.findOne({ fcm_token, userId: user?.id });
    if(!aleadyfcmCheck){
      const Fcm_save = await FCMModel.create({userId: user.id, fcm_token})
    }

    const authtoken = jwt.sign({user: {id: user.id}}, JWT_SECRET);
    success = true;

    const data = {
      user: {
        id: user.id,
        name: user.name,
        userType: user.userType,
        email: user.email,
        date: user.date,
      },
      success,
      access: authtoken,
      refresh: null
    }
    res.json(data)

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }


});


// ROUTE 3: Get loggedin User Details using: POST "/api/auth/getuser". Login required
router.post('/getuser', fetchuser,  async (req, res) => {

  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId).select("-password")
    res.send(user)
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})
module.exports = router