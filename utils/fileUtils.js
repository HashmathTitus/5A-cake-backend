export const getUploadedFileRecord = (req, file) => {
  if (!file) {
    return null;
  }

  const localUploadUrl = file.filename ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}` : '';
  const url = file.secure_url || file.url || localUploadUrl || file.path || '';
  const publicId = file.public_id || file.filename || null;

  if (!url) {
    return null;
  }

  return {
    url,
    publicId,
  };
};

export const mapUploadedFiles = (req, files = []) => files.map((file) => getUploadedFileRecord(req, file)).filter(Boolean);

export const normalizeStoredImage = (image) => {
  if (!image) {
    return null;
  }

  if (typeof image === 'string') {
    return { url: image, publicId: null };
  }

  if (image.url || image.secure_url || image.path) {
    return {
      url: image.url || image.secure_url || image.path,
      publicId: image.publicId || image.public_id || null,
    };
  }

  return null;
};

export const mapImageUrls = (images = []) => images.map((image) => normalizeStoredImage(image)?.url).filter(Boolean);
