const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

function makeStorage(dest) {
  fs.mkdirSync(dest, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename:    (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
      cb(null, `${Date.now()}-${safe}`);
    },
  });
}

const imageFilter = (_req, file, cb) => {
  if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed.'), false);
};

exports.productUpload = multer({
  storage: makeStorage(path.join(__dirname, '../public/uploads/products')),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

exports.gpayUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(__dirname, '../public/uploads/gpay');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, _file, cb) => cb(null, 'qr.png'),
  }),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});
