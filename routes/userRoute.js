const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../modals/User");
const s3 = require("../helpers/aws");
const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
});

router.post("/signup", upload.single("profileImage"), async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let profileImageUrl = null;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required" });
    }

    if (req.file) {
      const s3Params = {
        Bucket: "yourownbucket007",
        Key: `${Date.now()}-${req.file?.originalname}`,
        Body: req.file.buffer,
        ACL: "public-read",
      };

      const s3Data = await s3.upload(s3Params).promise();
      profileImageUrl = s3Data.Location;
    }

    let user = new User({
      name: username,
      email: email,
      passwordHash: bcrypt.hashSync(password, 10),
      presignedUrl: profileImageUrl,
    });

    await user.save();

    const secret = process.env.secret;
    const token = jwt.sign(
      {
        userID: user.id,
      },
      secret,
      { expiresIn: "1d" },
    );
    res.status(200).send({
      user: user.email,
      presignedUrl: user.presignedUrl,
      token: token,
      userId: user?._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to register user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password are required" });
    }
    const user = await User.findOne({ email: email });
    const secret = process.env.secret;

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      const token = jwt.sign(
        {
          userID: user.id,
        },
        secret,
        { expiresIn: "1d" },
      );
      res.status(200).send({
        user: user.email,
        presignedUrl: user.presignedUrl,
        token: token,
        userId: user?._id,
      });
    } else {
      res.status(400).send("Invalid credentials");
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Failed to authenticate user" });
  }
});

module.exports = router;
