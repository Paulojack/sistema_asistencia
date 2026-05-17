PS C:\Users\JACK\OneDrive\Documentos\PROYECTOS\sistema_asistencia> npm run build

> sistema_asistencia@0.1.0 build
> next build

⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of C:\Users\JACK\package-lock.json as the root directory.
 To silence this warning, set `turbopack.root` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory for more information.
 Detected additional lockfiles: 
   * C:\Users\JACK\OneDrive\Documentos\PROYECTOS\sistema_asistencia\package-lock.json

▲ Next.js 16.2.1 (Turbopack)
- Environments: .env

  Creating an optimized production build ...
✓ Compiled successfully in 6.5s
✓ Finished TypeScript in 2.6s
✓ Collecting page data using 18 workers in 1173ms    
Error occurred prerendering page "/login". Read more: https://nextjs.org/docs/messages/prerender-error
Error: Event handlers cannot be passed to Client Component props.
  {onClick: function onClick, className: ..., children: ...}
            ^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
    at stringify (<anonymous>) {
  digest: '3674775479'
}
Export encountered an error on /login/page: /login, exiting the build.
⨯ Next.js build worker exited with code: 1 and signal: null
PS C:\Users\JACK\OneDrive\Documentos\PROYECTOS\sistema_asistencia> 