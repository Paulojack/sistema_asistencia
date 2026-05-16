"use client";

import React, { useState, useEffect } from 'react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  parentEmail: string;
  parentPhone?: string;
  courseId: string;
  course: { name: string };
}

interface Course {
  id: string;
  name: string;
}

type Toast = { type: 'success' | 'error'; message: string } | null;

const BANNER_STYLE = {
  background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
};
const PATTERN_URL = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const EMPTY_FORM = { firstName: '', lastName: '', parentEmail: '', parentPhone: '', courseId: '' };

export default function StudentsPage() {
  const [students, setStudents]       = useState<Student[]>([]);
  const [courses, setCourses]         = useState<Course[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [toast, setToast]             = useState<Toast>(null);

  useEffect(() => { fetchStudents(); fetchCourses(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchStudents() {
    setLoading(true);
    try {
      const res  = await fetch('/api/students');
      const data = await res.json();
      if (data.students) setStudents(data.students);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function fetchCourses() {
    try {
      const res  = await fetch('/api/attendance?teacherId=all');
      const data = await res.json();
      if (data.courses) setCourses(data.courses);
    } catch { /* silent */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url    = editingStudent ? `/api/students?id=${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: editingStudent ? 'Estudiante actualizado correctamente.' : 'Estudiante creado correctamente.' });
        closeModal();
        fetchStudents();
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
      const res  = await fetch(`/api/students?id=${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: 'Estudiante eliminado.' });
        fetchStudents();
      } else {
        setToast({ type: 'error', message: 'Error al eliminar.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Error al conectar con el servidor.' });
    } finally {
      setDeleteId(null);
    }
  }

  function openEdit(student: Student) {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone ?? '',
      courseId: student.courseId,
    });
    setShowModal(true);
  }

  function openNew() {
    setEditingStudent(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingStudent(null);
    setFormData(EMPTY_FORM);
  }

  const filtered = students.filter(s => {
    const matchSearch = `${s.firstName} ${s.lastName} ${s.parentEmail}`
      .toLowerCase().includes(searchTerm.toLowerCase());
    const matchCourse = !filterCourse || s.courseId === filterCourse;
    return matchSearch && matchCourse;
  });

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Gestión de Estudiantes
            </h2>
            <p className="text-sky-200 text-sm mt-1">Administra los alumnos y datos de contacto de padres</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-white text-sky-700 hover:bg-sky-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Estudiante
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <MetricCard label="Total Estudiantes" value={loading ? null : students.length}  icon="👥" color="bg-sky-500" />
        <MetricCard label="Cursos Activos"    value={loading ? null : courses.length}   icon="📚" color="bg-purple-500" />
        <MetricCard label="Resultados"        value={loading ? null : filtered.length}  icon="🔍" color="bg-emerald-500" />
      </div>

      {/* Barra de búsqueda y filtro */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
          />
        </div>
        <select
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-white"
        >
          <option value="">Todos los cursos</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(searchTerm || filterCourse) && (
          <button
            onClick={() => { setSearchTerm(''); setFilterCourse(''); }}
            className="text-xs text-slate-500 hover:text-slate-700 font-semibold underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla de estudiantes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center px-6 py-3 border-b border-slate-100 bg-slate-50/60">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-8">#</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estudiante</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contacto del padre</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pr-1">Acciones</span>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 bg-slate-100 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded-lg animate-pulse w-40" />
                  <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-sm font-medium">
              {students.length === 0 ? 'No hay estudiantes registrados aún' : 'Sin resultados para tu búsqueda'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[calc(100vh-430px)] overflow-y-auto">
            {filtered.map((student, idx) => (
              <div key={student.id} className="grid grid-cols-[auto_1fr_1fr_auto] items-center px-6 py-4 hover:bg-slate-50/60 transition-colors">
                {/* Número + avatar */}
                <div className="flex items-center gap-3 w-8">
                  <span className="text-xs text-slate-400 font-medium">{idx + 1}</span>
                </div>

                {/* Nombre + curso */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white text-xs font-bold">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {student.lastName}, {student.firstName}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full mt-0.5">
                      {student.course.name}
                    </span>
                  </div>
                </div>

                {/* Contacto */}
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm text-slate-600 truncate flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {student.parentEmail}
                  </p>
                  {student.parentPhone && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {student.parentPhone}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(student)}
                    className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteId(student.id)}
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
              Mostrando <span className="font-semibold text-slate-600">{filtered.length}</span> de <span className="font-semibold text-slate-600">{students.length}</span> estudiantes
            </p>
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Header del modal */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={BANNER_STYLE}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: PATTERN_URL }} />
              <h3 className="relative font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {editingStudent
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  }
                </svg>
                {editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
              </h3>
              <button onClick={closeModal} className="relative text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre" required>
                  <input type="text" required value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className={inputCls} placeholder="Ej: Juan" />
                </Field>
                <Field label="Apellido" required>
                  <input type="text" required value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className={inputCls} placeholder="Ej: Pérez" />
                </Field>
              </div>

              <Field label="Correo del padre/madre" required>
                <input type="email" required value={formData.parentEmail}
                  onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                  className={inputCls} placeholder="padre@correo.com" />
              </Field>

              <Field label="Teléfono (opcional)">
                <input type="tel" value={formData.parentPhone}
                  onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                  className={inputCls} placeholder="999 999 999" />
              </Field>

              <Field label="Curso" required>
                <select required value={formData.courseId}
                  onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                  className={inputCls}>
                  <option value="">Selecciona un curso</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                  {submitting
                    ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Guardando...</>
                    : editingStudent ? 'Actualizar' : 'Crear estudiante'
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
            <h4 className="text-center font-bold text-slate-800 mb-1">¿Eliminar estudiante?</h4>
            <p className="text-center text-sm text-slate-500 mb-6">Esta acción también eliminará su historial de asistencias y no se puede deshacer.</p>
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

/* ── Componentes auxiliares ── */

const inputCls = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-white";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
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
