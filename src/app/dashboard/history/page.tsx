"use client";

import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DayRecord { date: string; status: string }

interface StudentRecord {
  studentId: string;
  firstName: string;
  lastName: string;
  courseName: string;
  courseId: string;
  present: number;
  late: number;
  absent: number;
  days: DayRecord[];
}

interface Course { id: string; name: string }

const BANNER_STYLE = {
  background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
};
const PATTERN_URL = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

function toInputDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return toInputDate(d);
}

function defaultEnd() {
  return toInputDate(new Date());
}

export default function HistoryPage() {
  const [records, setRecords]     = useState<StudentRecord[]>([]);
  const [courses, setCourses]     = useState<Course[]>([]);
  const [loading, setLoading]     = useState(false);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate]     = useState(defaultEnd);
  const [courseId, setCourseId]   = useState('');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ startDate, endDate });
        if (courseId) params.set('courseId', courseId);
        const res  = await fetch(`/api/history?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setRecords(data.records ?? []);
          setCourses(data.courses ?? []);
        }
      } catch (e) {
        console.error('Error cargando historial:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [startDate, endDate, courseId]);

  const filtered = records.filter(r =>
    `${r.firstName} ${r.lastName} ${r.courseName}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const totals = filtered.reduce(
    (acc, r) => ({ present: acc.present + r.present, late: acc.late + r.late, absent: acc.absent + r.absent }),
    { present: 0, late: 0, absent: 0 }
  );

  async function exportExcel() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema de Asistencia Escolar';
    const ws = wb.addWorksheet('Historial');

    // Anchos de columna
    ws.columns = [
      { key: 'num',       width: 5  },
      { key: 'lastName',  width: 22 },
      { key: 'firstName', width: 18 },
      { key: 'course',    width: 14 },
      { key: 'present',   width: 12 },
      { key: 'late',      width: 12 },
      { key: 'absent',    width: 12 },
      { key: 'total',     width: 12 },
      { key: 'pct',       width: 14 },
    ];

    // Fila 1: Título
    ws.addRow(['Historial de Asistencia Escolar — I.E. Generalísimo José de San Martín']);
    ws.mergeCells('A1:I1');
    const titleRow = ws.getRow(1);
    titleRow.height = 32;
    titleRow.getCell(1).fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C4A6E' } };
    titleRow.getCell(1).font   = { bold: true, size: 13, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Fila 2: Período
    ws.addRow([`Período: ${startDate}  al  ${endDate}`]);
    ws.mergeCells('A2:I2');
    const periodRow = ws.getRow(2);
    periodRow.height = 20;
    periodRow.getCell(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
    periodRow.getCell(1).font      = { italic: true, size: 10, color: { argb: 'FF0369A1' } };
    periodRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Fila 3: Encabezados
    const headers = ['#', 'Apellido', 'Nombre', 'Salón', 'Presentes', 'Tardanzas', 'Ausentes', 'Total días', '% Asistencia'];
    const headerRow = ws.addRow(headers);
    headerRow.height = 22;
    headerRow.eachCell(cell => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border    = { bottom: { style: 'medium', color: { argb: 'FF0284C7' } } };
    });

    // Filas de datos
    filtered.forEach((r, i) => {
      const total  = r.present + r.late + r.absent;
      const pctNum = total > 0 ? Math.round((r.present / total) * 100) : 0;
      const row    = ws.addRow([i + 1, r.lastName, r.firstName, r.courseName, r.present, r.late, r.absent, total, `${pctNum}%`]);
      row.height   = 18;
      const bgArgb = i % 2 === 0 ? 'FFFFFFFF' : 'FFF1F5F9';

      row.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.font      = { size: 9, name: 'Calibri' };
        cell.alignment = col >= 5 ? { horizontal: 'center', vertical: 'middle' } : { vertical: 'middle' };
        cell.border    = {
          top:    { style: 'hair', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
          left:   { style: 'hair', color: { argb: 'FFE2E8F0' } },
          right:  { style: 'hair', color: { argb: 'FFE2E8F0' } },
        };
        if (col === 5) cell.font = { size: 9, bold: true, color: { argb: 'FF059669' } };
        if (col === 6) cell.font = { size: 9, bold: true, color: { argb: 'FFD97706' } };
        if (col === 7) cell.font = { size: 9, bold: true, color: { argb: 'FFDC2626' } };
        if (col === 9) cell.font = { size: 9, bold: true, color: { argb: pctNum >= 90 ? 'FF059669' : pctNum >= 75 ? 'FFD97706' : 'FFDC2626' } };
      });
    });

    // Descargar
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `historial_${startDate}_${endDate}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('Historial de Asistencia', 14, 16);
    doc.setFontSize(9);
    doc.text(`Período: ${startDate} al ${endDate}`, 14, 23);

    autoTable(doc, {
      startY: 28,
      head: [['#', 'Alumno', 'Salón', 'Pres.', 'Tard.', 'Aus.', 'Total', '%']],
      body: filtered.map((r, i) => {
        const total = r.present + r.late + r.absent;
        const pct   = total > 0 ? Math.round((r.present / total) * 100) : 0;
        return [i + 1, `${r.lastName}, ${r.firstName}`, r.courseName, r.present, r.late, r.absent, total, `${pct}%`];
      }),
      headStyles: { fillColor: [3, 105, 161] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      styles: { fontSize: 8 },
    });

    doc.save(`historial_${startDate}_${endDate}.pdf`);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg" style={BANNER_STYLE}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: PATTERN_URL }} />
        <div className="relative px-8 py-7 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <svg className="w-6 h-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historial de Asistencia
            </h2>
            <p className="text-sky-200 text-sm mt-1">Consulta y exporta el registro histórico por alumno</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportExcel()}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Excel
            </button>
            <button
              onClick={exportPDF}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-white"
          />
        </div>
        <select
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-white"
        >
          <option value="">Todos los salones</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar alumno..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard label="Alumnos"   value={loading ? null : filtered.length}      color="bg-sky-500"     icon="👥" />
        <SummaryCard label="Presentes" value={loading ? null : totals.present}       color="bg-emerald-500" icon="✅" />
        <SummaryCard label="Tardanzas" value={loading ? null : totals.late}          color="bg-amber-500"   icon="⏰" />
        <SummaryCard label="Ausentes"  value={loading ? null : totals.absent}        color="bg-rose-500"    icon="❌" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center px-6 py-3 border-b border-slate-100 bg-slate-50/60 gap-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-6">#</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alumno / Salón</span>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider text-center w-16">Pres.</span>
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider text-center w-16">Tard.</span>
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider text-center w-16">Aus.</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-16">Total</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-20">Asist.</span>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 bg-slate-100 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded-lg animate-pulse w-48" />
                  <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">No hay registros en este período</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[calc(100vh-480px)] overflow-y-auto">
            {filtered.map((r, idx) => {
              const total = r.present + r.late + r.absent;
              const pct   = total > 0 ? Math.round((r.present / total) * 100) : 0;
              const pctColor = pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-rose-600';
              const barColor  = pct >= 90 ? 'bg-emerald-400' : pct >= 75 ? 'bg-amber-400' : 'bg-rose-400';
              return (
                <div key={r.studentId} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center px-6 py-4 gap-4 hover:bg-slate-50/60 transition-colors">
                  <span className="text-xs text-slate-400 font-medium w-6">{idx + 1}</span>

                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-xs font-bold">
                        {r.firstName.charAt(0)}{r.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{r.lastName}, {r.firstName}</p>
                      <span className="inline-flex items-center text-[10px] font-semibold text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full mt-0.5">
                        {r.courseName}
                      </span>
                    </div>
                  </div>

                  <span className="w-16 text-center text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg py-1">{r.present}</span>
                  <span className="w-16 text-center text-sm font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg py-1">{r.late}</span>
                  <span className="w-16 text-center text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg py-1">{r.absent}</span>
                  <span className="w-16 text-center text-sm font-semibold text-slate-600">{total}</span>

                  <div className="w-20 flex flex-col items-center gap-1">
                    <span className={`text-sm font-bold ${pctColor}`}>{pct}%</span>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">
              Mostrando <span className="font-semibold text-slate-600">{filtered.length}</span> alumnos
              &nbsp;·&nbsp;
              <span className="text-emerald-600 font-semibold">{totals.present} presentes</span>
              &nbsp;·&nbsp;
              <span className="text-amber-500 font-semibold">{totals.late} tardanzas</span>
              &nbsp;·&nbsp;
              <span className="text-rose-500 font-semibold">{totals.absent} ausentes</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, icon }: { label: string; value: number | null; color: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md text-xl`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        {value === null
          ? <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse mt-1" />
          : <p className="text-3xl font-bold text-slate-800">{value}</p>
        }
      </div>
    </div>
  );
}
