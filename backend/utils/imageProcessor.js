/**
 * High-Performance Image Processing using Sharp
 * 10x faster than ImageMagick, streaming support for low memory
 * GitHub: https://github.com/lovell/sharp (29k+ stars)
 */

const sharp = require('sharp');
const path = require('path');

// Default options
const DEFAULTS = {
  thumbnail: { width: 200, height: 200 },
  preview: { width: 800, height: 600 },
  maxWidth: 1920,
  quality: 80
};

/**
 * Create a thumbnail from an image buffer
 * @param {Buffer} inputBuffer - Input image buffer
 * @param {number} width - Thumbnail width (default: 200)
 * @param {number} height - Thumbnail height (default: 200)
 * @returns {Promise<Buffer>} - WebP thumbnail buffer
 */
async function createThumbnail(inputBuffer, width = DEFAULTS.thumbnail.width, height = DEFAULTS.thumbnail.height) {
  return sharp(inputBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 75 })
    .toBuffer();
}

/**
 * Create a preview image (larger than thumbnail)
 * @param {Buffer} inputBuffer - Input image buffer
 * @param {number} maxWidth - Maximum width (default: 800)
 * @returns {Promise<Buffer>} - WebP preview buffer
 */
async function createPreview(inputBuffer, maxWidth = DEFAULTS.preview.width) {
  return sharp(inputBuffer)
    .resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: DEFAULTS.quality })
    .toBuffer();
}

/**
 * Optimize an image for web delivery
 * @param {Buffer} inputBuffer - Input image buffer
 * @param {object} options - Optimization options
 * @returns {Promise<Buffer>} - Optimized WebP buffer
 */
async function optimizeImage(inputBuffer, options = {}) {
  const { maxWidth = DEFAULTS.maxWidth, quality = DEFAULTS.quality } = options;
  
  const metadata = await sharp(inputBuffer).metadata();
  
  let pipeline = sharp(inputBuffer);
  
  // Only resize if larger than maxWidth
  if (metadata.width > maxWidth) {
    pipeline = pipeline.resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }
  
  // Convert to WebP for best compression
  return pipeline
    .webp({ quality })
    .toBuffer();
}

/**
 * Get image metadata
 * @param {Buffer} inputBuffer - Input image buffer
 * @returns {Promise<object>} - Image metadata
 */
async function getMetadata(inputBuffer) {
  const metadata = await sharp(inputBuffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: inputBuffer.length,
    hasAlpha: metadata.hasAlpha
  };
}

/**
 * Convert image to different format
 * @param {Buffer} inputBuffer - Input image buffer
 * @param {string} format - Target format ('jpeg', 'png', 'webp', 'avif')
 * @param {object} options - Format-specific options
 * @returns {Promise<Buffer>} - Converted image buffer
 */
async function convertFormat(inputBuffer, format, options = {}) {
  const pipeline = sharp(inputBuffer);
  
  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      return pipeline.jpeg({ quality: options.quality || 80 }).toBuffer();
    case 'png':
      return pipeline.png({ compressionLevel: options.compression || 9 }).toBuffer();
    case 'webp':
      return pipeline.webp({ quality: options.quality || 80 }).toBuffer();
    case 'avif':
      return pipeline.avif({ quality: options.quality || 65 }).toBuffer();
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Process uploaded attachment image
 * Returns both thumbnail and optimized version
 * @param {Buffer} inputBuffer - Input image buffer
 * @param {string} filename - Original filename
 * @returns {Promise<object>} - Processed images and metadata
 */
async function processAttachment(inputBuffer, filename) {
  const ext = path.extname(filename).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
  
  if (!isImage) {
    return {
      isImage: false,
      original: inputBuffer
    };
  }
  
  const [thumbnail, optimized, metadata] = await Promise.all([
    createThumbnail(inputBuffer),
    optimizeImage(inputBuffer),
    getMetadata(inputBuffer)
  ]);
  
  return {
    isImage: true,
    thumbnail,
    optimized,
    metadata,
    savings: {
      original: inputBuffer.length,
      optimized: optimized.length,
      saved: inputBuffer.length - optimized.length,
      percentage: Math.round((1 - optimized.length / inputBuffer.length) * 100)
    }
  };
}

module.exports = {
  createThumbnail,
  createPreview,
  optimizeImage,
  getMetadata,
  convertFormat,
  processAttachment,
  DEFAULTS
};
