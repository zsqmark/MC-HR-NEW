import ExcelJS from 'exceljs';
import { StaffUser, ShiftSlot, ClockRecord, DayOfWeek } from '../types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export interface ShiftTimePair {
  start: string;
  finish: string;
}

export interface StaffWeeklyTimesheetRow {
  staffId?: string;
  staffName: string;
  position?: string;
  days: Record<DayOfWeek, ShiftTimePair[]>;
}

export interface ExportWeeklyTimesheetOptions {
  weekDateRangeStr?: string; // e.g., '03/08/2026 - 09/08/2026'
  title?: string; // e.g., 'Weekly Working Hours'
  footer?: string; // e.g., '@ Malaya Corner'
  staffUsers?: StaffUser[];
  shifts?: ShiftSlot[];
  clockRecords?: ClockRecord[];
  mode?: 'picture_reference' | 'clock_records' | 'shifts' | 'hybrid';
  includeEmptyRowsCount?: number;
}

// Exact weekly roster & punches matching the attached pictures (03/08/2026 - 09/08/2026)
export const PICTURE_REFERENCE_DATA: StaffWeeklyTimesheetRow[] = [
  {
    staffName: 'John',
    position: 'Wait Staff',
    days: {
      MON: [{ start: '11:15', finish: '14:45' }],
      TUE: [{ start: '18:00', finish: '22:00' }],
      WED: [{ start: '11:15', finish: '15:00' }],
      THU: [{ start: '11:15', finish: '15:00' }],
      FRI: [{ start: '11:30', finish: '14:30' }],
      SAT: [{ start: '17:15', finish: '21:00' }],
      SUN: [{ start: '16:45', finish: '22:00' }],
    },
  },
  {
    staffName: "L'Erica",
    position: 'Wait Staff',
    days: {
      MON: [
        { start: '11:15', finish: '14:45' },
        { start: '16:45', finish: '21:45' },
      ],
      TUE: [
        { start: '11:15', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      WED: [],
      THU: [],
      FRI: [{ start: '11:15', finish: '14:45' }],
      SAT: [
        { start: '11:15', finish: '14:15' },
        { start: '16:45', finish: '21:30' },
      ],
      SUN: [{ start: '11:15', finish: '14:45' }],
    },
  },
  {
    staffName: 'Mark.M',
    position: 'Manager',
    days: {
      MON: [
        { start: '11:30', finish: '14:30' },
        { start: '16:45', finish: '20:30' },
      ],
      TUE: [
        { start: '11:15', finish: '14:45' },
        { start: '17:15', finish: '22:00' },
      ],
      WED: [],
      THU: [],
      FRI: [
        { start: '11:15', finish: '14:30' },
        { start: '16:45', finish: '22:15' },
      ],
      SAT: [{ start: '12:00', finish: '14:45' }],
      SUN: [],
    },
  },
  {
    staffName: 'Manuel',
    position: 'Kitchen Hand / Runner',
    days: {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [{ start: '16:45', finish: '21:30' }],
      SAT: [
        { start: '11:30', finish: '14:30' },
        { start: '18:00', finish: '22:30' },
      ],
      SUN: [
        { start: '11:15', finish: '14:00' },
        { start: '18:00', finish: '21:45' },
      ],
    },
  },
  {
    staffName: 'Erica',
    position: 'Wait Staff',
    days: {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [{ start: '11:15', finish: '14:45' }],
      SUN: [],
    },
  },
  {
    staffName: 'IU',
    position: 'Wait Staff',
    days: {
      MON: [{ start: '17:15', finish: '21:45' }],
      TUE: [],
      WED: [{ start: '16:45', finish: '21:00' }],
      THU: [],
      FRI: [],
      SAT: [{ start: '16:45', finish: '22:30' }],
      SUN: [{ start: '16:45', finish: '21:45' }],
    },
  },
  {
    staffName: 'Kai',
    position: 'Bar Staff',
    days: {
      MON: [],
      TUE: [],
      WED: [
        { start: '11:15', finish: '14:30' },
        { start: '18:00', finish: '22:00' },
      ],
      THU: [
        { start: '11:15', finish: '14:45' },
        { start: '17:15', finish: '21:45' },
      ],
      FRI: [],
      SAT: [{ start: '18:00', finish: '22:30' }],
      SUN: [
        { start: '11:30', finish: '14:45' },
        { start: '18:00', finish: '21:45' },
      ],
    },
  },
  {
    staffName: 'Veronica',
    position: 'Wait Staff',
    days: {
      MON: [],
      TUE: [],
      WED: [],
      THU: [{ start: '16:45', finish: '21:00' }],
      FRI: [],
      SAT: [],
      SUN: [],
    },
  },
  {
    staffName: 'Maria',
    position: 'Wait Staff',
    days: {
      MON: [],
      TUE: [
        { start: '11:30', finish: '14:45' },
        { start: '16:45', finish: '21:00' },
      ],
      WED: [{ start: '17:15', finish: '22:00' }],
      THU: [{ start: '18:00', finish: '21:45' }],
      FRI: [],
      SAT: [],
      SUN: [{ start: '16:45', finish: '21:00' }],
    },
  },
  {
    staffName: 'Yen',
    position: 'Wait Staff',
    days: {
      MON: [{ start: '18:00', finish: '21:45' }],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [{ start: '17:45', finish: '22:15' }],
      SAT: [],
      SUN: [{ start: '17:15', finish: '21:00' }],
    },
  },
  // Picture 2 rows:
  {
    staffName: 'Mark',
    position: 'General Manager',
    days: {
      MON: [],
      TUE: [],
      WED: [
        { start: '11:30', finish: '15:00' },
        { start: '16:45', finish: '22:15' },
      ],
      THU: [
        { start: '11:30', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      FRI: [{ start: '17:15', finish: '22:15' }],
      SAT: [],
      SUN: [],
    },
  },
  {
    staffName: 'France',
    position: 'Wait Staff',
    days: {
      MON: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      TUE: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      WED: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:15' },
      ],
      THU: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:00' },
      ],
      FRI: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:30' },
      ],
      SAT: [
        { start: '11:00', finish: '14:45' },
        { start: '16:45', finish: '22:30' },
      ],
      SUN: [{ start: '11:15', finish: '14:45' }],
    },
  },
  {
    staffName: 'Yannie',
    position: 'Wait Staff',
    days: {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [{ start: '12:00', finish: '14:45' }],
    },
  },
];

/**
 * Compiles live app state into the row-by-row structure matching the weekly working hours grid.
 */
export function compileStaffTimesheetRows(
  staffUsers: StaffUser[],
  shifts: ShiftSlot[],
  clockRecords: ClockRecord[],
  mode: 'picture_reference' | 'clock_records' | 'shifts' | 'hybrid' = 'hybrid'
): StaffWeeklyTimesheetRow[] {
  if (mode === 'picture_reference') {
    return PICTURE_REFERENCE_DATA;
  }

  // Sort staff in familiar priority: Mark, John, L'Erica, Kai, Maria, Manuel, Erica, IU, Yannie, etc.
  const namePriority = [
    'John',
    "L'Erica",
    'Mark.M',
    'Mark',
    'Manuel',
    'Erica',
    'IU',
    'Kai',
    'Veronica',
    'Maria',
    'Yen',
    'France',
    'Yannie',
    'Bowie',
    'Marcus',
    'Chloe',
  ];

  const sortedStaff = [...staffUsers].sort((a, b) => {
    const idxA = namePriority.indexOf(a.firstName);
    const idxB = namePriority.indexOf(b.firstName);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.firstName.localeCompare(b.firstName);
  });

  return sortedStaff.map((staff) => {
    const daysData: Record<DayOfWeek, ShiftTimePair[]> = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
      SUN: [],
    };

    DAYS_OF_WEEK.forEach((day) => {
      const pairs: ShiftTimePair[] = [];

      // 1. Clock records for this staff & day
      if (mode === 'clock_records' || mode === 'hybrid') {
        const staffClockRecs = clockRecords.filter((rec) => {
          if (rec.staffId !== staff.id && rec.staffName !== `${staff.firstName} ${staff.lastName}` && rec.staffName !== staff.firstName) {
            return false;
          }
          // Infer day of week from date if available, or compare day
          if (rec.date) {
            try {
              const d = new Date(rec.date);
              const dayIndex = d.getDay(); // 0 is SUN, 1 is MON...
              const dayMap: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
              return dayMap[dayIndex] === day;
            } catch {
              return false;
            }
          }
          return false;
        });

        staffClockRecs.forEach((cr) => {
          if (cr.clockInTime) {
            pairs.push({
              start: cr.clockInTime,
              finish: cr.clockOutTime || '',
            });
          }
        });
      }

      // 2. Scheduled shifts for this staff & day
      if ((mode === 'shifts' || (mode === 'hybrid' && pairs.length === 0))) {
        const staffShifts = shifts.filter(
          (s) => s.assignedStaffId === staff.id && s.day === day && s.status === 'published'
        );

        // Sort lunch before dinner
        staffShifts.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

        staffShifts.forEach((s) => {
          pairs.push({
            start: s.startTime || '',
            finish: s.endTime || (s.shiftType === 'lunch' ? '15:00' : '21:30'),
          });
        });
      }

      daysData[day] = pairs;
    });

    return {
      staffId: staff.id,
      staffName: staff.firstName === 'Mark' && staff.role === 'manager' ? 'Mark.M' : staff.firstName,
      position: staff.position,
      days: daysData,
    };
  });
}

