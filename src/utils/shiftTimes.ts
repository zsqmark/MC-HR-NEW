import { ShiftType } from '../types';

export interface ShiftWindowConfig {
  shiftType: ShiftType;
  name: string;
  minTime: string; // 24h '11:00' or '16:30'
  maxTime: string; // 24h '14:30' or '22:00'
  minMinutes: number;
  maxMinutes: number;
  displayWindow: string; // '11:00am – 2:30pm' or '4:30pm – 10:00pm'
  defaultStart: string;
  presets: string[];
}

export const SHIFT_WINDOWS: Record<ShiftType, ShiftWindowConfig> = {
  lunch: {
    shiftType: 'lunch',
    name: 'Lunch',
    minTime: '11:00',
    maxTime: '14:30',
    minMinutes: 11 * 60, // 660
    maxMinutes: 14 * 60 + 30, // 870
    displayWindow: '11:00am – 2:30pm',
    defaultStart: '11:15',
    presets: ['11:00', '11:15', '11:30', '11:45', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
  },
  dinner: {
    shiftType: 'dinner',
    name: 'Dinner',
    minTime: '16:30',
    maxTime: '22:00',
    minMinutes: 16 * 60 + 30, // 990
    maxMinutes: 22 * 60, // 1320
    displayWindow: '4:30pm – 10:00pm',
    defaultStart: '16:45',
    presets: ['16:30', '16:45', '17:00', '17:15', '17:30', '18:00', '18:30', '19:00', '20:00', '21:00', '22:00'],
  },
};

/**
 * Converts a 24-hour time string ("HH:mm") or 12h string ("11:15 AM") into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();

  // Check 12h format e.g. "11:15 am" or "4:30 pm"
  const match12h = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (match12h) {
    let hours = parseInt(match12h[1], 10);
    const minutes = parseInt(match12h[2], 10);
    const isPm = match12h[3].toLowerCase() === 'pm';
    if (hours === 12) {
      hours = isPm ? 12 : 0;
    } else if (isPm) {
      hours += 12;
    }
    return hours * 60 + minutes;
  }

  // Check standard 24h format e.g. "11:15" or "16:45"
  const match24h = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24h) {
    const hours = parseInt(match24h[1], 10);
    const minutes = parseInt(match24h[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  return null;
}

/**
 * Formats "11:15" into "11:15 AM", "16:45" into "4:45 PM"
 */
export function formatTime12h(timeStr: string): string {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  const hours24 = Math.floor(mins / 60);
  const minutes = mins % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutePad = minutes.toString().padStart(2, '0');
  return `${hours12}:${minutePad} ${period}`;
}

/**
 * Validates whether a shift start time strictly falls within the allowed boundaries:
 * - Lunch: 11:00am to 2:30pm (11:00 – 14:30)
 * - Dinner: 4:30pm to 10:00pm (16:30 – 22:00)
 */
export function validateShiftStartTime(
  shiftType: ShiftType,
  timeStr: string
): { isValid: boolean; errorMessage?: string; formattedTime?: string } {
  const mins = parseTimeToMinutes(timeStr);
  const config = SHIFT_WINDOWS[shiftType];

  if (mins === null) {
    return {
      isValid: false,
      errorMessage: `Please enter a valid start time in HH:mm format (e.g. ${config.defaultStart}).`,
    };
  }

  if (mins < config.minMinutes || mins > config.maxMinutes) {
    return {
      isValid: false,
      errorMessage: `${config.name} shifts can only start between ${config.displayWindow} (${config.minTime} – ${config.maxTime}).`,
    };
  }

  // Convert to clean 24h format "HH:mm"
  const hours = Math.floor(mins / 60).toString().padStart(2, '0');
  const minutes = (mins % 60).toString().padStart(2, '0');
  const clean24h = `${hours}:${minutes}`;

  return {
    isValid: true,
    formattedTime: clean24h,
  };
}

/**
 * Validates if a time string ("HH:mm") ends strictly with :00, :15, :30, or :45.
 */
export function isValid15MinuteTime(timeStr: string): boolean {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return false;
  const minutePart = mins % 60;
  return minutePart === 0 || minutePart === 15 || minutePart === 30 || minutePart === 45;
}

/**
 * Rounds any Date object or "HH:mm" time string to the nearest 15-minute interval (:00, :15, :30, :45).
 * 
 * Rounding threshold:
 * 00 - 07 mins -> :00
 * 08 - 22 mins -> :15
 * 23 - 37 mins -> :30
 * 38 - 52 mins -> :45
 * 53 - 59 mins -> :00 of the following hour
 */
export function roundTimeTo15Minutes(dateOrTime: Date | string = new Date()): string {
  let hours = 0;
  let minutes = 0;

  if (typeof dateOrTime === 'string') {
    const parsed = parseTimeToMinutes(dateOrTime);
    if (parsed !== null) {
      hours = Math.floor(parsed / 60);
      minutes = parsed % 60;
    } else {
      const parts = dateOrTime.split(':').map(Number);
      hours = isNaN(parts[0]) ? 0 : parts[0];
      minutes = isNaN(parts[1]) ? 0 : parts[1];
    }
  } else {
    hours = dateOrTime.getHours();
    minutes = dateOrTime.getMinutes();
  }

  const roundedM = Math.round(minutes / 15) * 15;
  if (roundedM === 60) {
    hours = (hours + 1) % 24;
    minutes = 0;
  } else {
    minutes = roundedM;
  }

  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
}
