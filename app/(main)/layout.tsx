import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-y-auto bg-background-dark text-white relative custom-scrollbar">
      {/* Background Felt/Table Pattern (Abstract Gradient) */}
      <div 
        className="fixed inset-0 z-0 opacity-40 pointer-events-none" 
        style={{ background: 'radial-gradient(circle at 50% 120%, rgba(13, 242, 128, 0.15) 0%, transparent 70%)' }}
      />
      
      <Navbar />
      
      <main className="flex-1 relative z-10 pt-24 pb-12 flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
