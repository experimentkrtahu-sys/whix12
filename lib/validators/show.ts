import { ShowStatus, ShowType } from '@prisma/client';
import { z } from 'zod';

export const showSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  synopsis: z.string().min(20),
  posterUrl: z.string().url(),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  releaseYear: z.coerce.number().int().min(1900).max(2100),
  status: z.nativeEnum(ShowStatus),
  type: z.nativeEnum(ShowType)
});
