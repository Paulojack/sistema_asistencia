"use client";

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    exact: true,
    activeColor: 'from-blue-400 to-purple-400',
    activeBg: 'from-blue-500/20 to-purple-500/20',
    activeText: 'from-blue-300 to-purple-300',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    href: '/dashboard/attendance',
    label: 'Tomar Asistencia',
    exact: false,
    activeColor: 'from-cyan-400 to-blue-400',
    activeBg: 'from-cyan-500/20 to-blue-500/20',
    activeText: 'from-cyan-300 to-blue-300',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    ),
  },
  {
    href: '/dashboard/students',
    label: 'Estudiantes',
    exact: false,
    activeColor: 'from-purple-400 to-pink-400',
    activeBg: 'from-purple-500/20 to-pink-500/20',
    activeText: 'from-purple-300 to-pink-300',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    ),
  },
  {
    href: '/dashboard/history',
    label: 'Historial',
    exact: false,
    activeColor: 'from-emerald-400 to-green-400',
    activeBg: 'from-emerald-500/20 to-green-500/20',
    activeText: 'from-emerald-300 to-green-300',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    href: '/dashboard/courses',
    label: 'Salones',
    exact: false,
    activeColor: 'from-sky-400 to-cyan-400',
    activeBg: 'from-sky-500/20 to-cyan-500/20',
    activeText: 'from-sky-300 to-cyan-300',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
  },
  {
    href: '/dashboard/account',
    label: 'Mi Cuenta',
    exact: false,
    activeColor: 'from-violet-400 to-purple-400',
    activeBg: 'from-violet-500/20 to-purple-500/20',
    activeText: 'from-violet-300 to-purple-300',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setDisplayName(user.user_metadata?.name ?? user.email ?? '');
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="h-screen overflow-hidden flex bg-slate-200/70">

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 backdrop-blur-2xl bg-slate-900/95 border-r border-white/10 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-20 -left-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative p-8">
          <h2 className="text-2xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Asistencia</span>
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Escolar</span>
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 mt-3 rounded-full" />
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-5 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center space-x-4 p-4 rounded-2xl font-bold transition-all hover:scale-[1.02]
                  ${isActive
                    ? `bg-gradient-to-r ${item.activeBg} backdrop-blur-sm border border-white/20`
                    : 'hover:bg-white/10 backdrop-blur-sm text-slate-300 hover:text-white'
                  }`}
              >
                {/* Glow en hover (solo inactivo) */}
                {!isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.activeBg} rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity blur-xl`} />
                )}

                {/* Icono */}
                <div className={`relative p-2 rounded-xl shadow-lg transition-all
                  ${isActive
                    ? `bg-gradient-to-br ${item.activeColor}`
                    : `bg-slate-800/50 group-hover:bg-gradient-to-br group-hover:${item.activeColor}`
                  }`}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                </div>

                {/* Label */}
                <span className={`relative font-semibold
                  ${isActive
                    ? `bg-gradient-to-r ${item.activeText} bg-clip-text text-transparent`
                    : ''
                  }`}
                >
                  {item.label}
                </span>

                {/* Indicador activo */}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Cerrar sesión */}
        <div className="relative p-5 mt-auto border-t border-white/10 backdrop-blur-sm">
          <button
            onClick={handleSignOut}
            className="group w-full flex items-center space-x-4 p-4 rounded-2xl hover:bg-red-500/20 backdrop-blur-sm border border-transparent hover:border-red-500/30 text-slate-300 hover:text-red-400 transition-all font-bold"
          >
            <div className="bg-slate-800/50 p-2 rounded-xl group-hover:bg-gradient-to-br group-hover:from-rose-400 group-hover:to-red-500 transition-all">
              <svg className="w-5 h-5 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 backdrop-blur-xl bg-white/60 border-b border-white/40 flex items-center justify-between px-10 shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h1 className="text-sm font-black text-transparent bg-gradient-to-r from-slate-600 to-blue-600 bg-clip-text uppercase tracking-widest">
              I.E. Generalísimo José de San Martín
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="backdrop-blur-sm bg-white/50 border border-white/60 px-5 py-2 rounded-full shadow-lg">
              <span className="text-sm font-bold text-slate-700">
                Usuario: <span className="font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{displayName || '...'}</span>
              </span>
            </div>
          </div>
        </header>

        <section className="flex-1 p-10 overflow-y-auto">
          {children}
        </section>
      </main>

    </div>
  );
}
