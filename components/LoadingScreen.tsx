
import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617]">
            <div className="relative flex flex-col items-center">
                {/* Animated Glow Background */}
                <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full animate-tuition-pulse scale-150"></div>

                {/* Branded Logo */}
                <div className="relative z-10 animate-tuition-pulse">
                    <img
                        src="/logo.png"
                        alt="Tuition Logo"
                        className="w-24 h-24 object-contain drop-shadow-2xl"
                    />
                </div>

                {/* Text Branding */}
                <div className="mt-12 text-center relative z-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-[0.4em] leading-none">
                        Tuition
                    </h2>
                    <p className="text-blue-400 font-black text-[8px] uppercase tracking-[0.6em] mt-3 opacity-60">
                        Smart Tutoring Monitor
                    </p>
                </div>

                {/* Subtle Progress Trace */}
                <div className="mt-12 w-32 h-0.5 bg-slate-800 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-500 w-1/3 animate-[shimmer_2s_infinite_linear]"></div>
                </div>
            </div>

            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
        </div>
    );
};

export default LoadingScreen;
