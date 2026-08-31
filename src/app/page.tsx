'use client'

export default function Home() {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '/A-THERAPY_Seguimiento_Profesional.xlsx'
    link.download = 'A-THERAPY_Seguimiento_Profesional.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const sheets = [
    { name: 'DASHBOARD', desc: 'KPIs, vitales, resumen de sesiones', color: 'bg-[#2D4A3E]' },
    { name: 'REGISTRO SEMANAL', desc: '6 dias de entrenamiento con datos', color: 'bg-[#3D6B5E]' },
    { name: 'EVOLUCION', desc: 'Peso, elevaciones, graficos de progresion', color: 'bg-[#2D4A3E]' },
    { name: 'LISTAS', desc: 'Validaciones y desplegables', color: 'bg-[#3D6B5E]' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9]">
      <header className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2D4A3E] flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">A-THERAPY</span>
        </div>
        <span className="text-gray-500 text-sm hidden sm:block">Fuerza - Ciencia - Rendimiento</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#2D4A3E] px-6 py-5">
              <h1 className="text-white text-lg font-semibold">Archivo listo para descargar</h1>
              <p className="text-green-200/70 text-sm mt-1">Seguimiento Profesional de Entrenamiento</p>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F0F5F2] flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#2D4A3E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">A-THERAPY_Seguimiento_Profesional.xlsx</p>
                  <p className="text-xs text-gray-400 mt-0.5">182 KB - 4 hojas - 106 formulas - 3 graficos</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contenido</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {sheets.map((sheet) => (
                    <div key={sheet.name} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                      <div className={`w-2 h-8 rounded-full ${sheet.color}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{sheet.name}</p>
                        <p className="text-xs text-gray-400">{sheet.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full bg-[#2D4A3E] hover:bg-[#1F3830] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Descargar Excel
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Haz clic en el boton para descargar el archivo.
          </p>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 px-6 py-4 text-center mt-auto">
        <p className="text-xs text-gray-400">A-THERAPY - Fuerza - Ciencia - Rendimiento</p>
      </footer>
    </div>
  )
}
