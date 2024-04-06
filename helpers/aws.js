const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: "eu-north-1",
});

const s3 = new AWS.S3();

module.exports = s3;