/**
 * Builds a styled ExcelJS workbook matching the exact look & feel of the attached pictures:
 * - Title: "Weekly Working Hours"
 * - Date Range: e.g. "03/08/2026 - 09/08/2026"
 * - Columns: Employee | MON (Start, Finish) | TUE (Start, Finish) | ... | SUN (Start, Finish)
 * - Footer: "@ Malaya Corner"
 */
export async function createWeeklyTimesheetWorkbook(options: ExportWeeklyTimesheetOptions = {}): Promise<ExcelJS.Workbook> {
  const {
    weekDateRangeStr = '03/08/2026 - 09/08/2026',
    title = 'Weekly Working Hours',
    footer = '@ Malaya Corner',
    staffUsers = [],
    shifts = [],
    clockRecords = [],
    mode = 'hybrid',
    includeEmptyRowsCount = 6,
  } = options;

  const rowsData = options.mode === 'picture_reference'
    ? PICTURE_REFERENCE_DATA
    : compileStaffTimesheetRows(staffUsers, shifts, clockRecords, mode);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Malaya Corner Management';
  workbook.lastModifiedBy = 'Malaya Corner';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Weekly Working Hours', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
    views: [{ showGridLines: true }],
  });

  // Set column widths
  // Col 1: Employee name
  // Col 2-15: 7 days x 2 cols (Start, Finish)
  worksheet.columns = [
    { key: 'employee', width: 18 }, // Col A
    { key: 'mon_start', width: 10 }, // Col B
    { key: 'mon_finish', width: 10 }, // Col C
    { key: 'tue_start', width: 10 }, // Col D
    { key: 'tue_finish', width: 10 }, // Col E
    { key: 'wed_start', width: 10 }, // Col F
    { key: 'wed_finish', width: 10 }, // Col G
    { key: 'thu_start', width: 10 }, // Col H
    { key: 'thu_finish', width: 10 }, // Col I
    { key: 'fri_start', width: 10 }, // Col J
    { key: 'fri_finish', width: 10 }, // Col K
    { key: 'sat_start', width: 10 }, // Col L
    { key: 'sat_finish', width: 10 }, // Col M
    { key: 'sun_start', width: 10 }, // Col N
    { key: 'sun_finish', width: 10 }, // Col O
  ];

  // Border styles
  const thinBorder: ExcelJS.Border = { style: 'thin', color: { argb: 'FF000000' } };
  const mediumBorder: ExcelJS.Border = { style: 'medium', color: { argb: 'FF000000' } };

  // Helper to apply borders to a cell
  const applyCellBorder = (
    cell: ExcelJS.Cell,
    top: ExcelJS.Border = thinBorder,
    left: ExcelJS.Border = thinBorder,
    bottom: ExcelJS.Border = thinBorder,
    right: ExcelJS.Border = thinBorder
  ) => {
    cell.border = { top, left, bottom, right };
  };

  // Row 1: Spacing
  worksheet.addRow([]);
  worksheet.getRow(1).height = 10;

  // Row 2: Top Title & Date Range
  const titleRow = worksheet.getRow(2);
  titleRow.height = 30;

  // Set Title in Col B through Col J
  worksheet.mergeCells('B2:J2');
  const titleCell = worksheet.getCell('B2');
  titleCell.value = title;
  titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Set Date Range in Col M through Col O
  worksheet.mergeCells('M2:O2');
  const dateCell = worksheet.getCell('M2');
  dateCell.value = weekDateRangeStr;
  dateCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF000000' } };
  dateCell.alignment = { vertical: 'middle', horizontal: 'right' };

  // Row 3: Spacing before table
  worksheet.addRow([]);
  worksheet.getRow(3).height = 8;

  // Row 4: Table Header 1 (Days of week)
  const header1Row = worksheet.getRow(4);
  header1Row.height = 24;

  // Employee header cell (A4:A5 merged)
  worksheet.mergeCells('A4:A5');
  const employeeHeaderCell = worksheet.getCell('A4');
  employeeHeaderCell.value = '';
  employeeHeaderCell.font = { name: 'Arial', size: 11, bold: true };
  employeeHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
  employeeHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' },
  };

  // Day columns (Col B to O)
  DAYS_OF_WEEK.forEach((day, index) => {
    const startColIndex = 2 + index * 2; // B=2, D=4, F=6, H=8, J=10, L=12, N=14
    const finishColIndex = startColIndex + 1;

    worksheet.mergeCells(4, startColIndex, 4, finishColIndex);
    const dayCell = worksheet.getCell(4, startColIndex);
    dayCell.value = day;
    dayCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
    dayCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dayCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    };
  });

  // Row 5: Table Header 2 (Start / Finish)
  const header2Row = worksheet.getRow(5);
  header2Row.height = 20;

  DAYS_OF_WEEK.forEach((_, index) => {
    const startColIndex = 2 + index * 2;
    const finishColIndex = startColIndex + 1;

    const startCell = worksheet.getCell(5, startColIndex);
    startCell.value = 'Start';
    startCell.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF000000' } };
    startCell.alignment = { vertical: 'middle', horizontal: 'center' };
    startCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    };

    const finishCell = worksheet.getCell(5, finishColIndex);
    finishCell.value = 'Finish';
    finishCell.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF000000' } };
    finishCell.alignment = { vertical: 'middle', horizontal: 'center' };
    finishCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    };
  });

  // Apply borders to Header Rows 4 and 5
  for (let c = 1; c <= 15; c++) {
    // Row 4
    const c4 = worksheet.getCell(4, c);
    const isDayStart = c >= 2 && c % 2 === 0;
    const isColA = c === 1;
    const isColO = c === 15;

    applyCellBorder(
      c4,
      mediumBorder, // top
      isColA ? mediumBorder : isDayStart ? mediumBorder : thinBorder, // left
      thinBorder, // bottom
      isColA ? mediumBorder : isColO ? mediumBorder : thinBorder // right
    );

    // Row 5
    const c5 = worksheet.getCell(5, c);
    applyCellBorder(
      c5,
      thinBorder, // top
      isColA ? mediumBorder : isDayStart ? mediumBorder : thinBorder, // left
      mediumBorder, // bottom (thick line separating header from data)
      isColA ? mediumBorder : isColO ? mediumBorder : thinBorder // right
    );
  }

  // Row 6 onwards: Employee Data Rows
  let currentRowIndex = 6;

  rowsData.forEach((row) => {
    const dataRow = worksheet.getRow(currentRowIndex);
    dataRow.height = 36; // Generous height to show split shift lines clearly

    // Col A: Employee Name
    const nameCell = worksheet.getCell(currentRowIndex, 1);
    nameCell.value = row.staffName;
    nameCell.font = { name: 'Arial', size: 11, bold: false, color: { argb: 'FF000000' } };
    nameCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Days cols
    DAYS_OF_WEEK.forEach((day, dIdx) => {
      const startColIndex = 2 + dIdx * 2;
      const finishColIndex = startColIndex + 1;

      const pairs = row.days[day] || [];
      const startCell = worksheet.getCell(currentRowIndex, startColIndex);
      const finishCell = worksheet.getCell(currentRowIndex, finishColIndex);

      if (pairs.length > 0) {
        startCell.value = pairs.map((p) => p.start).join('\n');
        finishCell.value = pairs.map((p) => p.finish).join('\n');
      } else {
        startCell.value = '';
        finishCell.value = '';
      }

      startCell.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      startCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

      finishCell.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };
      finishCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    // Apply borders for this employee row
    for (let c = 1; c <= 15; c++) {
      const cell = worksheet.getCell(currentRowIndex, c);
      const isColA = c === 1;
      const isDayStart = c >= 2 && c % 2 === 0;
      const isColO = c === 15;

      applyCellBorder(
        cell,
        thinBorder,
        isColA ? mediumBorder : isDayStart ? mediumBorder : thinBorder,
        thinBorder,
        isColA ? mediumBorder : isColO ? mediumBorder : thinBorder
      );
    }

    currentRowIndex++;
  });

  // Add empty template rows at the bottom (matching photos where extra empty grid rows exist)
  for (let emptyIdx = 0; emptyIdx < includeEmptyRowsCount; emptyIdx++) {
    const emptyRow = worksheet.getRow(currentRowIndex);
    emptyRow.height = 32;

    const isLastRow = emptyIdx === includeEmptyRowsCount - 1;

    for (let c = 1; c <= 15; c++) {
      const cell = worksheet.getCell(currentRowIndex, c);
      cell.value = '';
      const isColA = c === 1;
      const isDayStart = c >= 2 && c % 2 === 0;
      const isColO = c === 15;

      applyCellBorder(
        cell,
        thinBorder,
        isColA ? mediumBorder : isDayStart ? mediumBorder : thinBorder,
        isLastRow ? mediumBorder : thinBorder,
        isColA ? mediumBorder : isColO ? mediumBorder : thinBorder
      );
    }

    currentRowIndex++;
  }

  // Footer: "@ Malaya Corner" at bottom left
  currentRowIndex += 1; // 1 spacer row
  const footerRow = worksheet.getRow(currentRowIndex);
  footerRow.height = 20;

  const footerCell = worksheet.getCell(currentRowIndex, 1);
  footerCell.value = footer;
  footerCell.font = { name: 'Arial', size: 10, italic: true, bold: true, color: { argb: 'FF334155' } };
  footerCell.alignment = { vertical: 'middle', horizontal: 'left' };

  return workbook;
}

/**
 * Triggers the client-side download of the Excel file.
 */
export async function downloadWeeklyTimesheetExcel(options: ExportWeeklyTimesheetOptions = {}): Promise<void> {
  const workbook = await createWeeklyTimesheetWorkbook(options);
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;

  // Clean filename: e.g. Malaya_Corner_Weekly_Working_Hours_03-08-2026.xlsx
  const rangePart = (options.weekDateRangeStr || '03/08/2026')
    .split('-')[0]
    .trim()
    .replace(/\//g, '-');
  anchor.download = `Malaya_Corner_Weekly_Working_Hours_${rangePart}.xlsx`;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
