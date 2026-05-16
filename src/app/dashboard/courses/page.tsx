"use client";

import React, { useState, useEffect } from 'react';

interface Teacher {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Course {
  id: string;
  name: string;
  teacher: Teacher;
  students: { id: string }[];
}

type Toast = { type: 'success' | 'error'; message: string } | null;

const BANNER_STYLE = {
  background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
};
const PATTERN_URL = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-white";

const EMPTY_FORM = { name: '', teacherId: '' };

export default function CoursesPage() {
  const [courses, setCourses]   = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Course | null>(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [toast, setToast]           = useState<Toast>(null);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchData() {
    setLoading(true);
    try {
      const res  = await fetch('/api/courses');
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses);
        setTeachers(data.teachers);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url    = editing ? `/api/courses?id=${editing.id}` : '/api/courses';
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: editing ? 'Salón actualizado.' : 'Salón creado correctamente.' });
        closeModal();
        fetchData();
      } else {
        setToast({ type: 'error', message: data.error ?? 'Error al guardar.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Error al conectar con el servidor.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      const res  = await fetch(`/api/courses?id=${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Salón eliminado. Los estudiantes y asistencias fueron eliminados también.' });
        fetchData();
      } else {
        setToast({ type: 'error', message: data.error ?? 'Error al eliminar.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Error al conectar con el servidor.' });
    } finally {
      setDeleteId(null);
    }
  }

  function openNew() {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setFormData({ name: course.name, teacherId: course.teacher.id });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setFormData(EMPTY_FORM);
  }

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.teacher.name ?? c.teacher.email).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = courses.reduce((sum, c) => sum + c.students.length, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-semibold animate-in slide-in-from-top-2 duration-300
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.type === 'success'
            ? <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg" style={BANNER_STYLE}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: PATTERN_URL }} />
        <div className="relative px-8 py-7 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <svg className="w-6 h-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Gestión de Salones
            </h2>
            <p className="text-sky-200 text-sm mt-1">Crea y administra los salones asignados a cada docente</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-white text-sky-700 hover:bg-sky-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Salón
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard label="Total Salones"    value={loading ? null : courses.length}       icon="🏫" color="bg-sky-500" />
        <MetricCard label="Total Docentes"   value={loading ? null : teachers.length}      icon="👨‍🏫" color="bg-purple-500" />
        <MetricCard label="Total Alumnos"    value={loading ? null : totalStudents}        icon="👥" color="bg-emerald-500" />
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-4 flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por salón o docente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
          />
        </div>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-500 hover:text-slate-700 font-semibold underline flex-shrink-0">
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla de salones */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center px-6 py-3 border-b border-slate-100 bg-slate-50/60 gap-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-6">#</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Salón</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Docente asignado</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Alumnos</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</span>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0,1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded-lg animate-pulse w-32" />
                  <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm font-medium">
              {courses.length === 0 ? 'No hay salones creados aún' : 'Sin resultados para tu búsqueda'}
            </p>
            {courses.length === 0 && (
              <button onClick={openNew} className="mt-3 text-sm text-sky-600 font-semibold hover:underline">
                Crear el primer salón
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((course, idx) => (
              <div key={course.id} className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center px-6 py-4 hover:bg-slate-50/60 transition-colors gap-4">

                {/* Número */}
                <span className="text-xs text-slate-400 font-medium w-6">{idx + 1}</span>

                {/* Salón */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={BANNER_STYLE}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{course.name}</p>
                    <p className="text-xs text-slate-400">ID: {course.id.slice(0, 8)}…</p>
                  </div>
                </div>

                {/* Docente */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-bold">
                      {(course.teacher.name ?? course.teacher.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">
                      {course.teacher.name ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{course.teacher.email}</p>
                  </div>
                </div>

                {/* Alumnos */}
                <div className="text-center">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 font-bold text-sm">
                    {course.students.length}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(course)}
                    className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteId(course.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">
              Mostrando <span className="font-semibold text-slate-600">{filtered.length}</span> de <span className="font-semibold text-slate-600">{courses.length}</span> salones
            </p>
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="relative px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={BANNER_STYLE}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: PATTERN_URL }} />
              <h3 className="relative font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {editing
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  }
                </svg>
                {editing ? 'Editar Salón' : 'Nuevo Salón'}
              </h3>
              <button onClick={closeModal} className="relative text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nombre del salón <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: 6to Grado A, 3ro Secundaria B"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Docente asignado <span className="text-rose-400">*</span>
                </label>
                {teachers.length === 0 ? (
                  <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
                    No hay docentes registrados en el sistema.
                  </div>
                ) : (
                  <select
                    required
                    value={formData.teacherId}
                    onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Selecciona un docente</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name ? `${t.name} — ${t.email}` : t.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {editing && editing.students.length > 0 && (
                <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-sm text-sky-700">
                  Este salón tiene <strong>{editing.students.length}</strong> estudiante{editing.students.length !== 1 ? 's' : ''} asignado{editing.students.length !== 1 ? 's' : ''}.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting || teachers.length === 0}
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                  {submitting
                    ? <><Spinner /> Guardando...</>
                    : editing ? 'Actualizar' : 'Crear salón'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar eliminación */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h4 className="text-center font-bold text-slate-800 mb-1">¿Eliminar salón?</h4>
            <p className="text-center text-sm text-slate-500 mb-6">
              Se eliminarán también <strong>todos los estudiantes y asistencias</strong> asociadas a este salón. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-colors">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: number | null; icon: string; color: string }) {
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

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
