import React from 'react';
import { Wheat, ClipboardList } from 'lucide-react-native';
import { TimelineEvent } from '../../types/events';
import HorseIconRow from '../horses/HorseIconRow';

interface EventTypeIconProps {
  event: TimelineEvent;
  size?: number;
  horseIconSize?: number;
  maxHorseVisible?: number;
}

export default function EventTypeIcon({
  event,
  size = 22,
  horseIconSize,
  maxHorseVisible = 4,
}: EventTypeIconProps) {
  const color = '#2C3E50';
  const horseSize = horseIconSize ?? size + 6;

  switch (event.kind) {
    case 'feeding':
      return <Wheat size={size} color={color} />;
    case 'task':
      return <ClipboardList size={size} color={color} />;
    case 'ride':
      return (
        <HorseIconRow
          colors={event.data.horses.map((h) => h.color)}
          size={horseSize}
          maxVisible={maxHorseVisible}
        />
      );
    case 'treatment':
      return (
        <HorseIconRow
          colors={event.data.horses.map((h) => h.color)}
          size={horseSize}
          maxVisible={maxHorseVisible}
        />
      );
    default:
      return null;
  }
}
