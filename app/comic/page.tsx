import ComicViewer from '@/components/ComicViewer';

export const metadata = {
  title: 'COMIC VAULT | HISTORIA',
  description: 'Browse the Historia comic pages',
};

export default function ComicsPage() {
  return (
    <div className="relative min-h-screen py-12">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="text-center mb-16 relative">
        <div className="inline-block retro-panel px-8 py-4 mb-6 border-yellow-400/30">
          <h1
            className="text-4xl md:text-5xl text-white mb-2 leading-tight tracking-widest"
            style={{ textShadow: '4px 4px 0 #000' }}
          >
            COMIC VAULT
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-4" />
          <p className="text-[10px] text-gray-400 uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
            IMMERSIVE COMIC EXPERIENCE · NAVIGATE WITH ARROW KEYS OR CLICK CONTROLS
          </p>
        </div>
      </div>

      <ComicViewer />

      <div className="mt-20 text-center">
        <div className="inline-block retro-panel px-6 py-3">
          <p className="text-[9px] text-gray-500 tracking-widest uppercase">
            [ THIS VAULT CONTAINS ARCHIVED COMIC PAGES · USE FULLSCREEN FOR BEST VIEWING ]
          </p>
        </div>
      </div>
    </div>
  );
}
