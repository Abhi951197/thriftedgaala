const multer                  = require('multer');
const { CloudinaryStorage }   = require('multer-storage-cloudinary');
const { v2: cloudinary }      = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageFilter = (_req, file, cb) => {
  if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed.'), false);
};

exports.productUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         'thriftedgaala/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ width: 800, crop: 'limit' }],
    },
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.gpayUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          'thriftedgaala/gpay',
      public_id:       'qr',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      overwrite:       true,
    },
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

exports.cloudinary = cloudinary;
