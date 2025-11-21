import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Shield, Headphones, Wind, Layers, Footprints, ChevronRight, Edit2 } from 'lucide-react';
import { ProductCategory, CategoryItem } from '../types';
import { categoryService } from '../services/categoryService';

interface CategoryGridProps {
  onCategorySelect: (category: ProductCategory) => void;
}

const iconMap: Record<string, React.ReactNode> = {
    'Shield': <Shield className="w-6 h-6" />,
    'Wind': <Wind className="w-5 h-5" />,
    'Layers': <Layers className="w-5 h-5" />,
    'Footprints': <Footprints className="w-5 h-5" />,
    'Zap': <Zap className="w-5 h-5" />,
    'Headphones': <Headphones className="w-5 h-5" />
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
      const loadCats = async () => {
          const data = await categoryService.getCategories();
          setCategories(data);
      };
      loadCats();
  }, []);

  // Kategori türüne göre varsayılan ikon döndür
  const getIcon = (type: string) => {
      if (type === 'Kask') return iconMap['Shield'];
      if (type === 'Mont') return iconMap['Wind'];
      if (type === 'Eldiven') return iconMap['Layers'];
      if (type === 'Bot') return iconMap['Footprints'];
      if (type === 'İnterkom') return iconMap['Headphones'];
      return iconMap['Zap'];
  };

  return (
    <section className="py-20 bg-[#050505] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-moto-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
             <div>
                <div className="flex items-center gap-2 text-moto-accent mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Koleksiyonlar</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-none">
                   KATEGORİLERİ <span className="text-transparent bg-clip-text bg-gradient-to-r from-moto-accent to-red-800">KEŞFET</span>
                </h2>
             </div>
             <button className="text-gray-400 hover:text-white text-sm flex items-center gap-2 group transition-colors">
                 Tüm Kategoriler <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] gap-4 md:gap-6">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => onCategorySelect(cat.type)}
              className={`
                group relative rounded-3xl overflow-hidden cursor-pointer 
                border border-white/5 bg-[#0a0a0a]
                hover:border-moto-accent/50 hover:shadow-[0_0_30px_rgba(255,31,31,0.15)] 
                transition-all duration-500 ease-out
                ${cat.className || 'col-span-1 row-span-1'}
              `}
            >
              {/* Image Background */}
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-80"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
              
              {/* Content Wrapper */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  
                  {/* Top Row: Icon & Count */}
                  <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-moto-accent group-hover:text-white group-hover:border-moto-accent transition-all duration-300">
                          {getIcon(cat.type)}
                      </div>
                      <span className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-gray-300 font-mono group-hover:text-white transition-colors">
                          {cat.count}
                      </span>
                  </div>

                  {/* Bottom Row: Text & Arrow */}
                  <div className="flex items-end justify-between">
                      <div className="transform transition-transform duration-500 group-hover:-translate-y-1">
                          <p className="text-xs text-moto-accent font-bold uppercase tracking-wider mb-1 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                              {cat.desc}
                          </p>
                          <h3 className="text-2xl md:text-3xl font-display font-bold text-white leading-none">
                              {cat.name}
                          </h3>
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                          <ChevronRight className="w-5 h-5" />
                      </div>
                  </div>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};