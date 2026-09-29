import React from 'react';

export default function BackgroundMural({ opacity = 'opacity-10' }) {
  return (
    <div className={`fixed inset-0 z-[-1] pointer-events-none flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 overflow-hidden ${opacity}`}>
      {/* Left Side: Quote */}
      <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-end text-center lg:text-left">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-mural-red leading-snug mb-8 max-w-lg">
              " Rasa bukanlah secangkir teh hangat, yang sewaktu-waktu branjak dingin "
          </h1>
          <div className="w-full text-right lg:pr-12 max-w-lg">
              <span className="font-cursive text-5xl lg:text-6xl text-mural-blue transform -rotate-2 inline-block">Teh Yan</span>
          </div>
      </div>
      
      {/* Right Side: Frame & Icons */}
      <div className="w-full lg:w-1/2 relative h-[400px] lg:h-[500px] flex items-center justify-center border-t-4 lg:border-t-0 lg:border-l-4 border-gray-800/80">
          {/* Main Painted Sign */}
          <div className="z-20 transform scale-75 md:scale-100">
              <div className="bg-wall border-[6px] border-mural-red p-2 shadow-2xl">
                  <div className="border-[4px] border-mural-blue bg-wall flex flex-col items-center justify-center px-8 py-10 md:px-12 md:py-16">
                      <h2 className="font-cursive text-6xl md:text-8xl font-bold text-mural-blue mb-4 leading-none">Teh Yan</h2>
                      <p className="font-sans font-bold text-mural-red tracking-[0.2em] text-[10px] md:text-xs uppercase mt-2">
                          Jl. H.Moat No.43 RT9 RW9
                      </p>
                  </div>
              </div>
          </div>

          {/* Scattered Line Art Icons */}
          <i className="fa-solid fa-mug-hot absolute top-4 left-4 lg:top-10 lg:left-12 text-5xl md:text-6xl mural-icon transform -rotate-12"></i>
          <i className="fa-solid fa-leaf absolute top-24 left-2 lg:top-32 lg:left-8 text-3xl md:text-4xl mural-icon transform rotate-45"></i>
          
          <i className="fa-solid fa-seedling absolute top-10 right-10 lg:top-16 lg:right-20 text-4xl md:text-5xl mural-icon transform rotate-12"></i>
          
          <i className="fa-solid fa-bread-slice absolute bottom-12 left-10 lg:bottom-20 lg:left-16 text-5xl md:text-6xl mural-icon transform rotate-6"></i>
          <i className="fa-solid fa-coffee absolute bottom-32 left-4 lg:bottom-40 lg:left-8 text-3xl mural-icon transform -rotate-12"></i>
          
          <i className="fa-solid fa-bowl-food absolute bottom-8 right-6 lg:bottom-16 lg:right-16 text-6xl md:text-7xl mural-icon transform -rotate-12"></i>
          <i className="fa-solid fa-leaf absolute bottom-32 right-12 lg:bottom-48 lg:right-24 text-3xl md:text-4xl mural-icon transform -rotate-45"></i>
      </div>
    </div>
  );
}