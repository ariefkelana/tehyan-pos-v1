import React from 'react';

export default function BackgroundMural({ opacity = 'opacity-10' }) {
  return (
    <div className={`fixed inset-0 z-[-1] pointer-events-none overflow-hidden ${opacity} flex items-center justify-center`}>
      
      {/* Desktop Only Content (Quote & Big Sign) */}
      <div className="hidden lg:flex w-full max-w-7xl items-center justify-center gap-24 px-12">
        {/* Left Side: Quote */}
        <div className="w-1/2 flex flex-col items-end text-right">
            <h1 className="font-serif text-[2.75rem] font-bold text-mural-red leading-snug mb-8 max-w-lg">
                " Rasa bukanlah secangkir teh hangat, yang sewaktu-waktu branjak dingin "
            </h1>
            <div className="w-full pr-12 max-w-lg">
                <span className="font-cursive text-6xl text-mural-blue transform -rotate-2 inline-block">Teh Yan</span>
            </div>
        </div>
        
        {/* Right Side: Frame */}
        <div className="w-1/2 relative h-[500px] flex items-center justify-center border-l-4 border-gray-800/80">
            <div className="z-20">
                <div className="bg-wall border-[6px] border-mural-red p-2 shadow-2xl">
                    <div className="border-[4px] border-mural-blue bg-wall flex flex-col items-center justify-center px-12 py-16">
                        <h2 className="font-cursive text-8xl font-bold text-mural-blue mb-4 leading-none">Teh Yan</h2>
                        <p className="font-sans font-bold text-mural-red tracking-[0.2em] text-xs uppercase mt-2">
                            Jl. H.Moat No.43 RT9 RW9
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Mobile & Desktop: Scattered Icons everywhere to give the Kedai vibe */}
      <div className="absolute inset-0 z-0">
          <i className="fa-solid fa-mug-hot absolute top-10 left-10 lg:top-20 lg:left-32 text-6xl mural-icon transform -rotate-12 opacity-40"></i>
          <i className="fa-solid fa-leaf absolute top-40 left-4 lg:top-60 lg:left-16 text-4xl mural-icon transform rotate-45 opacity-40"></i>
          
          <i className="fa-solid fa-seedling absolute top-20 right-12 lg:top-32 lg:right-40 text-5xl mural-icon transform rotate-12 opacity-40"></i>
          
          <i className="fa-solid fa-bread-slice absolute bottom-24 left-8 lg:bottom-40 lg:left-32 text-7xl mural-icon transform rotate-6 opacity-40"></i>
          <i className="fa-solid fa-coffee absolute bottom-10 left-20 lg:bottom-16 lg:left-64 text-4xl mural-icon transform -rotate-12 opacity-40"></i>
          
          <i className="fa-solid fa-bowl-food absolute bottom-20 right-10 lg:bottom-32 lg:right-32 text-8xl mural-icon transform -rotate-12 opacity-40"></i>
          <i className="fa-solid fa-leaf absolute bottom-40 right-4 lg:bottom-60 lg:right-16 text-4xl mural-icon transform -rotate-45 opacity-40"></i>
          
          <i className="fa-solid fa-mug-hot absolute top-1/2 left-1/2 text-9xl mural-icon transform -translate-x-1/2 -translate-y-1/2 opacity-10 lg:hidden"></i>
      </div>
    </div>
  );
}