"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  parentEmail: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

interface Course {
  id: string;
  name: string;
  students: Student[];
}

type SaveState = 'idle' | 'saving' | 'success' | 'error';

function formatDate() {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

const BANNER_STYLE = {
  background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
};
const PATTERN_URL = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

export default function AttendancePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [emailsSent, setEmailsSent] = useState<number | null>(null);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email ?? '';

        // Buscar el usuario en la BD para obtener su ID y rol
        const userRes = await fetch(`/api/dashboard?email=${encodeURIComponent(email)}`);
        const userData = await userRes.json();
        const isAdmin = userData?.user?.role === 'ADMIN';

        const teacherId = isAdmin ? 'all' : (userData?.user?.id ?? 'all');
        const res = await fetch(`/api/attendance?teacherId=${teacherId}`);
        const data = await res.json();

        if (data.courses?.length) {
          setCourses(data.courses.map((c: Course) => ({
            ...c,
            students: c.students.map(s => ({ ...s, status: 'PRESENT' as const })),
          })));
        }
      } catch (e) {
        console.error('Error cargando cursos:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  function selectCourse(course: Course) {
    const withStatus = course.students.map(s => ({ ...s, status: 'PRESENT' as const }));
    setSelectedCourse(course);
    setStudents(withStatus);
    setSearchTerm('');
    setSaveState('idle');
    setEmailsSent(null);
  }

  function toggleStatus(id: string, status: 'PRESENT' | 'ABSENT' | 'LATE') {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }

  function markAll(status: 'PRESENT' | 'ABSENT' | 'LATE') {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  }

  async function handleSave() {
    if (!selectedCourse) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          attendances: students.map(s => ({ studentId: s.id, status: s.status })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveState('success');
        setEmailsSent(data.emailsSent ?? 0);
        setEmailErrors(data.emailErrors ?? []);
      } else {
        setSaveState('error');
      }
    } catch {
      setSaveState('error');
    }
  }

  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const presentCount = students.filter(s => s.status === 'PRESENT').length;
  const absentCount  = students.filter(s => s.status === 'ABSENT').length;
  const lateCount    = students.filter(s => s.status === 'LATE').length;
  const pct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  /* ── PANTALLA DE ÉXITO ── */
  if (saveState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 animate-in fade-in duration-500">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Asistencia guardada!</h3>
          <p className="text-slate-500 text-sm mb-2">
            {selectedCourse?.name} — {new Date().toLocaleDateString('es-PE')}
          </p>
          {emailsSent !== null && (
            <p className="text-sm text-sky-600 font-semibold mb-2">
              {emailsSent} correo{emailsSent !== 1 ? 's' : ''} enviado{emailsSent !== 1 ? 's' : ''} a padres de familia
            </p>
          )}
          {emailErrors.length > 0 && (
            <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-3 text-left">
              <p className="text-xs font-bold text-rose-600 mb-1">Error al enviar correos:</p>
              {emailErrors.map((e, i) => (
                <p key={i} className="text-xs text-rose-500">{e}</p>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setSelectedCourse(null); setSaveState('idle'); }}
              className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Otro curso
            </button>
            <Link
              href="/dashboard"
              className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold text-sm transition-colors text-center"
            >
              Ir al dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── SELECCIÓN DE CURSO ── */
  if (!selectedCourse) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">

        {/* Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg" style={BANNER_STYLE}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: PATTERN_URL }} />
          <div className="relative px-8 py-7 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <svg className="w-6 h-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Tomar Asistencia
              </h2>
              <p className="text-sky-200 text-sm mt-1 capitalize">{formatDate()}</p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
          </div>
        </div>

        {/* Grid de cursos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <h3 className="font-bold text-slate-800 text-sm">Selecciona un curso</h3>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-28 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-sm font-medium">No hay cursos asignados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => selectCourse(course)}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-sky-300 transition-all text-left group"
                  >
                    <div className="px-5 py-3 group-hover:opacity-90 transition-opacity" style={BANNER_STYLE}>
                      <p className="font-bold text-white text-sm">{course.name}</p>
                    </div>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="font-semibold text-slate-700">{course.students.length}</span> estudiantes
                      </div>
                      <span className="text-sky-500 group-hover:translate-x-0.5 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── TOMAR ASISTENCIA ── */
  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Banner con stats en vivo */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg" style={BANNER_STYLE}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: PATTERN_URL }} />
        <div className="relative px-8 py-6 flex items-center justify-between flex-wrap gap-5">
          {/* Título */}
          <div>
            <p className="text-sky-300 text-xs uppercase tracking-widest font-medium mb-1">Tomando asistencia</p>
            <h2 className="text-2xl font-bold text-white">{selectedCourse.name}</h2>
            <p className="text-sky-200 text-sm mt-0.5 capitalize">{formatDate()}</p>
          </div>

          {/* Contadores en vivo */}
          <div className="flex items-center gap-3 flex-wrap">
            <LiveBadge value={presentCount} label="Presentes" color="bg-emerald-400/20 border-emerald-400/30 text-emerald-100" />
            <LiveBadge value={lateCount}    label="Tardanzas" color="bg-amber-400/20 border-amber-400/30 text-amber-100" />
            <LiveBadge value={absentCount}  label="Ausentes"  color="bg-rose-400/20 border-rose-400/30 text-rose-100" />
            {/* Círculo de progreso */}
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="white" strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] font-bold">{pct}%</span>
            </div>
          </div>

          {/* Botón volver */}
          <button
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Cambiar curso
          </button>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-4 flex items-center gap-3 flex-wrap">
        {/* Buscador */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
          />
        </div>

        {/* Marcar todos */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">Marcar todos:</span>
          <button onClick={() => markAll('PRESENT')} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition-colors">Presentes</button>
          <button onClick={() => markAll('LATE')}    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold transition-colors">Tardanzas</button>
          <button onClick={() => markAll('ABSENT')}  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold transition-colors">Ausentes</button>
        </div>
      </div>

      {/* Lista de estudiantes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Estudiante — {filtered.length} de {students.length}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[calc(100vh-480px)] overflow-y-auto">
          {filtered.map((student, idx) => (
            <div
              key={student.id}
              className={`flex items-center gap-4 px-6 py-4 transition-colors
                ${student.status === 'ABSENT' ? 'bg-rose-50/60' : ''}
                ${student.status === 'LATE'   ? 'bg-amber-50/60' : ''}
                ${student.status === 'PRESENT' ? 'hover:bg-slate-50/80' : ''}
              `}
            >
              {/* Número + avatar */}
              <span className="text-xs text-slate-400 font-medium w-5 flex-shrink-0 text-right">{idx + 1}</span>
              <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-xs font-bold">
                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                </span>
              </div>

              {/* Nombre */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">
                  {student.lastName}, {student.firstName}
                </p>
                <p className="text-xs text-slate-400 truncate">{student.parentEmail}</p>
              </div>

              {/* Botones P / T / A */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <ToggleBtn
                  active={student.status === 'PRESENT'}
                  onClick={() => toggleStatus(student.id, 'PRESENT')}
                  activeClass="bg-emerald-500 text-white shadow-emerald-200 shadow-md"
                  inactiveClass="bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                  label="P"
                  title="Presente"
                />
                <ToggleBtn
                  active={student.status === 'LATE'}
                  onClick={() => toggleStatus(student.id, 'LATE')}
                  activeClass="bg-amber-500 text-white shadow-amber-200 shadow-md"
                  inactiveClass="bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                  label="T"
                  title="Tardanza"
                />
                <ToggleBtn
                  active={student.status === 'ABSENT'}
                  onClick={() => toggleStatus(student.id, 'ABSENT')}
                  activeClass="bg-rose-500 text-white shadow-rose-200 shadow-md"
                  inactiveClass="bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  label="A"
                  title="Ausente"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer con botón guardar */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-sm text-slate-500">
            <span className="font-semibold text-emerald-600">{presentCount}P</span>
            {' · '}
            <span className="font-semibold text-amber-500">{lateCount}T</span>
            {' · '}
            <span className="font-semibold text-rose-500">{absentCount}A</span>
            {' '}de {students.length} estudiantes
          </div>

          {saveState === 'error' && (
            <p className="text-xs text-rose-500 font-semibold">Error al guardar. Intenta de nuevo.</p>
          )}

          <button
            onClick={handleSave}
            disabled={saveState === 'saving' || students.length === 0}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            {saveState === 'saving' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Guardar y enviar correos
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}

/* ── Componentes auxiliares ── */

function LiveBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-center border rounded-xl px-4 py-2 ${color}`}>
      <span className="text-2xl font-bold leading-none">{value}</span>
      <span className="text-[10px] font-medium opacity-80 mt-0.5">{label}</span>
    </div>
  );
}

function ToggleBtn({ active, onClick, activeClass, inactiveClass, label, title }: {
  active: boolean;
  onClick: () => void;
  activeClass: string;
  inactiveClass: string;
  label: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${active ? activeClass : inactiveClass}`}
    >
      {label}
    </button>
  );
}
