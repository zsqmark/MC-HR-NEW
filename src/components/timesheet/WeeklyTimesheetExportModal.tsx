import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  X,
  Calendar,
  Check,
  Sparkles,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DAYS_OF_WEEK,
  compileStaffTimesheetRows,
  downloadWeeklyTimesheetExcel,
  PICTURE_REFERENCE_DATA,
  StaffWeeklyTimesheetRow,
} from '../../utils/timesheetExport';

interface WeeklyTimesheetExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDateRange?: string;
}

export const WeeklyTimesheetExportModal: React.FC<WeeklyTimesheetExportModalProps> = ({
  isOpen,
  onClose,
  defaultDateRange = '03/08/2026 - 09/08/2026',
}) => {
  const { staffUsers, shifts, clockRecords } = useApp();

  const [dateRangeStr, setDateRangeStr] = useState(defaultDateRange);
  const [exportMode, setExportMode] = useState<
    'picture_reference' | 'hybrid' | 'clock_records' | 'shifts'
  >('picture_reference');
  const [includeEmptyRows, setIncludeEmptyRows] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Compute preview rows based on active exportMode
  const previewRows: StaffWeeklyTimesheetRow[] = useMemo(() => {
    if (exportMode === 'picture_reference') {
      return PICTURE_REFERENCE_DATA;
    }
    return compileStaffTimesheetRows(staffUsers, shifts, clockRecords, exportMode);
  }, [exportMode, staffUsers, shifts, clockRecords]);

  if (!isOpen) return null;

  const handleDownloadExcel = async () => {
    try {
      setIsExporting(true);
      await downloadWeeklyTimesheetExcel({
        weekDateRangeStr: dateRangeStr,
        title: 'Weekly Working Hours',
        footer: '@ Malaya Corner',
        staffUsers,
        shifts,
        clockRecords,
        mode: exportMode,
        includeEmptyRowsCount: includeEmptyRows ? 6 : 0,
      });
    } catch (err) {
      console.error('Failed to export Excel file:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCSV = () => {
    // Generate CSV in the exact same format
    const headerRow1 = [
      '',
      'MON', '',
      'TUE', '',
      'WED', '',
      'THU', '',
      'FRI', '',
      'SAT', '',
      'SUN', '',
    ];
    const headerRow2 = [
      'Employee',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
      'Start', 'Finish',
    ];

    const dataRows = previewRows.map((r) => {
      const row = [r.staffName];
      DAYS_OF_WEEK.forEach((day) => {
        const pairs = r.days[day] || [];
        const starts = pairs.map((p) => p.start).join(' / ');
        const finishes = pairs.map((p) => p.finish).join(' / ');
        row.push(starts, finishes);
      });
      return row;
    });

    const csvLines = [
      `"Weekly Working Hours",,,,,,,,,,,,,"${dateRangeStr}"`,
      '',
      headerRow1.map((c) => `"${c}"`).join(','),
      headerRow2.map((c) => `"${c}"`).join(','),
      ...dataRows.map((r) => r.map((c) => `"${c}"`).join(',')),
      '',
      '"@ Malaya Corner"',
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Malaya_Corner_Weekly_Working_Hours_${dateRangeStr.replace(/[\/\s]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Weekly Timesheet Excel Export</h2>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  .xlsx
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Exact layout modeled after Malaya Corner's weekly working hours roster format.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Preset / Mode */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Roster & Hours Source:
            </label>
            <select
              value={exportMode}
              onChange={(e) => setExportMode(e.target.value as any)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="picture_reference">
                Reference Sheet (From Attached Pictures: 03/08 - 09/08)
              </option>
              <option value="hybrid">
                Live App Sync (Actual Clock Punches + Published Roster)
              </option>
              <option value="shifts">Published Roster Schedule Only</option>
              <option value="clock_records">Clock Punches (Actual Time Logged) Only</option>
            </select>
          </div>

          {/* Date Range String */}
          <div>
            <label className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Week Date Range Label:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dateRangeStr}
                onChange={(e) => setDateRangeStr(e.target.value)}
                placeholder="03/08/2026 - 09/08/2026"
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setDateRangeStr('03/08/2026 - 09/08/2026')}
                title="Reset to 03/08/2026 - 09/08/2026"
                className="px-2 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold whitespace-nowrap"
              >
                03/08
              </button>
              <button
                type="button"
                onClick={() => setDateRangeStr('07/09/2026 - 13/09/2026')}
                title="Use Current Week"
                className="px-2 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold whitespace-nowrap"
              >
                07/09
              </button>
            </div>
          </div>

          {/* Extra Options */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={includeEmptyRows}
                onChange={(e) => setIncludeEmptyRows(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
              />
              <span>Include Blank Template Grid Rows (matches printed sheet)</span>
            </label>
            <div className="text-[11px] text-slate-500">
              Adds empty bordered rows for manual annotations & shift adds.
            </div>
          </div>
        </div>

        {/* Live Visual Preview Section */}
        <div className="p-4 flex-1 overflow-auto bg-slate-100">
          <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm min-w-[900px]">
            {/* Sheet Top Title Bar */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Weekly Working Hours
                </h1>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold border border-slate-200">
                  Malaya Corner Staff Schedule
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 tracking-wider">
                {dateRangeStr}
              </div>
            </div>

            {/* The Grid Table */}
            <div className="border-2 border-slate-900 rounded-none overflow-hidden text-[11px]">
              <table className="w-full border-collapse">
                <thead>
                  {/* Header Row 1: Days */}
                  <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 font-extrabold text-center">
                    <th className="p-2 border-r-2 border-slate-900 w-28 bg-slate-100">
                      Employee
                    </th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th
                        key={day}
                        colSpan={2}
                        className="p-1.5 border-r-2 border-slate-900 last:border-r-0 bg-slate-100"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                  {/* Header Row 2: Start / Finish */}
                  <tr className="bg-slate-50 border-b-2 border-slate-900 text-slate-700 font-bold text-center text-[10px]">
                    <th className="p-1 border-r-2 border-slate-900 bg-slate-50"></th>
                    {DAYS_OF_WEEK.map((day) => (
                      <React.Fragment key={day}>
                        <th className="p-1 border-r border-slate-300 w-16 bg-slate-50">Start</th>
                        <th className="p-1 border-r-2 border-slate-900 last:border-r-0 w-16 bg-slate-50">
                          Finish
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2 font-bold text-slate-900 text-center border-r-2 border-slate-900 bg-slate-50/40">
                        {row.staffName}
                      </td>
                      {DAYS_OF_WEEK.map((day) => {
                        const pairs = row.days[day] || [];
                        return (
                          <React.Fragment key={day}>
                            <td className="p-1.5 text-center font-mono text-slate-800 border-r border-slate-300">
                              {pairs.length > 0 ? (
                                <div className="space-y-0.5">
                                  {pairs.map((p, pIdx) => (
                                    <div key={pIdx} className="leading-tight">
                                      {p.start}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </td>
                            <td className="p-1.5 text-center font-mono text-slate-800 border-r-2 border-slate-900 last:border-r-0">
                              {pairs.length > 0 ? (
                                <div className="space-y-0.5">
                                  {pairs.map((p, pIdx) => (
                                    <div key={pIdx} className="leading-tight">
                                      {p.finish}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Empty template rows if enabled */}
                  {includeEmptyRows &&
                    Array.from({ length: 4 }).map((_, emptyIdx) => (
                      <tr key={`empty-${emptyIdx}`} className="h-8 bg-white">
                        <td className="p-2 border-r-2 border-slate-900"></td>
                        {DAYS_OF_WEEK.map((day) => (
                          <React.Fragment key={day}>
                            <td className="p-1 border-r border-slate-300"></td>
                            <td className="p-1 border-r-2 border-slate-900 last:border-r-0"></td>
                          </React.Fragment>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Sheet Footer */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-600 font-bold">
              <div>@ Malaya Corner</div>
              <div className="text-[11px] font-normal text-slate-400">
                Printed in Landscape • Fits 1-page wide
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Exports a native Microsoft Excel <strong>.xlsx</strong> file with merged headers, bold
              day titles, centered start/finish punches, and landscape layout.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-4 py-2 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadExcel}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs transition-all shadow-md shadow-emerald-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExporting ? 'Generating Excel...' : 'Download Excel (.xlsx)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
