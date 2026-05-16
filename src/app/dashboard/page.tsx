"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface CourseStats {
  id: string;
  name: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
}

interface DashboardData {
  user: { name: string | null; role: string; email: string } | null;
  stats: { totalStudents: number; presentToday: number; absentToday: number; lateToday: number };
  courses: CourseStats[];
}

function formatDate() {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime() {
  return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(formatTime());

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email ?? '';
      const res = await fetch(`/api/dashboard?email=${encodeURIComponent(email)}`);
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    load();
    const tick = setInterval(() => setTime(formatTime()), 60000);
    return () => clearInterval(tick);
  }, []);

  const s = data?.stats ?? { totalStudents: 0, presentToday: 0, absentToday: 0, lateToday: 0 };
  const pct = (n: number) => s.totalStudents > 0 ? Math.round((n / s.totalStudents) * 100) : 0;
  const userName = data?.user?.name ?? data?.user?.email ?? 'Usuario';
  const role = data?.user?.role;
  const generalPct = pct(s.presentToday);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Banner ejecutivo ── */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)' }}
      >
        {/* Patrón geométrico de fondo */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative flex items-center justify-between px-8 py-7 flex-wrap gap-6">
          {/* Saludo */}
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              {loading ? (
                <div className="h-7 w-52 bg-white/20 rounded-lg animate-pulse mb-1.5" />
              ) : (
                <h2 className="text-2xl font-bold text-white">Bienvenido, {userName}</h2>
              )}
              <p className="text-sky-200 text-sm capitalize">{formatDate()} &mdash; {time}</p>
            </div>
          </div>

          {/* Porcentaje general */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sky-300 text-xs uppercase tracking-widest font-medium mb-1">Asistencia general hoy</p>
              {loading ? (
                <div className="h-10 w-20 bg-white/20 rounded-lg animate-pulse" />
              ) : (
                <p className="text-white text-4xl font-bold leading-none">
                  {generalPct}<span className="text-2xl text-sky-300">%</span>
                </p>
              )}
            </div>
            {/* Círculo de progreso visual */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - generalPct / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                {generalPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 tarjetas de métricas ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">

        <MetricCard
          label="Total Alumnos"
          value={loading ? null : s.totalStudents}
          sub="matriculados"
          color="bg-sky-500"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
        />

        <MetricCard
          label="Presentes Hoy"
          value={loading ? null : s.presentToday}
          sub={`${pct(s.presentToday)}% de asistencia`}
          color="bg-emerald-500"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />

        <MetricCard
          label="Ausentes Hoy"
          value={loading ? null : s.absentToday}
          sub={`${pct(s.absentToday)}% de ausencia`}
          color="bg-rose-500"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />}
        />

        <MetricCard
          label="Tardanzas Hoy"
          value={loading ? null : s.lateToday}
          sub={`${pct(s.lateToday)}% de tardanza`}
          color="bg-amber-500"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
      </div>

      {/* ── Sección inferior: Cursos + Actividad ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Cursos (2/3 del ancho) */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <h3 className="font-bold text-slate-800 text-sm">
                {role === 'ADMIN' ? 'Todos los Cursos' : 'Mis Cursos Asignados'}
              </h3>
            </div>
            <Link
              href="/dashboard/attendance"
              className="text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Tomar asistencia
            </Link>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map(i => <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />)}
              </div>
            ) : !data?.courses.length ? (
              <div className="text-center py-12 text-slate-400">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-sm font-medium">No hay cursos asignados aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.courses.map((course) => {
                  const cp = course.totalStudents > 0
                    ? Math.round((course.present / course.totalStudents) * 100) : 0;
                  const hasAttendance = (course.present + course.absent + course.late) > 0;
                  return (
                    <div key={course.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:border-sky-200 hover:bg-sky-50/30 transition-all group">
                      {/* Icono / inicial */}
                      <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white font-bold text-sm">
                          {course.name.charAt(0)}
                        </span>
                      </div>

                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-semibold text-slate-800 text-sm truncate">{course.name}</p>
                          {hasAttendance
                            ? <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Registrado</span>
                            : <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Pendiente</span>
                          }
                        </div>
                        {/* Barra de progreso */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-400 rounded-full" style={{ width: `${cp}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 font-medium w-8 text-right">{cp}%</span>
                        </div>
                      </div>

                      {/* Mini stats */}
                      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                        <Pill value={course.present} label="P" color="text-emerald-600 bg-emerald-50 border-emerald-200" />
                        <Pill value={course.late}    label="T" color="text-amber-600 bg-amber-50 border-amber-200" />
                        <Pill value={course.absent}  label="A" color="text-rose-600 bg-rose-50 border-rose-200" />
                      </div>

                      {/* Botón */}
                      <Link
                        href="/dashboard/attendance"
                        className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        title="Tomar asistencia"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel de actividad del día (1/3 del ancho) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <h3 className="font-bold text-slate-800 text-sm">Actividad del día</h3>
          </div>

          <div className="p-5 space-y-1">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
              </div>
            ) : !data?.courses.length ? (
              <p className="text-sm text-slate-400 text-center py-8">Sin actividad aún</p>
            ) : (
              <>
                {data.courses.map((course, idx) => {
                  const done = (course.present + course.absent + course.late) > 0;
                  return (
                    <div key={course.id} className="flex items-start gap-3 py-3">
                      {/* Línea de tiempo */}
                      <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                          {done ? (
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        {idx < data.courses.length - 1 && (
                          <div className="w-px h-5 bg-slate-100 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-sm font-semibold text-slate-700">{course.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {done
                            ? `${course.present} presentes · ${course.late} tard. · ${course.absent} ausentes`
                            : 'Asistencia pendiente'}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Resumen final */}
                <div className="mt-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Cursos registrados</span>
                    <span className="font-bold text-slate-700">
                      {data.courses.filter(c => (c.present + c.absent + c.late) > 0).length}/{data.courses.length}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full">
                    <div
                      className="h-1.5 bg-purple-400 rounded-full"
                      style={{
                        width: `${data.courses.length > 0
                          ? (data.courses.filter(c => (c.present + c.absent + c.late) > 0).length / data.courses.length) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Componentes auxiliares ── */

function MetricCard({ label, value, sub, color, icon }: {
  label: string;
  value: number | null;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md`}>
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
        {value === null ? (
          <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse mt-1" />
        ) : (
          <p className="text-3xl font-bold text-slate-800 leading-tight">{value}</p>
        )}
        <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
}

function Pill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${color}`}>
      <span>{value}</span>
      <span className="opacity-60">{label}</span>
    </div>
  );
}
