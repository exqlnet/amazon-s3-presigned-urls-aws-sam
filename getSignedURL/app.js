'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const s3 = new AWS.S3()

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300

// Main Lambda entry point
exports.handler = async (event) => {
  const { queryStringParameters } = event;
  const contentType = queryStringParameters && queryStringParameters.contentType ? queryStringParameters.contentType : 'image/jpeg';
  const prefix = queryStringParameters && queryStringParameters.prefix ? queryStringParameters.prefix : '';
  return await getUploadURL(contentType, prefix);
}

const getUploadURL = async function(contentType, prefix) {
  const timestamp = new Date().getTime();
  const randomID = `${timestamp}_${parseInt(Math.random() * 10000000)}`; // Adding timestamp to randomID
  const extension = contentType.split('/').pop(); // Extracting extension from contentType
  const Key = `${prefix}/${randomID}.${extension}`; // Constructing objectKey using prefix, randomID, and extension

  // Get signed URL from S3
  const s3Params = {
    Bucket: process.env.UploadBucket,
    Key,
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: contentType,

    // This ACL makes the uploaded object publicly readable. You must also uncomment
    // the extra permission for the Lambda function in the SAM template.

    ACL: 'public-read'
  }

  console.log('Params: ', s3Params)
  const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params)

  return JSON.stringify({
    uploadURL: uploadURL,
    Key
  })
}
