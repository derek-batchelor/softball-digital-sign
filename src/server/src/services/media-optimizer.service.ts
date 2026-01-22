import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

export async function ensureDirExists(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

export async function savePhotoAsWebp(
  file: Express.Multer.File,
  destDir: string,
  urlPrefix: string,
  quality: number = 80,
): Promise<{ filePath: string; filename: string; absolutePath: string }> {
  await ensureDirExists(destDir);

  const baseName = parse(file.originalname).name.replaceAll(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${Date.now()}-${baseName}.webp`;
  const absolutePath = join(destDir, filename);

  await sharp(file.buffer).rotate().webp({ quality }).toFile(absolutePath);

  return {
    filePath: `${urlPrefix}${filename}`,
    filename,
    absolutePath,
  };
}
