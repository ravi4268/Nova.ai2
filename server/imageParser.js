function normalizeImageRecord(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const data =
    value.data ||
    value.image?.data ||
    value.imageData ||
    value.image_data ||
    value.inlineData?.data ||
    value.inline_data?.data;

  const mimeType =
    value.mimeType ||
    value.mime_type ||
    value.type ||
    value.inlineData?.mimeType ||
    value.inline_data?.mime_type ||
    'image/png';

  if (typeof data === 'string' && (mimeType.startsWith('image/') || /^data:image\//i.test(data))) {
    return {
      data,
      mimeType: mimeType.startsWith('image/') ? mimeType : 'image/png',
    };
  }

  return null;
}

function findImage(data) {
  const direct = data?.output_image;
  if (typeof direct?.data === 'string') {
    return {
      data: direct.data,
      mimeType: direct.mime_type || direct.mimeType || 'image/png',
    };
  }

  const found = [];

  const visit = (value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value !== 'object') return;

    const normalized = normalizeImageRecord(value);
    if (normalized) {
      found.push(normalized);
    }

    Object.values(value).forEach(visit);
  };

  visit(data?.output);
  visit(data?.outputs);
  visit(data?.steps);
  visit(data?.candidates);
  visit(data?.content);

  return found[0] || null;
}

module.exports = { findImage };
