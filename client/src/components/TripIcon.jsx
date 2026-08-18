import React from 'react';
import {
  Plane,
  TreePalm,
  Mountain,
  Umbrella,
  Compass,
  Castle,
  Landmark,
  Sun,
  Route,
  Building2,
  Tent,
  Activity,
  Disc
} from 'lucide-react';

const iconMap = {
  // Emojis mapping
  '✈️': Plane,
  '✈': Plane,
  '🌴': TreePalm,
  '🏔️': Mountain,
  '🏖️': Umbrella,
  '🗼': Compass,
  '🏯': Castle,
  '🗽': Landmark,
  '🏜️': Sun,
  '🌉': Route,
  '🏙️': Building2,
  '🏕️': Tent,
  '🏟️': Activity,
  '🎡': Disc,

  // String names mapping
  'Plane': Plane,
  'PalmTree': TreePalm,
  'Mountain': Mountain,
  'Umbrella': Umbrella,
  'Compass': Compass,
  'Castle': Castle,
  'Landmark': Landmark,
  'Sun': Sun,
  'Route': Route,
  'Building2': Building2,
  'Tent': Tent,
  'Activity': Activity,
  'Disc': Disc
};

export default function TripIcon({ name, className = '', size }) {
  const IconComponent = iconMap[name] || Plane;
  return <IconComponent className={className} size={size} />;
}
