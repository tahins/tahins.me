import sharp from 'sharp';
import astroSharp from 'astro/assets/services/sharp';

const WEBP_QUALITY = 82;
const WEBP_EFFORT = 6;

const fitMap = {
  fill: 'fill',
  contain: 'inside',
  cover: 'cover',
  none: 'outside',
  'scale-down': 'inside',
  outside: 'outside',
  inside: 'inside',
};

function parseQuality(quality) {
  if (quality == null || quality === '') return undefined;
  const numeric = Number.parseInt(quality, 10);
  if (!Number.isNaN(numeric)) return numeric;
  return { low: 25, mid: 50, high: 80, max: 100 }[quality];
}

const service = {
  ...astroSharp,
  async transform(inputBuffer, transformOptions, config) {
    const transform = transformOptions;
    if (transform.format === 'svg') return { data: inputBuffer, format: 'svg' };

    const result = sharp(inputBuffer, {
      failOn: 'none',
      pages: -1,
      limitInputPixels: config.service.config.limitInputPixels,
    });
    result.rotate();
    const { format } = await result.metadata();
    const kernel = config.service.config.kernel;
    const resize = { kernel, withoutEnlargement: true };

    if (transform.width && transform.height && transform.fit) {
      result.resize({
        ...resize,
        width: Math.round(transform.width),
        height: Math.round(transform.height),
        fit: fitMap[transform.fit] ?? 'inside',
        position: transform.position,
      });
    } else if (transform.height && !transform.width) {
      result.resize({ ...resize, height: Math.round(transform.height) });
    } else if (transform.width) {
      result.resize({ ...resize, width: Math.round(transform.width) });
    }

    if (transform.background) {
      result.flatten({ background: transform.background });
    }

    if (transform.format) {
      const quality = parseQuality(transform.quality);
      if (transform.format === 'webp') {
        result.webp({
          quality: typeof quality === 'number' ? quality : WEBP_QUALITY,
          effort: WEBP_EFFORT,
          loop: format === 'gif' ? 0 : undefined,
        });
      } else {
        result.toFormat(transform.format, { quality });
      }
    }

    const { data, info } = await result.toBuffer({ resolveWithObject: true });
    const needsCopy = 'buffer' in data && data.buffer instanceof SharedArrayBuffer;
    return {
      data: needsCopy ? new Uint8Array(data) : data,
      format: info.format,
    };
  },
};

export default service;
