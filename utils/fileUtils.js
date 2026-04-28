export const getUploadedFileUrl = (req, file) => {
  if (!file) {
    return '';
  }

  if (file.secure_url) {
    return file.secure_url;
  }

  if (file.url) {
    return file.url;
  }

  if (file.filename) {
    return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
  }

  if (file.path) {
    return file.path;
  }

  return '';
};

export const mapUploadedFiles = (req, files = []) => files.map((file) => getUploadedFileUrl(req, file)).filter(Boolean);