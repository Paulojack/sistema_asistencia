"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError('Credenciales incorrectas. Verifique su correo y contraseña.');
      setLoading(false);
    } else {
      // Redirigir al dashboard (que crearemos en el siguiente paso)
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] font-sans antialiased text-slate-900">
      
      {/* LADO IZQUIERDO: IMAGEN DEL COLEGIO + IDENTIDAD (50%) */}
      <div className="hidden md:flex w-1/2 relative overflow-hidden order-1 border-r border-slate-100">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: "url('/colegio.jpeg')" }}
        ></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-blue-900/80 via-blue-800/60 to-transparent"></div>

        <div className="relative z-20 flex flex-col justify-center items-center w-full px-16 text-center">
          <div className="space-y-6">
            <span className="text-blue-200 text-sm font-bold tracking-[0.4em] uppercase block mb-2 drop-shadow-md">
              Portal Oficial
            </span>
            <div className="h-1 w-20 bg-blue-400 mx-auto rounded-full"></div>
            <h1 className="text-white text-5xl lg:text-6xl font-extralight tracking-tight leading-[1.1] drop-shadow-2xl">
              Institución <span className="font-serif italic text-blue-100">Educativa</span>
            </h1>
            <div className="py-4">
               <h2 className="text-white text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase drop-shadow-2xl">
                 Generalísimo <br /> 
                 <span className="text-blue-300">José de San Martín</span>
               </h2>
            </div>
            <div className="h-1 w-20 bg-blue-400 mx-auto rounded-full shadow-lg"></div>
            <p className="text-blue-50/90 text-xl font-medium leading-relaxed max-w-md mx-auto pt-6">
              "Excelencia y Compromiso en la Formación Integral"
            </p>
          </div>
        </div>

        <div className="absolute bottom-12 text-center w-full z-20">
          <p className="text-white/60 text-[10px] tracking-[0.6em] uppercase font-bold">
            Disciplina • Estudio • Superación
          </p>
        </div>
      </div>

      {/* LADO DERECHO: LOGIN EN TARJETA SOBRE FONDO CLARO (50%) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-slate-50 order-2 relative z-30">
        
        {/* Tarjeta de Login */}
        <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-white space-y-10">
          
          <div className="space-y-3 text-center">
            <div className="h-1.5 w-12 bg-blue-700 rounded-full mb-6 mx-auto"></div>
            <h2 className="text-4xl font-bold text-slate-800 tracking-tight">
              Inicio de Sesión
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-700 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="space-y-2.5">
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Correo Institucional
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full px-5 py-4 border border-slate-100 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all bg-slate-50 focus:bg-white text-base shadow-sm"
                placeholder="usuario@sanjose.edu.pe"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Contraseña
                </label>
                <a href="#" className="text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors">
                  ¿Olvidó su clave?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full px-5 py-4 border border-slate-100 rounded-2xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all bg-slate-50 focus:bg-white text-base shadow-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-4.5 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-black text-white bg-blue-700 hover:bg-blue-800 transition-all duration-300 transform active:scale-[0.99] uppercase tracking-widest ${loading ? 'opacity-70 cursor-not-allowed animate-pulse' : ''}`}
            >
              {loading ? 'Validando Acceso...' : 'INGRESAR AL PANEL'}
            </button>
          </form>

          <div className="pt-8 border-t border-slate-50 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
             &copy; {new Date().getFullYear()} I.E. Gral. José de San Martín
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-400 font-medium">
           Gestión Escolar Profesional
        </p>
      </div>

    </div>
  );
}
