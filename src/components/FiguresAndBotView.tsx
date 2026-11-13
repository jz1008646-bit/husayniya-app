import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Bot,
  Send,
  X,
  BookOpen,
  Quote,
  Loader2,
} from 'lucide-react';
import { RELIGIOUS_FIGURES_DATA } from '../data/placesAndFiguresData';
import { ReligiousFigure } from '../types';
import { getApiUrl } from '../utils/apiClient';
import sahabaImg from '../assets/images/companions_sahaba_scroll_1794597211579.jpg';
import scholarsImg from '../assets/images/scholars_hawza_books_1794597211186.jpg';
import karbalaImg from '../assets/images/hero_karbala_shrine_1794596207615.jpg';
import najafImg from '../assets/images/shrine_najaf_imam_ali_1794597209292.jpg';

const FIGURE_IMAGE_MAP: Record<ReligiousFigure['imageKey'], string> = {
  sahaba: sahabaImg,
  scholars: scholarsImg,
  karbala: karbalaImg,
  najaf: najafImg,
};

interface ChatMsg {
  role: 'user' | 'model';
  text: string;
}

export const FiguresAndBotView: React.FC = () => {
  const [filter, setFilter] = useState<'الكل' | 'الصحابة المنتجبون' | 'العلماء الأعلام'>('الكل');
  const [selectedFigure, setSelectedFigure] = useState<ReligiousFigure | null>(null);
  const [modalTab, setModalTab] = useState<'bio' | 'bot'>('bio');
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMsg[]>>({});
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [botError, setBotError] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const filtered =
    filter === 'الكل'
      ? RELIGIOUS_FIGURES_DATA
      : RELIGIOUS_FIGURES_DATA.filter((f) => f.category === filter);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, selectedFigure, modalTab]);

  const openFigureModal = (figure: ReligiousFigure, defaultTab: 'bio' | 'bot' = 'bio') => {
    setSelectedFigure(figure);
    setModalTab(defaultTab);
    setBotError('');
    if (!chatHistory[figure.id]) {
      setChatHistory((prev) => ({
        ...prev,
        [figure.id]: [
          {
            role: 'model',
            text: `السلام عليكم ورحمة الله. أنا المساعد البحثي المخصص للتعريف بسيرة «${figure.name}». يمكنك سؤالي عن حياته، مواقفه، مؤلفاته، أو دوره التاريخي والعلمي.`,
          },
        ],
      }));
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    if (!selectedFigure) return;
    const text = (customPrompt ?? chatInput).trim();
    if (!text || isSending) return;

    const figId = selectedFigure.id;
    const currentMessages = chatHistory[figId] || [];
    const updatedMessages: ChatMsg[] = [...currentMessages, { role: 'user', text }];

    setChatHistory((prev) => ({ ...prev, [figId]: updatedMessages }));
    if (!customPrompt) setChatInput('');
    setIsSending(true);
    setBotError('');

    try {
      const res = await fetch(getApiUrl('/api/figure-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figureName: selectedFigure.name,
          figureRole: selectedFigure.title,
          figureEra: selectedFigure.era,
          figureBio: `${selectedFigure.biography}\nإنجازات: ${selectedFigure.achievements.join('، ')}`,
          history: currentMessages.slice(1),
          message: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر الحصول على رد من بوت السيرة.');
      }

      setChatHistory((prev) => ({
        ...prev,
        [figId]: [...updatedMessages, { role: 'model', text: data.reply }],
      }));
    } catch (err) {
      setBotError(err instanceof Error ? err.message : 'حدث خطأ في الاتصال بالبوت.');
    } finally {
      setIsSending(false);
    }
  };

  const suggestedQuestions = (figure: ReligiousFigure) => [
    `ما أبرز مواقف ${figure.name} التاريخية؟`,
    `تحدّث عن نشأة ${figure.name} ومكانته عند أهل البيت`,
    `ما أهم ما أُثر عن ${figure.name} من أقوال أو مؤلفات؟`,
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
          الصحابة المنتجبون والعلماء الأعلام
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          تعرّف على سيرهم ومآثرهم، واضغط على أي شخصية لفتح نافذة السيرة ومحاورة البوت المعرفي الخاص بها
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(['الكل', 'الصحابة المنتجبون', 'العلماء الأعلام'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              filter === cat
                ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
            }`}
          >
            {cat === 'الصحابة المنتجبون' && <Users className="w-4 h-4" />}
            {cat === 'العلماء الأعلام' && <GraduationCap className="w-4 h-4" />}
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Figures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((figure) => (
          <article
            key={figure.id}
            className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden flex flex-col justify-between"
          >
            <button
              type="button"
              onClick={() => openFigureModal(figure, 'bio')}
              className="text-right cursor-pointer group flex-1 flex flex-col"
            >
              <div className="relative h-44 w-full bg-[#182620] overflow-hidden">
                <img
                  src={FIGURE_IMAGE_MAP[figure.imageKey]}
                  alt={figure.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-3 right-4 left-4 text-white">
                  <p className="text-[11px] font-semibold text-amber-300">
                    {figure.category} · {figure.era}
                  </p>
                  <h2 className="font-amiri text-xl font-bold mt-0.5">{figure.name}</h2>
                </div>
              </div>

              <div className="p-5 space-y-2 flex-1">
                <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
                  {figure.title}
                </p>
                <p className="text-xs md:text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                  {figure.summary}
                </p>
              </div>
            </button>

            <div className="px-5 pb-5 pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => openFigureModal(figure, 'bio')}
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#0F5132] dark:text-emerald-400" />
                <span>السيرة</span>
              </button>
              <button
                type="button"
                onClick={() => openFigureModal(figure, 'bot')}
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>اسأل بوت الشخصية</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Figure Biography & Dedicated Persona Bot Modal */}
      {selectedFigure && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedFigure(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
                  {selectedFigure.category} · {selectedFigure.era}
                </p>
                <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                  {selectedFigure.name}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {selectedFigure.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFigure(null)}
                aria-label="إغلاق النافذة"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bio vs Bot Tabs */}
            <div className="px-6 py-3 bg-[#FAF8F4] dark:bg-[#0B1117] border-b border-[#E7E1D6] dark:border-[#1F2B37] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalTab('bio')}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                  modalTab === 'bio'
                    ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                    : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>السيرة والمآثر</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('bot')}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                  modalTab === 'bot'
                    ? 'bg-[#881337] text-white dark:bg-rose-700'
                    : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>البوت المعرفي للشخصية</span>
              </button>
            </div>

            {/* Body */}
            {modalTab === 'bio' ? (
              <div className="p-6 md:p-8 overflow-y-auto space-y-5">
                <p className="text-sm md:text-base text-stone-800 dark:text-stone-200 leading-[1.95]">
                  {selectedFigure.biography}
                </p>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-[#0F5132] dark:text-emerald-400">
                    أبرز المآثر والأعمال:
                  </h4>
                  <ul className="space-y-1.5 text-sm text-stone-700 dark:text-stone-300 list-disc list-inside">
                    {selectedFigure.achievements.map((ach, i) => (
                      <li key={i}>{ach}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] p-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#881337] dark:text-rose-400">
                    <Quote className="w-4 h-4" />
                    <span>من كلماته المأثورة</span>
                  </div>
                  <p className="font-amiri text-xl text-stone-900 dark:text-white leading-relaxed">
                    «{selectedFigure.famousQuote}»
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setModalTab('bot')}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F5132] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    <span>افتح البوت للتعرف أكثر على {selectedFigure.name}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Interactive Bot Chat Area */
              <div className="flex-1 flex flex-col min-h-[380px] overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {(chatHistory[selectedFigure.id] || []).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#0F5132] text-white dark:bg-emerald-700'
                            : 'bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-900 dark:text-stone-100'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex justify-end">
                      <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] px-4 py-3 text-xs text-stone-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0F5132]" />
                        <span>جارٍ استحضار الإجابة...</span>
                      </div>
                    </div>
                  )}

                  {botError && (
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-200">
                      {botError}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggested Prompts */}
                <div className="px-5 py-2 border-t border-[#E7E1D6] dark:border-[#1F2B37] flex items-center gap-2 overflow-x-auto">
                  {suggestedQuestions(selectedFigure).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      disabled={isSending}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-[11px] font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap shrink-0 hover:border-[#0F5132] cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-4 border-t border-[#E7E1D6] dark:border-[#1F2B37] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`اسأل عن سيرة ${selectedFigure.name}...`}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F5132]/40"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !chatInput.trim()}
                    aria-label="إرسال السؤال"
                    className="min-w-[44px] min-h-[44px] px-4 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] disabled:opacity-50 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
