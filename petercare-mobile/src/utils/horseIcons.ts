import { ImageSourcePropType } from 'react-native';
import { HorseColor } from '../types/horse';

export const HORSE_COLORS: { value: HorseColor; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black' },
  { value: 'baby', label: 'Baby' },
];

const HORSE_ICON_SOURCES: Record<HorseColor, ImageSourcePropType> = {
  white: require('../../assets/horses/white-horse.png'),
  brown: require('../../assets/horses/brown-horse.png'),
  black: require('../../assets/horses/black-horse.png'),
  baby: require('../../assets/horses/baby-horse.png'),
};

export function getHorseIcon(color?: HorseColor): ImageSourcePropType {
  return HORSE_ICON_SOURCES[color ?? 'brown'];
}
