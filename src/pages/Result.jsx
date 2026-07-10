import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileSpreadsheet, FileText, ZoomIn, ZoomOut, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const DIAGNOSTIC_MAP = [
  { key: 'missingClasses', label: 'Missing Classes (Dropped)', weight: 10000, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', bar: 'bg-rose-500' },
  { key: 'clashes', label: 'Teacher Double-Bookings', weight: 5000, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-400' },
  { key: 'roomOverflows', label: 'Room Capacity Exceeded', weight: 500, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-400' },
  { key: 'syncErrors', label: 'Combined Class Sync Failures', weight: 500, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-400' },
  { key: 'dailyDuplicates', label: 'Daily Subject Duplicates', weight: 500, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-400' },
  { key: 'lunchViolations', label: 'Lunch Break Violations', weight: 50, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-400' },
  { key: 'teacherOverload', label: 'Teacher Workload Overload', weight: 10, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', bar: 'bg-slate-400' },
];

const getSubjectStyle = (subjectName) => {
  if (!subjectName || subjectName === 'Free') {
    return 'bg-transparent text-slate-300 border-slate-100';
  }
  const styles = [
    'bg-blue-50/80 border-l-[4px] border-l-blue-600 text-slate-800',
    'bg-emerald-50/80 border-l-[4px] border-l-emerald-600 text-slate-800',
    'bg-purple-50/80 border-l-[4px] border-l-purple-600 text-slate-800',
    'bg-amber-50/80 border-l-[4px] border-l-amber-500 text-slate-800',
    'bg-rose-50/80 border-l-[4px] border-l-rose-600 text-slate-800',
    'bg-indigo-50/80 border-l-[4px] border-l-indigo-600 text-slate-800',
    'bg-cyan-50/80 border-l-[4px] border-l-cyan-600 text-slate-800',
  ];
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  return styles[Math.abs(hash) % styles.length];
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [zoom, setZoom] = useState(1);
  const [isTableOpen, setIsTableOpen] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  if (!location.state) return <Navigate to="/config" replace />;

  const { schedule, penalty, breakdown, params, batches, combined, teachers } = location.state;
  const perfect = penalty === 0;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  // ── LOGIC: Parse 2D Tensor ──
  const resolveCell = (subjectId) => {
    const sId = Number(subjectId);
    if (sId === 0) return { subj: null, teacher: null, isComb: false, teacherId: null };

    for (const b of batches) {
      const s = b.subjects.find(s => Number(s.id) === sId);
      if (s) {
        const t = teachers?.find(t => t.id === s.teacher_id);
        return { subj: s.name, teacher: t?.name || s.teacher_id, isComb: false, teacherId: s.teacher_id };
      }
    }
    
    const ci = sId - 1000;
    if (ci >= 0 && combined[ci]) {
      const c = combined[ci];
      const t = teachers?.find(t => t.id === c.teacher_id);
      return { subj: c.name, teacher: t?.name || c.teacher_id, isComb: true, teacherId: c.teacher_id };
    }
    return { subj: 'Unknown', teacher: '?', isComb: false, teacherId: null };
  };

  const getRoomMapForSlot = (slotIndex) => {
    const row = schedule[slotIndex] || [];
    const activeTeacherIds = [];
    row.forEach(subjectId => {
      if (subjectId !== 0) {
        const { teacherId } = resolveCell(subjectId);
        if (teacherId && !activeTeacherIds.includes(teacherId)) activeTeacherIds.push(teacherId);
      }
    });
    const roomMap = {};
    activeTeacherIds.forEach((tId, i) => roomMap[tId] = `R-${i + 1}`);
    return roomMap;
  };

  // ── EXPORTS ──
  const handleDownloadExcel = () => {
    const days = parseInt(params.days);
    const periods = parseInt(params.periods);
    const lunchIndex = parseInt(params.breakPeriod) - 1;

    const header = ['Day', 'Period', ...batches.map((b, i) => b.name || `Batch ${i + 1}`)];
    const rows = [header];

    for (let d = 0; d < days; d++) {
      for (let p = 0; p < periods; p++) {
        const slotIndex = d * periods + p;
        const isLunch = p === lunchIndex;
        const periodLabel = isLunch ? 'Lunch' : `P${p + 1}`;
        const dayLabel = DAY_NAMES[d] || `Day ${d + 1}`;
        const roomMap = getRoomMapForSlot(slotIndex);
        
        const cells = batches.map((_, bIdx) => {
          if (isLunch) return '— Lunch break —';
          const subjectId = schedule[slotIndex]?.[bIdx];
          if (!subjectId || subjectId === 0) return '—';
          
          const { subj, teacher, isComb, teacherId } = resolveCell(subjectId);
          const room = roomMap[teacherId];
          return `${subj} (${teacher}) [${room}]${isComb ? ' [COMB]' : ''}`;
        });
        rows.push([dayLabel, periodLabel, ...cells]);
      }
      rows.push([]); 
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 10 }, ...batches.map(() => ({ wch: 26 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    XLSX.writeFile(wb, 'Optimized_Timetable.xlsx');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <>
      {/* GLOBAL PRINT STYLES - Eliminates whitespace & forces bottom branding via TFoot */}
      {/* GLOBAL PRINT STYLES - Eliminates whitespace, hides browser URL/Navbars, forces bottom branding */}
      <style>{`
        @media print {
          @page { 
            size: A3 landscape; 
            margin: 0 !important; /* Kills default browser URL and Date headers */
          }
          body, html {
            background-color: white !important;
            margin: 0 !important;
            padding: 12mm !important; /* Re-applies safe print margin natively */
            height: auto !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          /* Forcefully hide any outer layouts, navbars, or headers */
          header, nav, aside, .top-bar {
            display: none !important;
          }
          /* Strip all constraints that cause blank pages */
          .print-normalize-page {
            display: block !important;
            min-height: 0 !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            transform: none !important;
            animation: none !important;
          }
          /* Force table to fit */
          .print-normalize-table {
            zoom: 1 !important;
            transform: none !important;
            min-width: 100% !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
            display: table !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-hide {
            display: none !important;
          }
          /* Page Break Controls */
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>

      <div className="min-h-screen bg-[#f4f7fb] text-slate-900 font-sans p-4 md:p-8 lg:p-12 pb-32 print-normalize-page">
        
        {/* Top Bar Actions - HIDDEN ON PRINT */}
        <div className="max-w-[1400px] mx-auto mb-6 flex items-center justify-between print-hide">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white font-mono font-bold text-sm w-8 h-8 flex items-center justify-center rounded-lg">GA</div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Timetable Results</h1>
          </div>
          <button 
            onClick={() => navigate('/config')} 
            className="bg-white border border-slate-300 text-slate-700 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-slate-50 transition shadow-sm flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Editor
          </button>
        </div>

        <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 print-normalize-page print:space-y-0 print:w-full print:max-w-none">
          
          {/* PENALTY CARD - HIDDEN ON PRINT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 print-hide">
            <div className="flex-1">
              <div className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Optimization Penalty Score
              </div>
              
              <div className="flex items-baseline gap-6 flex-wrap">
                <span className={`text-5xl font-black leading-none ${perfect ? 'text-teal-600' : 'text-rose-600'}`}>
                  {penalty}
                </span>
                
                {perfect ? (
                  <span className="bg-teal-50 text-teal-600 px-4 py-1.5 rounded-full text-[15px] font-bold border border-teal-100 flex items-center gap-1.5">
                    ✓ Perfect Schedule
                  </span>
                ) : (
                  <div className="flex flex-col gap-1.5 ml-2 border-l-2 border-slate-100 pl-4 py-1">
                    <span className="flex items-center text-rose-700 font-bold bg-rose-50 px-3 py-1 rounded-lg w-fit border border-rose-200 mb-1">
                      <AlertTriangle className="w-4 h-4 mr-1.5" /> Constraints Violated
                    </span>
                    <span className="text-slate-500 text-sm font-medium">
                      The engine finished, but some constraints could not be met structurally. See breakdown below.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DIAGNOSTIC BREAKDOWN WITH VISUAL GRAPH - HIDDEN ON PRINT */}
          {!perfect && breakdown && (
            <div className="border border-rose-200 rounded-2xl overflow-hidden transition-all duration-300 print-hide">
              <button 
                onClick={() => setShowDiagnostics(!showDiagnostics)} 
                className="w-full flex items-center justify-between bg-rose-50/50 hover:bg-rose-50 px-6 py-4 transition-colors"
              >
                <div className="flex items-center text-rose-800 font-bold">
                  <Activity className="w-5 h-5 mr-2" /> Diagnostic Error Breakdown & Graph
                </div>
                <div className="text-rose-500 bg-white p-1 rounded-full border border-rose-200 shadow-sm">
                  {showDiagnostics ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${showDiagnostics ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-6 bg-white border-t border-rose-100 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {DIAGNOSTIC_MAP.map(({ key, label, weight, color, bg, border, bar }) => {
                      const count = breakdown[key];
                      if (!count || count === 0) return null;
                      
                      const errorScore = count * weight;
                      const percent = Math.min(100, (errorScore / penalty) * 100);

                      return (
                        <div key={key} className={`flex flex-col p-4 rounded-xl border ${bg} ${border}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className={`font-bold ${color}`}>{label}</p>
                              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1">
                                {weight} pts × {count}
                              </p>
                            </div>
                            <div className={`text-xl font-black ${color} bg-white px-3 py-1 rounded-lg shadow-sm border ${border}`}>
                              {errorScore}
                            </div>
                          </div>
                          <div className="w-full bg-white rounded-full h-2 mt-auto overflow-hidden shadow-inner border border-slate-200">
                            <div className={`h-full ${bar} rounded-full`} style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIMETABLE PREVIEW CARD */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col print-normalize-page print:border-none print:shadow-none print:w-full">
            
            {/* Header with Export Options - HIDDEN ON PRINT */}
            <div className="p-4 md:p-5 flex flex-wrap gap-4 items-center justify-between border-b border-slate-200 bg-white print-hide">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-sm"><BookOpen className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Generated Timetable Preview</h2>
                  <div className="text-[12px] font-medium text-slate-400 mt-0.5">
                    {params.days} days × {params.periods} periods · {batches.length} batch(es)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0c6132] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Excel
                  </button>
                  <button 
                    onClick={handlePrintPDF}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all"
                    title="Uses browser print functionality. Select 'Save as PDF' (Uncheck default browser headers)."
                  >
                    <FileText className="w-4 h-4" /> PDF
                  </button>
                </div>

                {isTableOpen && (
                  <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                    <button onClick={handleZoomOut} className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-[13px] font-bold text-slate-700 w-12 text-center font-mono select-none">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors"><ZoomIn className="w-4 h-4" /></button>
                  </div>
                )}
                <button onClick={() => setIsTableOpen(!isTableOpen)} className="p-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                  {isTableOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* TABLE CONTAINER - Visible on Print */}
            {isTableOpen && (
              <div className="overflow-x-auto bg-[#f8fafc] p-6 custom-scrollbar transition-all duration-300 print-normalize-page print:w-full">
                <div style={{ zoom: zoom, transformOrigin: 'top left' }} className="print-normalize-table min-w-[900px]">
                  <table className="w-full text-left border-collapse bg-white border border-slate-300">
                    
                    <thead>
                      <tr>
                        <th className="bg-[#0b2141] text-white border-b border-r border-slate-400 p-3 text-sm font-bold w-16 print:text-xs">Day</th>
                        <th className="bg-[#0b2141] text-white border-b border-r border-slate-400 p-3 text-sm font-bold text-center w-24 print:text-xs">Period</th>
                        {batches.map((b, i) => (
                          <th key={i} className="bg-slate-50 border-b border-r border-slate-200 p-3 text-xs font-bold text-slate-800 uppercase tracking-wider print:text-[10px]">
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-1.5 text-[9px] print:border print:border-blue-400">B{i}</span>
                            {b.name || `BATCH ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {Array.from({ length: params.days }).map((_, d) => {
                        const dayRows = [];
                        for (let p = 0; p < params.periods; p++) {
                          
                          const slotIndex = d * params.periods + p;
                          const lunchIndex = parseInt(params.breakPeriod) - 1;
                          const isLunch = p === lunchIndex;
                          const isFirst = p === 0;
                          const roomMap = getRoomMapForSlot(slotIndex);

                          dayRows.push(
                            <tr key={`${d}-${p}`} className={`border-b border-slate-200 ${isLunch ? 'bg-[#fffbeb]' : 'hover:bg-slate-50/50'}`}>
                              
                              {isFirst && (
                                <td rowSpan={params.periods} className="bg-[#0b2141] text-white border-b-[4px] border-white p-2 w-16 text-center align-middle">
                                  <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="mx-auto font-bold uppercase tracking-[0.2em] text-sm print:text-xs">
                                    {DAY_NAMES[d] || `DAY ${d+1}`}
                                  </div>
                                </td>
                              )}

                              <td className="p-3 border-r border-slate-200 text-[13px] font-bold text-center whitespace-nowrap print:text-[11px]">
                                {isLunch ? <span className="text-amber-700">Break</span> : <span className="text-blue-700">P {p + 1}</span>}
                              </td>

                              {isLunch ? (
                                <td colSpan={batches.length} className="p-3 text-center border-l border-slate-200">
                                  <div className="text-[12px] font-bold text-amber-700/60 uppercase tracking-[0.8em] w-full text-center print:text-[10px]">
                                    FREE SLOTS
                                  </div>
                                </td>
                              ) : (
                                batches.map((_, bIdx) => {
                                  const subjectId = schedule[slotIndex]?.[bIdx];
                                  
                                  if (!subjectId || subjectId === 0) {
                                    return (
                                      <td key={bIdx} className="border-r border-slate-200 p-3 text-center align-middle">
                                        <span className="text-slate-300 font-medium text-sm">—</span>
                                      </td>
                                    );
                                  }

                                  const { subj, teacher, isComb, teacherId } = resolveCell(subjectId);
                                  const room = roomMap[teacherId];
                                  
                                  return (
                                    <td key={bIdx} className="border-r border-slate-200 p-2 align-top">
                                      <div className={`h-full w-full p-2 rounded border border-slate-200 shadow-sm min-h-[56px] flex flex-col justify-between print:min-h-0 print:border-2 ${getSubjectStyle(subj)}`}>
                                        <div className="font-bold text-[13px] leading-tight mb-1 break-words print:text-[10px]">
                                          {subj}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-auto flex-wrap">
                                          <div className="text-[11px] font-mono text-slate-600 font-semibold whitespace-nowrap print:text-[9px]">
                                            {teacher}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1 rounded border border-blue-200 print:text-[8px] print:border-blue-400">
                                              [{room}]
                                            </span>
                                            {isComb && (
                                              <span className="text-[9px] font-bold bg-emerald-600 text-white px-1 rounded shadow-sm print:text-[8px] print:bg-emerald-100 print:text-emerald-700 print:border print:border-emerald-400">
                                                COMB
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  );
                                })
                              )}
                            </tr>
                          );
                        }
                        
                        if (d < params.days - 1) {
                          dayRows.push(
                            <tr key={`spacer-${d}`} className="h-4 bg-slate-300/80 border-y-[4px] border-white shadow-inner print:hidden">
                              <td colSpan={batches.length + 2} className="p-0 border-none"></td>
                            </tr>
                          );
                        }
                        return dayRows;
                      })}
                    </tbody>

                    {/* ── PRINT-ONLY FOOTER (Repeats on every printed page at the bottom right) ── */}
                    {/* ── PRINT-ONLY FOOTER (Repeats on every printed page at the bottom) ── */}
                    <tfoot className="hidden print:table-footer-group">
                      <tr>
                        <td colSpan={batches.length + 2} className="border-none pt-8 pb-2">
                          <div className="flex justify-between items-end w-full border-t-[3px] border-[#0b2141] pt-4">
                            
                            {/* Left Side: URL & Engine Stats */}
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                System URL: {window.location.origin}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                Generated via GA Scheduler Engine • Penalty Score: {penalty}
                              </span>
                            </div>

                            {/* Right Side: Professional Branding */}
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="block text-[12px] font-black text-[#0b2141] uppercase tracking-widest leading-tight">
                                  Official Master Timetable
                                </span>
                                <span className="block text-[9px] font-bold text-slate-500 mt-0.5">
                                  {new Date().toLocaleDateString()}
                                </span>
                              </div>
                              <div className="bg-[#0b2141] text-white font-mono font-black text-[14px] w-10 h-10 flex items-center justify-center rounded-lg shadow-sm border border-slate-300">
                                GA
                              </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    </tfoot>

                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}