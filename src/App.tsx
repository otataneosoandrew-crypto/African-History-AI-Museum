import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Map, 
  Search, 
  Compass, 
  ArrowRight,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react';
import { ERAS, Era } from './types';
import { cn } from './lib/utils';
import { LiveGuide } from './components/LiveGuide';
import { ContentGenerator } from './components/ContentGenerator';

export default function App() {
  const [selectedEra, setSelectedEra] = useState<Era>('pre-colonial');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const currentEra = ERAS.find(e => e.id === selectedEra)!;

  // Suggested topics per era
  const eraTopics: Record<Era, string[]> = {
    'pre-colonial': ['The Kingdom of Aksum', 'Mali Empire Gold Trade', 'Great Zimbabwe Architecture', 'Ancient Egyptian Medicine'],
    'colonial': ['The Battle of Adwa', 'Aba Women\'s Riot', 'Mau Mau Uprising', 'The Scramble for Africa'],
    'independence': ['Kwame Nkrumah\'s Vision', 'The End of Apartheid', 'Pan-Africanism Movement', 'Algerian War of Independence'],
    'modern': ['The Tech Hub of Nairobi', 'Afrobeats Global Impact', 'African Continental Free Trade Area', 'The Great Green Wall']
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Rail */}
      <nav className="fixed left-0 top-0 h-full w-20 bg-museum-ink text-white flex flex-col items-center py-8 z-40 border-r border-white/10">
        <div className="mb-12">
          <History className="text-museum-gold" size={32} />
        </div>
        <div className="flex-1 flex flex-col gap-8">
          <button className="p-3 rounded-xl bg-white/10 text-museum-gold"><Compass size={24} /></button>
          <button className="p-3 rounded-xl hover:bg-white/5 transition-colors"><Map size={24} /></button>
          <button className="p-3 rounded-xl hover:bg-white/5 transition-colors"><Info size={24} /></button>
        </div>
        <div className="mt-auto">
          <div className="w-10 h-10 rounded-full bg-museum-gold/20 border border-museum-gold flex items-center justify-center text-[10px] font-bold">
            AU
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-20 p-8 md:p-12 lg:p-20">
        {/* Header */}
        <header className="max-w-6xl mx-auto mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-museum-gold font-mono text-xs tracking-[0.3em] uppercase">
              <Sparkles size={14} />
              AI-Powered Heritage
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-light tracking-tighter leading-none">
              Heritage <br />
              <span className="italic text-museum-accent">Museum</span>
            </h1>
          </div>
          
          <div className="w-full md:w-96 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-museum-ink/30" size={18} />
            <input 
              type="text"
              placeholder="Search history..."
              className="w-full bg-white border border-museum-ink/10 rounded-full py-4 pl-12 pr-6 focus:outline-none focus:border-museum-accent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Era Selector */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-museum-ink/10 border border-museum-ink/10 rounded-3xl overflow-hidden">
            {ERAS.map((era) => (
              <button
                key={era.id}
                onClick={() => {
                  setSelectedEra(era.id);
                  setActiveTopic(null);
                }}
                className={cn(
                  "p-8 text-left transition-all relative group",
                  selectedEra === era.id ? "bg-white" : "bg-museum-bg hover:bg-white/50"
                )}
              >
                <div className="text-[10px] font-mono tracking-widest uppercase opacity-50 mb-2">{era.period}</div>
                <h3 className="text-xl font-serif font-bold mb-4 group-hover:text-museum-accent transition-colors">{era.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed line-clamp-2">{era.description}</p>
                
                {selectedEra === era.id && (
                  <motion.div 
                    layoutId="active-era"
                    className="absolute bottom-0 left-0 w-full h-1 bg-museum-accent"
                  />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Era Content */}
        <AnimatePresence mode="wait">
          <motion.section 
            key={selectedEra}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left: Era Details */}
              <div className="lg:col-span-4 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl font-serif italic">{currentEra.title}</h2>
                  <p className="text-lg leading-relaxed opacity-80">
                    {currentEra.description} Explore the stories, sounds, and visions of this pivotal time in African history.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Featured Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {eraTopics[selectedEra].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setActiveTopic(topic)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm border transition-all",
                          activeTopic === topic 
                            ? "bg-museum-ink text-white border-museum-ink" 
                            : "bg-white border-museum-ink/10 hover:border-museum-accent"
                        )}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: AI Generator */}
              <div className="lg:col-span-8">
                {activeTopic ? (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-museum-accent/10 text-museum-accent rounded-2xl">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif font-bold">{activeTopic}</h3>
                        <p className="text-sm opacity-50">Select a medium to transform this history</p>
                      </div>
                    </div>
                    
                    <ContentGenerator era={currentEra.title} topic={activeTopic} />
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] border-2 border-dashed border-museum-ink/10 rounded-3xl flex flex-col items-center justify-center p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-museum-bg rounded-full flex items-center justify-center text-museum-ink/20">
                      <ChevronRight size={40} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif italic">Select a topic to begin</h3>
                      <p className="max-w-xs mx-auto opacity-50 mt-2">
                        Choose a historical event or theme from the list to generate AI content.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="ml-20 p-12 bg-museum-ink text-white/40 text-xs font-mono tracking-widest uppercase flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5">
        <div>&copy; 2026 Heritage African History Museum</div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-museum-gold transition-colors">Archives</a>
          <a href="#" className="hover:text-museum-gold transition-colors">Education</a>
          <a href="#" className="hover:text-museum-gold transition-colors">About AI</a>
        </div>
      </footer>

      {/* Live Guide Component */}
      <LiveGuide />
    </div>
  );
}
