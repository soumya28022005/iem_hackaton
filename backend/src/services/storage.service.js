const admin = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Uploads a file to Firebase Storage.
 * @param {Object} file - The file object from Multer.
 * @param {string} destination - Optional subfolder in the bucket.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
async function uploadFile(file, destination = 'uploads') {
  if (!file) throw new Error('No file provided for upload');
  
  const bucket = admin.storage().bucket();
  const blobName = `${destination}/${uuidv4()}-${file.originalname}`;
  const blob = bucket.file(blobName);
  
  await blob.save(file.buffer || require('fs').readFileSync(file.path), {
    metadata: {
      contentType: file.mimetype,
    },
    public: true,
  });

  // Construct the public URL
  // format: https://storage.googleapis.com/BUCKET_NAME/FILE_NAME
  return `https://storage.googleapis.com/${bucket.name}/${blobName}`;
}

/**
 * Deletes a file from Firebase Storage.
 * @param {string} fileUrl - The public URL of the file to delete.
 */
async function deleteFile(fileUrl) {
  if (!fileUrl) return;
  
  try {
    const bucket = admin.storage().bucket();
    // Extract path from URL: https://storage.googleapis.com/bucket/path/to/file
    const parts = fileUrl.split(`${bucket.name}/`);
    if (parts.length < 2) return;
    
    const filePath = parts[1];
    await bucket.file(filePath).delete();
  } catch (error) {
    console.warn(`Failed to delete file from storage: ${fileUrl}`, error.message);
  }
}

module.exports = {
  uploadFile,
  deleteFile,
};
