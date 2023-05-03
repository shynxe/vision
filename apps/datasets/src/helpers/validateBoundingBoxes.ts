import { BoundingBox } from '../schemas/image.schema';

export default function validateBoundingBoxes(
  boundingBoxes: BoundingBox[],
): void {
  if (!Array.isArray(boundingBoxes)) {
    throw new Error('boundingBoxes must be an array');
  }
  for (const bbox of boundingBoxes) {
    if (
      typeof bbox.x !== 'number' ||
      typeof bbox.y !== 'number' ||
      typeof bbox.width !== 'number' ||
      typeof bbox.height !== 'number' ||
      typeof bbox.label !== 'string' ||
      bbox.label.trim().length === 0
    ) {
      throw new Error(
        'Each bounding box must have numeric x, y, width, height values and a non-empty label string',
      );
    }
    if (
      bbox.x < 0 ||
      bbox.x > 1 ||
      bbox.y < 0 ||
      bbox.y > 1 ||
      bbox.width < 0 ||
      bbox.width > 1 ||
      bbox.height < 0 ||
      bbox.height > 1
    ) {
      throw new Error(
        'Bounding box coordinates and dimensions must be a percentage (0-1)',
      );
    }
  }
}
