import React, { useState } from 'react';
import { MapPin, Compass, X, Sparkles, BookOpen } from 'lucide-react';
import { SACRED_PLACES_DATA } from '../data/placesAndFiguresData';
import { SacredPlace } from '../types';
import karbalaImg from '../assets/images/hero_karbala_shrine_1794596207615.jpg';
import najafImg from '../assets/images/shrine_najaf_imam_ali_1794597209292.jpg';
import kadhimiyaImg from '../assets/images/shrine_kadhimiya_askari_1794597210354.jpg';
import mashhadImg from '../assets/images/shrine_mashhad_qom_1794597209877.jpg';
import studyImg from '../assets/images/hawza_study_hall_1794596208986.jpg';

const IMAGE_MAP: Record<SacredPlace['imageKey'], string> = {
  karbala: karbalaImg,
  najaf: najafImg,
  kadhimiya: kadhimiyaImg,
  mashhad: mashhadImg,
  study: studyImg,
};

export const SacredPlacesView: React.FC = () => {
  const [filter, setFilter] = useState<'الكل' | SacredPlace['category']>('الكل');
  const [activePlace, setActivePlace] = useState<SacredPlace | null>(null);
  const [brokenImgs, setBrokenImgs] = useState<Record<string, boolean>>({});

  const categories: Array<'الكل' | SacredPlace['category']> = [
    'الكل',
    'العتبات المقدسة',
    'المساجد والمقامات',
    'الحرم النبوي والبقيع',
  ];

  const filtered =
    filter === 'الكل'
      ? SACRED_PLACES_DATA
      : SACRED_PLACES_DATA.filter((p) => p.category === filter);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
          الأماكن الدينية والعتبات المقدسة
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          مراقد أئمة أهل البيت (عليهم السلام) والمساجد المعظمة — اضغط على أي مكان لفتح نافذة التعريف والزيارة
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              filter === cat
                ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Places Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((place) => {
          const imgSrc = IMAGE_MAP[place.imageKey];
          const isBroken = brokenImgs[place.id];

          return (
            <button
              key={place.id}
              type="button"
              onClick={() => setActivePlace(place)}
              className="group text-right rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden hover:border-[#0F5132]/60 transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[4/3] w-full bg-[#182620] overflow-hidden">
                {!isBroken ? (
                  <img
                    src={imgSrc}
                    alt={place.name}
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImgs((prev) => ({ ...prev, [place.id]: true }))}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0F5132] to-[#1C1917]">
                    <Compass className="w-12 h-12 text-amber-300/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 text-white">
                  <p className="text-[11px] font-medium text-amber-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {place.city} · {place.country}
                    </span>
                  </p>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-[11px] font-semibold text-[#0F5132] dark:text-emerald-400">
                    {place.category}
                  </p>
                  <h2 className="font-amiri text-xl font-bold text-stone-900 dark:text-white mt-0.5">
                    {place.name}
                  </h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-1.5 line-clamp-2">
                    {place.summary}
                  </p>
                </div>
                <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400 pt-2">
                  فتح نافذة المعلم المقدس ←
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sacred Place Detail Modal */}
      {activePlace && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActivePlace(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-56 md:h-72 bg-[#182620]">
              <img
                src={IMAGE_MAP[activePlace.imageKey]}
                alt={activePlace.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <button
                type="button"
                onClick={() => setActivePlace(null)}
                aria-label="إغلاق النافذة"
                className="absolute top-4 left-4 min-w-[44px] min-h-[44px] rounded-xl bg-black/50 text-white flex items-center justify-center hover:bg-black/70 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-5 right-6 left-6 text-white">
                <p className="text-xs text-amber-300 font-semibold">
                  {activePlace.category} · {activePlace.city}، {activePlace.country}
                </p>
                <h3 className="font-amiri text-2xl md:text-3xl font-bold mt-1">
                  {activePlace.name}
                </h3>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <p className="text-sm md:text-base font-medium text-stone-800 dark:text-stone-200 leading-relaxed">
                {activePlace.summary}
              </p>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-[#0F5132] dark:text-emerald-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>التاريخ والنشأة</span>
                </h4>
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activePlace.history}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-[#881337] dark:text-rose-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>الفضل والمنزلة</span>
                </h4>
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activePlace.virtue}
                </p>
              </div>

              <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] p-4">
                <p className="text-xs font-bold text-[#0F5132] dark:text-emerald-400 mb-1">
                  الأعمال والزيارات المستحبة:
                </p>
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  {activePlace.recommendedAmal}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
