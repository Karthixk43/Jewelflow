const crypto = require('crypto');

const hasCloudinaryConfig = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const getCloudinaryFolder = (kind) => {
  const root = (process.env.CLOUDINARY_FOLDER || 'jewelflow').replace(/^\/+|\/+$/g, '');
  return `${root}/${kind}`;
};

const signCloudinaryParams = (params) => {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(`${payload}${process.env.CLOUDINARY_API_SECRET}`)
    .digest('hex');
};

const uploadImageToCloudinary = async (file, kind) => {
  if (!hasCloudinaryConfig()) {
    throw new Error('Cloud storage is not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = getCloudinaryFolder(kind);
  const publicId = crypto.randomBytes(12).toString('hex');
  const signature = signCloudinaryParams({
    folder,
    public_id: publicId,
    timestamp
  });

  const form = new FormData();
  form.append(
    'file',
    new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' }),
    file.originalname || `${publicId}.jpg`
  );
  form.append('api_key', process.env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('public_id', publicId);
  form.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: form
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Cloud upload failed');
  }

  return data.secure_url;
};

const uploadFiles = async (files, kind) => {
  const uploaded = await Promise.all(files.map((file) => uploadImageToCloudinary(file, kind)));
  return uploaded;
};

module.exports = {
  hasCloudinaryConfig,
  uploadFiles
};
