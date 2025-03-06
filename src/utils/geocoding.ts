// This file now re-exports from our centralized serverComms module
import { type Coordinates } from '@/types';

export {
  geocodeAddress,
  createBoundingBox
} from '@/lib/serverComms';

export type { Coordinates };
