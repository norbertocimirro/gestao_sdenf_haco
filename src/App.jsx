import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Cake, BookOpen, Plus, Trash2, Edit3, 
  UserPlus, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, Thermometer, TrendingDown, Plane, CheckSquare, Square,
  ChevronUp, ChevronDown, ChevronsUpDown, CalendarClock, PieChart,
  ChevronLeft, ChevronRight, Key, Lock, Sun, CalendarDays, History, UserCircle, Shield,
  Bed, Baby, MapPin, Cloud, CloudRain, Droplets, Wind, Calendar, RefreshCcw, Printer, CheckCircle, Wand2
} from 'lucide-react';

// =========================================================================
// --- CONFIGURAÇÕES GLOBAIS DE CONEXÃO E DADOS ---
// =========================================================================
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 

const LOCAIS_EXPEDIENTE = ["SDENF", "FUNSA", "CAIS", "UCC", "UPA", "UTI", "UPI", "SAD", "SSOP", "SIL", "FERISTA"];
const LOCAIS_SERVICO = ["UTI", "UPI"];

const selectStyle = {
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1em'
};

// =========================================================================
// --- HELPERS E FUNÇÕES DE LEITURA (SISTEMA BLINDADO) ---
// =========================================================================

const getVal = (obj, searchTerms) => {
  if (!obj || typeof obj !== 'object') return "";
  const keys = Object.keys(obj);
  const foundKey = keys.find(k => 
    searchTerms.some(term => String(k).toLowerCase().includes(term.toLowerCase()))
  );
  return foundKey ? obj[foundKey] : "";
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s || s === "-" || s.toLowerCase().includes("invalid")) return null;

  try {
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
    }
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-');
      if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
};

const formatDate = (dateInput) => {
  const date = parseDate(dateInput);
  return date ? date.toLocaleDateString('pt-BR') : "-";
};

const formatDateForInput = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calculateDetailedTime = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return { y: 0, m: 0, d: 0, display: "-" };
  
  const today = new Date();
  let y = today.getFullYear() - date.getFullYear();
  let m = today.getMonth() - date.getMonth();
  let d = today.getDate() - date.getDate();

  if (d < 0) {
    m--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    d += lastMonth.getDate();
  }
  if (m < 0) {
    y--;
    m += 12;
  }
  
  const validY = Math.max(0, isNaN(y) ? 0 : y);
  const validM = Math.max(0, isNaN(m) ? 0 : m);
  const validD = Math.max(0, isNaN(d) ? 0 : d);

  return { y: validY, m: validM, d: validD, display: `${validY}a ${validM}m ${validD}d` };
};

const getBradenClass = (score) => {
   const s = parseFloat(score);
   if (isNaN(s) || s === 0) return { label: "Sem Dados", color: "text-slate-500" };
   if (s <= 9) return { label: "Risco Muito Elevado", color: "text-red-500" };
   if (s <= 12) return { label: "Risco Elevado", color: "text-orange-500" };
   if (s <= 14) return { label: "Risco Moderado", color: "text-amber-500" };
   if (s <= 18) return { label: "Baixo Risco", color: "text-yellow-600" };
   return { label: "Sem Risco", color: "text-green-500" };
};

const getFugulinClass = (score) => {
   const s = parseFloat(score);
   if (isNaN(s) || s === 0) return { label: "Sem Dados", color: "text-slate-500" };
   if (s <= 14) return { label: "Cuidado Mínimo", color: "text-green-500" };
   if (s <= 20) return { label: "Cuidado Intermediário", color: "text-yellow-500" };
   if (s <= 26) return { label: "Alta Dependência", color: "text-orange-500" };
   if (s <= 29) return { label: "Semi-Intensivo", color: "text-red-400" };
   return { label: "Cuidados Intensivos", color: "text-red-600" };
};

const getActiveAfastamentos = (lista) => {
  if (!Array.isArray(lista)) return [];
  const today = new Date();
  today.setHours(0,0,0,0);
  
  return lista.filter(a => {
    const status = String(getVal(a, ['status'])).toLowerCase();
    if (status.includes('rejeitado') || status === 'pendente') return false;

    const start = parseDate(getVal(a, ['inicio', 'data']));
    if (!start) return false;
    start.setHours(0,0,0,0);
    const dias = parseInt(getVal(a, ['dias'])) || 0;
    
    const end = new Date(start);
    end.setDate(end.getDate() + Math.max(0, dias - 1));
    end.setHours(23,59,59,999);
    
    return today >= start && today <= end;
  });
};

const calculateAbsenteismoStats = (atestados, totalOfficers) => {
  const currentYear = new Date().getFullYear();
  const statsByMonth = Array.from({ length: 12 }, () => 0);
  
  if (Array.isArray(atestados)) {
    atestados.forEach(a => {
      const status = String(getVal(a, ['status'])).toLowerCase();
      if (!status.includes('homologado') && status !== '') return; 
      
      const start = parseDate(getVal(a, ['inicio', 'data']));
      if (!start) return;
      const dias = parseInt(getVal(a, ['dias'])) || 0;
      const end = new Date(start);
      end.setDate(end.getDate() + Math.max(0, dias - 1));
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === currentYear) {
          statsByMonth[d.getMonth()]++;
        }
      }
    });
  }

  const monthsData = [];
  let annualLostDays = 0;
  let annualPossibleDays = 0;

  for (let m = 0; m < 12; m++) {
    const lostDays = statsByMonth[m];
    const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
    const possibleDays = (totalOfficers || 1) * daysInMonth;
    const rate = possibleDays > 0 ? parseFloat(((lostDays / possibleDays) * 100).toFixed(1)) : 0;
    
    annualLostDays += lostDays;
    annualPossibleDays += possibleDays;
    
    monthsData.push({
      monthName: new Date(currentYear, m, 1).toLocaleDateString('pt-BR', { month: 'long' }),
      lostDays,
      rate: rate
    });
  }
  
  const annualRate = annualPossibleDays > 0 ? parseFloat(((annualLostDays / annualPossibleDays) * 100).toFixed(1)) : 0;

  return { currentYear, months: monthsData, annualRate, annualLostDays };
};

// =========================================================================
// --- COMPONENTES VISUAIS GERAIS ---
// =========================================================================

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
        <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center font-sans print:hidden">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-200 text-center">
             <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
             <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Erro de Interface</h1>
             <p className="text-slate-500 mb-4 text-sm">{this.state.error?.toString()}</p>
             <button onClick={() => {localStorage.removeItem('sga_app_cache'); window.location.reload();}} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95">Limpar Cache e Recarregar</button>
          </div>
        </div>
      );
    return this.props.children;
  }
}

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans print:hidden animate-fadeIn">
    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
      <div className="p-5 border-b flex justify-between items-center bg-slate-50">
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg flex items-center gap-2">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all active:scale-90"><CloseIcon size={20}/></button>
      </div>
      <div className="p-6 max-h-[85vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 4000; 
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
           if (width > height) { height *= MAX_DIMENSION / width; width = MAX_DIMENSION; } 
           else { width *= MAX_DIMENSION / height; height = MAX_DIMENSION; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve({ name: file.name.replace(/\.[^/.]+$/, "") + ".jpg", type: 'image/jpeg', base64: dataUrl.split(',')[1] });
      };
    };
  });
};

const FileUpload = ({ onFileSelect }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true); setFileName("A processar ficheiro...");
    try {
      if (file.type.startsWith('image/')) {
        const compressedFile = await compressImage(file);
        onFileSelect(compressedFile); setFileName(`✅ Imagem otimizada (${file.name})`);
      } else if (file.type === 'application/pdf') {
        if (file.size > 10 * 1024 * 1024) { alert("O PDF excede 10MB."); e.target.value = ""; setIsProcessing(false); setFileName(""); return; }
        const reader = new FileReader();
        reader.onloadend = () => { onFileSelect({ name: file.name, type: file.type, base64: reader.result.split(',')[1] }); setFileName(`✅ PDF anexado (${file.name})`); };
        reader.readAsDataURL(file);
      } else { alert("Apenas PDF ou Imagens."); e.target.value = ""; setFileName(""); }
    } catch (err) { alert("Erro ao processar."); setFileName(""); } 
    finally { setIsProcessing(false); }
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl relative overflow-hidden transition-all hover:bg-slate-100">
      <div className="flex items-center gap-3 mb-2"><Paperclip size={16} className="text-slate-500"/><label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">Anexar Documento / Foto</label></div>
      <input type="file" accept="image/*,application/pdf" onChange={handleChange} disabled={isProcessing} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
      {isProcessing && <div className="absolute inset-0 bg-white/80 flex items-center justify-center gap-2 text-blue-600 font-bold text-xs"><Loader2 size={16} className="animate-spin"/> Otimizando...</div>}
      {fileName && !isProcessing && <div className="mt-3 text-[10px] font-bold text-green-600 bg-green-50 p-2 rounded-lg">{fileName}</div>}
    </div>
  );
};

const WeatherWidgetMini = () => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-29.92&longitude=-51.18&current=temperature_2m,apparent_temperature,precipitation,wind_speed_10m,relative_humidity_2m,cloud_cover&timezone=America%2FSao_Paulo");
        const data = await res.json();
        setWeather(data.current);
      } catch (e) { console.error("Erro clima", e); }
    };
    fetchWeather();
  }, []);

  if (!weather) return null;

  return (
    <div className="flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 py-1.5 rounded-full border border-slate-200 shadow-sm text-[9px] md:text-[10px] font-black text-slate-600 tracking-widest ml-auto print:hidden" title={`Canoas/RS`}>
      <div className="flex items-center gap-1 text-slate-800">
         {weather.precipitation > 0 ? <CloudRain size={14} className="text-blue-500"/> : weather.cloud_cover > 50 ? <Cloud size={14} className="text-slate-500"/> : <Sun size={14} className="text-yellow-500"/>}
         <span className="text-[10px]">{weather.temperature_2m}°C</span>
      </div>
      <div className="hidden md:flex items-center gap-2 md:gap-3 text-slate-400">
         <span className="w-px h-3 bg-slate-200"></span>
         <span title="Sensação Térmica">S: {weather.apparent_temperature}°</span>
         <span className="w-px h-3 bg-slate-200"></span>
         <span className="flex items-center gap-0.5" title="Umidade Relativa"><Droplets size={10} className="text-blue-400"/> {weather.relative_humidity_2m}%</span>
         <span className="w-px h-3 bg-slate-200"></span>
         <span className="flex items-center gap-0.5" title="Vento"><Wind size={10} className="text-slate-400"/> {weather.wind_speed_10m} km/h</span>
      </div>
    </div>
  );
};

const BirthdayWidget = ({ staff }) => {
  const list = Array.isArray(staff) ? staff : [];
  const currentMonth = new Date().getMonth();
  const birthdays = list.filter(p => {
    const d = parseDate(getVal(p, ['nasc']));
    return d && d.getMonth() === currentMonth;
  }).sort((a, b) => (parseDate(getVal(a, ['nasc']))?.getDate() || 0) - (parseDate(getVal(b, ['nasc']))?.getDate() || 0));

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full font-sans min-h-[200px]">
      <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 text-white flex justify-between items-center">
        <h3 className="font-black flex items-center gap-2 text-[10px] uppercase tracking-widest"><Cake size={14} /> Aniversariantes do Mês</h3>
      </div>
      <div className="p-3 flex-1 overflow-y-auto max-h-[250px] space-y-2">
        {birthdays.map((p, i) => (
           <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center text-xs font-black shadow-sm">{parseDate(getVal(p, ['nasc']))?.getDate() || '-'}</div>
              <div className="flex-1">
                 <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{getVal(p, ['patente', 'posto'])} {getVal(p, ['nome'])}</p>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{getVal(p, ['expediente']) || getVal(p, ['setor', 'alocacao']) || 'Sem Expediente'}</p>
              </div>
           </div>
        ))}
        {birthdays.length === 0 && <p className="text-center py-6 text-slate-400 text-[10px] font-black uppercase tracking-widest">Nenhum aniversariante</p>}
      </div>
    </div>
  );
};

const GanttViewer = ({ feriasData }) => {
  const [mesFiltro, setMesFiltro] = useState(() => {
     const d = new Date();
     return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleMudarMes = (direcao) => {
     let dataBase = new Date();
     if (mesFiltro) {
        const [ano, mes] = mesFiltro.split('-');
        dataBase = new Date(ano, parseInt(mes) - 1, 1);
     }
     dataBase.setMonth(dataBase.getMonth() + direcao);
     setMesFiltro(`${dataBase.getFullYear()}-${String(dataBase.getMonth() + 1).padStart(2, '0')}`);
  };

  const obterNomeMes = (referencia) => {
     if (!referencia) return "MÊS ATUAL";
     const [ano, mes] = referencia.split('-');
     const dataFicticia = new Date(ano, parseInt(mes) - 1, 1);
     return dataFicticia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  let anoStrF = new Date().getFullYear();
  let mesStrF = new Date().getMonth();
  if (mesFiltro) {
      [anoStrF, mesStrF] = mesFiltro.split('-');
      anoStrF = parseInt(anoStrF);
      mesStrF = parseInt(mesStrF) - 1;
  }
  const daysInMonthF = new Date(anoStrF, mesStrF + 1, 0).getDate();
  const daysArrayF = Array.from({length: daysInMonthF}, (_, i) => i + 1);

  const feriasHomologadas = (feriasData || []).filter(f => {
     const st = String(getVal(f, ['status']) || '').trim().toLowerCase();
     return st.includes('homologado') || st === ''; 
  });

  const feriasListFiltradas = feriasHomologadas.filter(f => {
     const start = parseDate(getVal(f, ['inicio', 'data', 'saida']));
     const dias = parseInt(getVal(f, ['dias', 'quantidade'])) || 30; 
     if (!start) return false;
     
     const end = new Date(start);
     end.setDate(end.getDate() + dias - 1);
     
     const monthStart = new Date(anoStrF, mesStrF, 1, 0, 0, 0);
     const monthEnd = new Date(anoStrF, mesStrF + 1, 0, 23, 59, 59);

     return start <= monthEnd && end >= monthStart;
  });

  return (
    <div className="w-full">
       <div className="flex items-center gap-2 mb-4 justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <button onClick={() => handleMudarMes(-1)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-white rounded-xl transition-all active:scale-95"><ChevronLeft size={16}/></button>
          <div className="text-[10px] font-black uppercase text-slate-700 tracking-widest select-none">{obterNomeMes(mesFiltro)}</div>
          <button onClick={() => handleMudarMes(1)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-white rounded-xl transition-all active:scale-95"><ChevronRight size={16}/></button>
       </div>
       
       <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <div className="min-w-[800px]">
             <div className="bg-slate-100 flex border-b border-slate-200">
                <div className="w-32 p-3 text-[9px] font-black uppercase text-slate-500 tracking-widest sticky left-0 bg-slate-100 border-r border-slate-200 z-20 flex items-center shrink-0">Militar</div>
                <div className="w-32 md:w-40 p-3 text-[9px] font-black uppercase text-slate-500 tracking-widest sticky left-32 bg-slate-100 border-r border-slate-200 z-20 flex items-center shrink-0">Período</div>
                <div className="flex-1 flex">
                   {daysArrayF.map(d => {
                      const dt = new Date(anoStrF, mesStrF, d);
                      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                      return (
                        <div key={d} className={`flex-1 min-w-[20px] flex justify-center items-center py-2 border-r border-slate-200/60 text-[8px] font-bold ${isWeekend ? 'bg-slate-200 text-slate-400' : 'text-slate-600'}`}>{d}</div>
                   )})}
                </div>
             </div>
             
             {feriasListFiltradas.length > 0 ? feriasListFiltradas.map((f, i) => {
                const militar = getVal(f, ['militar', 'nome', 'oficial']);
                const start = parseDate(getVal(f, ['inicio', 'data', 'saida']));
                const dias = parseInt(getVal(f, ['dias', 'quantidade'])) || 30;
                const end = start ? new Date(start) : null;
                if (end) end.setDate(end.getDate() + dias - 1);

                return (
                   <div key={i} className="flex border-b border-slate-100 hover:bg-slate-50 group transition-colors">
                      <div className="w-32 p-3 text-[9px] md:text-[10px] font-black uppercase text-slate-700 tracking-tighter truncate sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-20 flex items-center shrink-0">{militar}</div>
                      <div className="w-32 md:w-40 p-2 md:p-3 text-[8px] md:text-[9px] font-bold text-amber-700 sticky left-32 bg-amber-50 group-hover:bg-amber-100 border-r border-slate-200 z-20 flex flex-col justify-center shrink-0 relative">
                         <span className="font-mono">{formatDate(start)}</span>
                         <span className="font-mono opacity-60 text-[7px]">até {formatDate(end)}</span>
                      </div>
                      <div className="flex-1 flex">
                         {daysArrayF.map(d => {
                            const currentDate = new Date(anoStrF, mesStrF, d, 12, 0, 0); 
                            const isVacation = start && end && currentDate >= start && currentDate <= end;
                            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                            let bgClass = isVacation ? "bg-amber-400 z-10 border-t border-b border-amber-500 shadow-inner" : (isWeekend ? "bg-slate-100/50" : "bg-transparent");
                            return (<div key={d} className={`flex-1 min-w-[20px] border-r border-slate-100 ${bgClass}`}></div>)
                         })}
                      </div>
                   </div>
                )
             }) : (
                <div className="p-6 text-center text-slate-400 font-bold uppercase tracking-widest text-[9px]">Sem férias homologadas neste mês.</div>
             )}
          </div>
       </div>
    </div>
  );
};

// =========================================================================
// --- MÓDULO GERADOR DA ESCALA VERMELHA ---
// =========================================================================
const EscalaManager = ({ appData }) => {
  const [activeSubTab, setActiveSubTab] = useState('oficial');
  const [mesStr, setMesStr] = useState("2026-03"); 
  const [feriados, setFeriados] = useState("");
  const [escalaGerada, setEscalaGerada] = useState(null);
  const [isGerando, setIsGerando] = useState(false);

  const ano = parseInt(mesStr.split('-')[0]);
  const mes = parseInt(mesStr.split('-')[1]) - 1;
  const daysInMonth = new Date(ano, mes + 1, 0).getDate();
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const feriadosArray = feriados.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

  const checkIndisponibilidade = (nome, dateObj) => {
      if (!nome) return null;
      const n = String(nome).toLowerCase().trim();
      const checkAfastamento = (lista, tipo) => {
         for (let item of (lista || [])) {
             if (String(getVal(item, ['status'])).toLowerCase().includes('rejeitado')) continue;
             if (String(getVal(item, ['militar', 'nome', 'oficial'])).toLowerCase().includes(n) || n.includes(String(getVal(item, ['militar'])).toLowerCase())) {
                 const start = parseDate(getVal(item, ['inicio', 'data', 'saida']));
                 const dias = parseInt(getVal(item, ['dias', 'quantidade'])) || 0;
                 if (start) {
                     const end = new Date(start);
                     end.setDate(end.getDate() + dias - 1);
                     if (dateObj >= start && dateObj <= end) return tipo;
                 }
             }
         }
         return null;
      };
      return checkAfastamento(appData.ferias, "Férias") || checkAfastamento(appData.licencas, "Licença") || checkAfastamento(appData.atestados, "Atestado");
  };

  const gerarEscalaAlgoritmo = () => {
     setIsGerando(true);
     let poolOficiais = (appData.officers || []).map(o => {
        let rawD1 = parseDate(getVal(o, ['plantao 1'])); 
        let rawD2 = parseDate(getVal(o, ['plantao 2'])); 
        let isGestante = String(getVal(o, ['gestante'])).toLowerCase() === 'sim' || String(getVal(o, ['gestante'])).toLowerCase() === 'true';
        return {
           nomeCompleto: `${getVal(o, ['patente', 'posto'])} ${getVal(o, ['nome'])}`,
           nomeCurto: getVal(o, ['nome']),
           servico: String(getVal(o, ['servico'])).toUpperCase() || 'UPI',
           antiguidade: parseInt(getVal(o, ['antiguidade'])) || 0, 
           d1: rawD1 ? rawD1.getTime() : new Date(2000, 0, 1).getTime(),
           isGestante: isGestante
        }
     });

     let schedule = {};
     for (let d of daysArray) {
         let dt = new Date(ano, mes, d, 12, 0, 0); 
         let isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
         let isFeriado = feriadosArray.includes(d);
         if (!isWeekend && !isFeriado) continue; 

         const getNext = (setor) => {
            let disponiveis = poolOficiais.filter(o => {
               if (o.isGestante) return false; 
               if (!o.servico.includes(setor)) return false;
               if (checkIndisponibilidade(o.nomeCurto, dt)) return false;
               return true;
            }).sort((a, b) => a.d1 - b.d1 || b.antiguidade - a.antiguidade);

            if (disponiveis.length > 0) {
               let escalado = disponiveis[0];
               poolOficiais = poolOficiais.map(o => o.nomeCurto === escalado.nomeCurto ? { ...o, d1: dt.getTime() } : o);
               return escalado.nomeCompleto;
            }
            return "SEM ESCALA";
         };

         schedule[d] = { upiD: getNext('UPI'), upiN: getNext('UPI'), utiD: getNext('UTI'), utiN: getNext('UTI') };
     }
     setTimeout(() => { setEscalaGerada(schedule); setIsGerando(false); }, 600); 
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn font-sans print:p-0">
       <div className="hidden print:block text-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Escala de Enfermagem - Vermelha</h2>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mt-1">Mês Ref: {mesStr}</p>
          <div className="w-full h-px bg-black my-4"></div>
       </div>

       <div className="print:hidden">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 w-full max-w-md">
             <button onClick={() => setActiveSubTab('oficial')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === 'oficial' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Mural Publicado</button>
             <button onClick={() => setActiveSubTab('gerador')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === 'gerador' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}><Wand2 size={12} className="inline mb-0.5"/> Gerador (Beta)</button>
          </div>
       </div>

       {activeSubTab === 'oficial' ? (
          <div className="animate-fadeIn print:block">
             <div className="flex justify-between items-end mb-4 print:hidden">
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter flex items-center gap-2"><CheckCircle className="text-green-500"/> Escala Oficial do Mês</h3>
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md hover:bg-slate-700 active:scale-95 transition-all"><Printer size={14}/> PDF</button>
             </div>
             <div className="overflow-x-auto rounded-xl border border-slate-200 print:w-full">
                <table className="w-full text-left text-xs min-w-[800px] print:min-w-full print:border-collapse">
                   <thead className="bg-slate-100 text-[9px] text-slate-500 font-black uppercase border-b print:bg-gray-100">
                      <tr><th className="p-3">Data</th><th className="p-3">Semana</th><th className="p-3 text-blue-800 bg-blue-50">UPI Diurno</th><th className="p-3 text-blue-900 bg-blue-100">UPI Noturno</th><th className="p-3 text-indigo-800 bg-indigo-50">UTI Diurno</th><th className="p-3 text-indigo-900 bg-indigo-100">UTI Noturno</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {(appData.escalasVermelhas || []).length > 0 ? (appData.escalasVermelhas.map((linha, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                           <td className="p-3 font-black text-slate-600">{formatDate(getVal(linha, ['data']))}</td>
                           <td className="p-3 font-bold text-slate-400">{getVal(linha, ['semana'])}</td>
                           <td className="p-3 font-bold uppercase">{getVal(linha, ['upi diurno'])}</td>
                           <td className="p-3 font-bold uppercase">{getVal(linha, ['upi noturno'])}</td>
                           <td className="p-3 font-bold uppercase">{getVal(linha, ['uti diurno'])}</td>
                           <td className="p-3 font-bold uppercase">{getVal(linha, ['uti noturno'])}</td>
                        </tr>
                      ))) : (<tr><td colSpan="6" className="p-6 text-center text-slate-400 font-bold uppercase text-[9px]">Aguardando dados da planilha...</td></tr>)}
                   </tbody>
                </table>
             </div>
          </div>
       ) : (
          <div className="animate-fadeIn">
             <div className="flex gap-2 mb-6 print:hidden">
                <input type="month" value={mesStr} onChange={e => setMesStr(e.target.value)} className="p-3 bg-slate-50 border rounded-xl font-bold text-xs"/>
                <button onClick={gerarEscalaAlgoritmo} disabled={isGerando} className="bg-purple-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                   {isGerando ? <Loader2 size={14} className="animate-spin"/> : <RefreshCcw size={14}/>} Gerar Sugestão
                </button>
             </div>
             {escalaGerada && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                   <table className="w-full text-left text-xs min-w-[800px] print:min-w-full">
                      <thead className="bg-slate-100 text-[9px] text-slate-500 font-black uppercase">
                         <tr><th className="p-3 w-16 text-center">Dia</th><th className="p-3">Semana</th><th className="p-3 bg-blue-50">UPI D</th><th className="p-3 bg-blue-100">UPI N</th><th className="p-3 bg-indigo-50">UTI D</th><th className="p-3 bg-indigo-100">UTI N</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {daysArray.map(d => {
                            const dt = new Date(ano, mes, d);
                            const isVermelha = dt.getDay() === 0 || dt.getDay() === 6 || feriadosArray.includes(d);
                            if (!isVermelha) return null;
                            const assignment = escalaGerada[String(d)];
                            return (
                               <tr key={d} className="bg-red-50/20">
                                  <td className="p-3 text-center font-black text-red-500">{String(d).padStart(2, '0')}</td>
                                  <td className="p-3 font-bold text-red-400">{dt.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}</td>
                                  <td className="p-3 font-bold uppercase">{assignment?.upiD || "-"}</td>
                                  <td className="p-3 font-bold uppercase">{assignment?.upiN || "-"}</td>
                                  <td className="p-3 font-bold uppercase">{assignment?.utiD || "-"}</td>
                                  <td className="p-3 font-bold uppercase">{assignment?.utiN || "-"}</td>
                               </tr>
                            )
                         })}
                      </tbody>
                   </table>
                </div>
             )}
          </div>
       )}
    </div>
  );
};

// =========================================================================
// --- TELAS BASE DO SISTEMA DE GESTÃO ---
// =========================================================================

const LoginScreen = ({ onLogin, appData, isSyncing, syncError, onForceSync }) => {
  const [roleGroup, setRoleGroup] = useState('chefia');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const list = Array.isArray(appData?.officers) ? appData.officers : [];
  const filtered = roleGroup === 'chefia' 
    ? list.filter(o => {
        const r = String(getVal(o, ['role'])).toLowerCase();
        const n = String(getVal(o, ['nome']));
        return r === 'admin' || r === 'rt' || n.includes('Cimirro') || n.includes('Zanini') || n.includes('Renata');
      }) 
    : list.filter(o => {
        const r = String(getVal(o, ['role'])).toLowerCase();
        const n = String(getVal(o, ['nome']));
        return r !== 'admin' && r !== 'rt' && !n.includes('Cimirro') && !n.includes('Zanini') && !n.includes('Renata');
      });

  const handleAuth = () => {
    setLoginError('');
    const selectedUser = list.find(o => getVal(o, ['nome']) === user);
    if (selectedUser) {
       const correctPassword = String(getVal(selectedUser, ['senha', 'pwd']) || '123456').trim();
       if (String(password).trim() === correctPassword) {
           const nome = getVal(selectedUser, ['nome']);
           let role = getVal(selectedUser, ['role']) || 'user';
           if (nome.includes('Cimirro') || nome.includes('Zanini')) role = 'admin';
           onLogin(nome, role);
       } else { setLoginError('Senha incorreta.'); }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {isSyncing && <div className="absolute top-6 right-6 flex items-center gap-2 text-blue-400 text-[10px] font-black bg-blue-900/30 px-4 py-2 rounded-full border border-blue-800/50"><Loader2 size={14} className="animate-spin"/> Conectando</div>}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
           <div className="bg-blue-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30"><Plane size={32} className="text-white transform -rotate-12"/></div>
           <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Enfermagem HACO</h1>
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Gestão Integrada</p>
        </div>

        {syncError && (
           <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-bold uppercase mb-6 border border-red-100 flex items-center justify-between">
              <span>⚠️ FALHA NA LEITURA</span>
              <button onClick={onForceSync} className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 active:scale-95 transition-all">Recarregar</button>
           </div>
        )}

        <div className="bg-slate-100 p-1.5 rounded-2xl flex mb-6">
           <button onClick={() => {setRoleGroup('chefia'); setUser(''); setPassword('');}} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${roleGroup === 'chefia' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Chefia / RT</button>
           <button onClick={() => {setRoleGroup('tropa'); setUser(''); setPassword('');}} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${roleGroup === 'tropa' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}>Oficiais</button>
        </div>
        <div className="space-y-4">
          <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold outline-none appearance-none cursor-pointer" value={user} onChange={e => {setUser(e.target.value); setLoginError('');}}>
             <option value="">{isSyncing && list.length === 0 ? "A ler dados..." : "Escolha seu nome..."}</option>
             {filtered.map((o, idx) => (<option key={idx} value={getVal(o, ['nome'])}>{getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}</option>))}
          </select>
          {user && (
            <div className="animate-fadeIn">
              <input type="password" value={password} onChange={e => {setPassword(e.target.value); setLoginError('');}} placeholder="Digite sua senha" onKeyDown={e => e.key === 'Enter' && handleAuth()} className="w-full p-4 border rounded-2xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              {loginError && <p className="text-red-500 text-[10px] font-bold mt-2">{loginError}</p>}
            </div>
          )}
          <button onClick={handleAuth} disabled={!user || !password || isSyncing} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl transition-all active:scale-95 ${user && password && !isSyncing ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-slate-300 cursor-not-allowed'}`}>Acessar Sistema</button>
        </div>
      </div>
    </div>
  );
};

const UserDashboard = ({ user, onLogout, appData, syncData, isSyncing, isAdmin, onToggleAdmin }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [modals, setModals] = useState({ atestado: false, permuta: false, ferias: false, licenca: false, gantt: false, password: false });
  const [form, setForm] = useState({ dias: '', inicio: '', sub: '', sai: '', entra: '' });
  const [passForm, setPassForm] = useState({ new: '', confirm: '' });
  const [fileData, setFileData] = useState(null);

  const handleSend = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action, payload: { ...payload, file: fileData } }) });
      setTimeout(() => { setIsSaving(false); setModals({ ...modals, atestado: false, permuta: false, ferias: false, licenca: false, password: false }); setFileData(null); syncData(true); }, 1500);
    } catch(e) { setIsSaving(false); alert("Erro ao enviar."); }
  };

  const userSafeName = String(user).toLowerCase().trim();
  const getMyData = (list) => (list || []).filter(item => {
    const nomeM = String(getVal(item, ['militar', 'solicitante', 'nome'])).toLowerCase();
    return nomeM.includes(userSafeName) || userSafeName.includes(nomeM);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md">HA</div>
          <div><h1 className="font-black text-slate-800 text-sm uppercase">Ten {user}</h1><p className="text-[9px] text-slate-400 font-black uppercase">Painel Militar</p></div>
        </div>
        <div className="flex items-center gap-2">
           <WeatherWidgetMini />
           {isAdmin && <button onClick={onToggleAdmin} className="bg-blue-50 p-2.5 rounded-xl text-blue-600 font-black text-[9px] uppercase hover:bg-blue-100 border border-blue-200 transition-all active:scale-90"><Shield size={14}/></button>}
           <button onClick={() => setModals({...modals, password: true})} className="bg-slate-100 p-2.5 rounded-xl text-slate-500 hover:text-blue-500 transition-all active:scale-90"><Key size={16}/></button>
           <button onClick={onLogout} className="bg-slate-100 p-2.5 rounded-xl text-slate-500 hover:text-red-500 transition-all active:scale-90"><LogOut size={16}/></button>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-5">
        <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden"><h2 className="text-xl font-black uppercase tracking-tighter relative z-10">Mural de Avisos</h2><Plane className="absolute -bottom-4 -right-4 text-white/10" size={100}/></div>
        
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => setModals({...modals, atestado: true})} className="bg-white p-3 rounded-2xl border shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all"><ShieldAlert size={18}/></div><span className="font-black text-[8px] uppercase text-slate-700">Atestado</span></button>
          <button onClick={() => setModals({...modals, permuta: true})} className="bg-white p-3 rounded-2xl border shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><ArrowRightLeft size={18}/></div><span className="font-black text-[8px] uppercase text-slate-700">Permuta</span></button>
          <button onClick={() => setModals({...modals, ferias: true})} className="bg-white p-3 rounded-2xl border shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all"><Sun size={18}/></div><span className="font-black text-[8px] uppercase text-slate-700">Férias</span></button>
          <button onClick={() => setModals({...modals, licenca: true})} className="bg-white p-3 rounded-2xl border shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-pink-50 text-pink-500 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-all"><Baby size={18}/></div><span className="font-black text-[8px] uppercase text-slate-700">Licença</span></button>
        </div>

        <button onClick={() => setModals({...modals, gantt: true})} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
           <CalendarDays size={16}/> Escala de Férias Geral
        </button>

        <div className="pt-4">
           <h3 className="font-black text-slate-800 text-xs uppercase mb-4 flex items-center gap-2">Meus Últimos Registros <button onClick={()=>syncData(true)} className="p-1 border rounded shadow-sm"><RefreshCw size={12} className={isSyncing?'animate-spin':''}/></button></h3>
           <div className="space-y-2">
              {[...getMyData(appData.atestados), ...getMyData(appData.permutas), ...getMyData(appData.ferias), ...getMyData(appData.licencas)].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center animate-fadeIn">
                   <div className="text-xs">
                      <p className="font-black text-slate-800 uppercase text-[10px]">{getVal(item, ['tipo']) || 'Registro'}</p>
                      <span className="text-slate-400 font-bold text-[8px]">{formatDate(getVal(item,['data','inicio','sai']))}</span>
                   </div>
                   <span className={`text-[8px] px-2 py-1 rounded font-black uppercase ${String(getVal(item, ['status'])).toLowerCase() === 'pendente' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-700'}`}>{getVal(item, ['status']) || 'Homologado'}</span>
                </div>
              ))}
              {[...getMyData(appData.atestados), ...getMyData(appData.permutas), ...getMyData(appData.ferias), ...getMyData(appData.licencas)].length === 0 && (
                <div className="py-8 text-center text-slate-300 font-black uppercase text-[10px] border-2 border-dashed rounded-3xl">Sem registros recentes</div>
              )}
           </div>
        </div>
      </main>

      {/* MODAIS USER */}
      {modals.gantt && <Modal title="Escala Geral de Férias" onClose={() => setModals({...modals, gantt: false})}><GanttViewer feriasData={appData.ferias} /></Modal>}
      {modals.password && <Modal title="Trocar Senha" onClose={() => setModals({...modals, password: false})}><form onSubmit={(e) => {e.preventDefault(); if(passForm.new === passForm.confirm) handleSend('saveOfficer', { nome: user, senha: passForm.new });}} className="space-y-4"><input type="password" required placeholder="Nova Senha" className="w-full p-3 rounded-xl bg-slate-50 border font-bold" onChange={e=>setPassForm({...passForm,new:e.target.value})}/><input type="password" required placeholder="Confirme" className="w-full p-3 rounded-xl bg-slate-50 border font-bold" onChange={e=>setPassForm({...passForm,confirm:e.target.value})}/><button className="w-full py-4 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase shadow-lg active:scale-95 transition-all">Salvar Nova Senha</button></form></Modal>}
      {modals.atestado && <Modal title="Anexar Atestado" onClose={() => setModals({...modals, atestado: false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveAtestado',{militar:user,inicio:form.inicio,dias:form.dias,status:'Pendente'});}} className="space-y-4"><input type="date" required className="w-full p-3 rounded-xl border font-bold" onChange={e=>setForm({...form,inicio:e.target.value})}/><input type="number" required placeholder="Total de Dias" className="w-full p-3 rounded-xl border font-bold" onChange={e=>setForm({...form,dias:e.target.value})}/><FileUpload onFileSelect={setFileData}/><button className="w-full py-4 bg-red-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg active:scale-95 transition-all">Protocolar Atestado</button></form></Modal>}
      {modals.permuta && <Modal title="Pedir Permuta" onClose={() => setModals({...modals, permuta: false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('savePermuta',{solicitante:user,substituto:form.sub,datasai:form.sai,dataentra:form.entra,status:'Pendente'});}} className="space-y-4"><input type="date" required className="w-full p-3 rounded-xl border font-bold" onChange={e=>setForm({...form,sai:e.target.value})}/><select required className="w-full p-3 rounded-xl border font-bold" onChange={e=>setForm({...form,sub:e.target.value})}><option value="">Escolha Substituto...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select><input type="date" required className="w-full p-3 rounded-xl border font-bold" onChange={e=>setForm({...form,entra:e.target.value})}/><button className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg active:scale-95 transition-all">Solicitar Troca</button></form></Modal>}
      {modals.ferias && <Modal title="Solicitar Férias" onClose={() => setModals({...modals, ferias: false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveFerias',{militar:user,inicio:form.inicio,dias:form.dias,status:'Pendente'});}} className="space-y-4"><input type="date" required className="w-full p-3 rounded-xl border font-bold" onChange={e=>setForm({...form,inicio:e.target.value})}/><select required className="w-full p-3 rounded-xl border font-bold" onChange={e=>setForm({...form,dias:e.target.value})}><option value="">Selecione Parcela...</option><option value="10">10 dias</option><option value="15">15 dias</option><option value="20">20 dias</option><option value="30">30 dias</option></select><button className="w-full py-4 bg-amber-500 text-white font-black rounded-xl text-[10px] uppercase shadow-lg active:scale-95 transition-all">Solicitar Férias</button></form></Modal>}
      {modals.licenca && <Modal title="Solicitar Licença" onClose={() => setModals({...modals, licenca: false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveLicenca',{militar:user,inicio:form.inicio,dias:form.dias,status:'Pendente'});}} className="space-y-4"><input type="date" required className="w-full p-3 rounded-xl border font-bold" onChange={e=>setForm({...form,inicio:e.target.value})}/><select required className="w-full p-3 rounded-xl border font-bold" onChange={e=>setForm({...form,dias:e.target.value})}><option value="">Selecione...</option><option value="120">120 dias</option><option value="180">180 dias</option></select><FileUpload onFileSelect={setFileData}/><button className="w-full py-4 bg-pink-500 text-white font-black rounded-xl text-[10px] uppercase shadow-lg active:scale-95 transition-all">Protocolar Licença</button></form></Modal>}
    </div>
  );
};

const MainSystem = ({ user, role, onLogout, appData, syncData, isSyncing, onToggleAdmin, isCimirro }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [homologandoId, setHomologandoId] = useState(null);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [formOfficer, setFormOfficer] = useState({ expediente: [], servico: '', gestante: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'antiguidade', direction: 'asc' });

  const isApenasRT = role === 'rt'; 
  const absenteismoDados = calculateAbsenteismoStats(appData.atestados, (appData.officers||[]).length);
  const atestadosAtivos = getActiveAfastamentos(appData.atestados);
  const licencasAtivas = getActiveAfastamentos(appData.licencas);

  const sendData = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action, payload }) });
      setTimeout(() => { setIsSaving(false); setShowOfficerModal(false); syncData(true); }, 1500); 
    } catch (e) { setIsSaving(false); alert("Falha na gravação."); }
  };

  const handleHomologar = async (id, sheetName, novoStatus = 'Homologado') => {
    if (isApenasRT) return;
    setHomologandoId(id);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'updateStatus', payload: { sheet: sheetName, id: id, status: novoStatus } }) });
      setTimeout(() => { setHomologandoId(null); syncData(true); }, 1500);
    } catch(e) { setHomologandoId(null); alert("Erro ao atualizar status."); }
  };

  const handleToggleExpediente = (local) => {
    const current = Array.isArray(formOfficer.expediente) ? formOfficer.expediente : [];
    if (current.includes(local)) setFormOfficer({...formOfficer, expediente: current.filter(l => l !== local)});
    else setFormOfficer({...formOfficer, expediente: [...current, local]});
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ label, sortKey, align = 'left' }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th className={`p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none ${align === 'center' ? 'text-center' : 'text-left'}`} onClick={() => handleSort(sortKey)}>
        <div className={`inline-flex items-center gap-1 ${isActive ? 'text-blue-600 font-black' : 'text-slate-400'}`}>
          {label} {isActive ? (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ChevronsUpDown size={12} className="opacity-30"/>}
        </div>
      </th>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        const bradenInfo = getBradenClass(appData.upi.mediaBraden);
        const fugulinInfo = getFugulinClass(appData.upi.mediaFugulin);
        const pendentesTotal = (appData.atestados||[]).filter(x=>getVal(x,['status'])==='Pendente').length + 
                               (appData.ferias||[]).filter(x=>getVal(x,['status'])==='Pendente').length + 
                               (appData.licencas||[]).filter(x=>getVal(x,['status'])==='Pendente').length;
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-4 bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 opacity-5"><Activity size={180}/></div>
                   <div className="flex items-center gap-5 relative z-10">
                      <div className="bg-blue-600 p-4 rounded-2xl shadow-lg"><Activity size={28}/></div>
                      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Status UPI</h3>
                   </div>
                   <div className="flex gap-8 text-center relative z-10 font-black">
                      <div><p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Ocupação</p><p className="text-3xl md:text-4xl">{appData.upi.leitosOcupados} <span className="text-base text-slate-700 font-bold">/ 15</span></p></div>
                      <div>
                         <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Braden</p>
                         <p className="text-3xl md:text-4xl text-yellow-500">{appData.upi.mediaBraden.toFixed(1)}</p>
                         <span className={`text-[7px] md:text-[8px] uppercase font-black ${bradenInfo.color}`}>{bradenInfo.label}</span>
                      </div>
                      <div>
                         <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Fugulin</p>
                         <p className="text-3xl md:text-4xl text-green-500">{appData.upi.mediaFugulin.toFixed(1)}</p>
                         <span className={`text-[7px] md:text-[8px] uppercase font-black ${fugulinInfo.color}`}>{fugulinInfo.label}</span>
                      </div>
                   </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Efetivo Total</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{(appData.officers||[]).length}</h3>
                </div>
                <div className="bg-white p-5 rounded-3xl border flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Pendentes</p>
                  <h3 className="text-3xl font-black text-blue-600 tracking-tighter">{pendentesTotal}</h3>
                </div>
                <div className="bg-red-50 p-5 rounded-3xl border border-red-100 flex flex-col items-center justify-center shadow-sm">
                  <p className="text-[9px] font-black uppercase text-red-400 mb-1 tracking-widest">Afastados</p>
                  <h3 className="text-3xl font-black text-red-600 tracking-tighter">{atestadosAtivos.length + licencasAtivas.length}</h3>
                  <p className="text-[7px] font-black text-red-400 uppercase">{atestadosAtivos.length} Atestados / {licencasAtivas.length} Licenças</p>
                </div>
                <div className="col-span-2 shadow-sm border border-slate-200 rounded-3xl bg-white overflow-hidden flex flex-col h-full min-h-[200px]">
                   <BirthdayWidget staff={appData.officers}/>
                </div>
            </div>
          </div>
        );
      case 'efetivo':
         const sortedOfficers = [...(appData.officers||[])].sort((a,b) => {
            const { key, direction } = sortConfig;
            let valA = key === 'antiguidade' ? (parseInt(getVal(a,[key])) || 0) : String(getVal(a,[key])).toLowerCase();
            let valB = key === 'antiguidade' ? (parseInt(getVal(b,[key])) || 0) : String(getVal(b,[key])).toLowerCase();
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
         });
         return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn font-sans">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter">Quadro de Oficiais</h3>
                {!isApenasRT && <button onClick={() => { setFormOfficer({ expediente: [], servico: '', gestante: '' }); setShowOfficerModal(true); }} className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase flex items-center gap-2 active:scale-95 shadow-md transition-all"><UserPlus size={16}/> Incluir Oficial</button>}
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[800px]"><thead className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr><SortableHeader label="Ant." sortKey="antiguidade" align="center" /><SortableHeader label="Posto/Nome" sortKey="nome" /><SortableHeader label="Alocação" sortKey="expediente" /><th className="p-4 text-right">Ação</th></tr>
                  </thead><tbody className="divide-y divide-slate-50">
                   {sortedOfficers.map((o, i) => (
                      <tr key={i} className="hover:bg-slate-50 group transition-colors">
                        <td className="p-4 font-black text-slate-300 text-center">{getVal(o, ['antiguidade'])}</td>
                        <td className="p-4"><div className="flex items-center gap-2 font-black text-blue-600 uppercase text-xs"><span>{getVal(o,['patente', 'posto'])} {getVal(o, ['nome'])}</span>{(String(getVal(o,['gestante'])).toLowerCase()==='sim') && <Baby size={12} className="text-pink-400"/>}</div></td>
                        <td className="p-4"><div className="flex flex-wrap gap-1">{String(getVal(o, ['expediente'])).split(',').map((ex,idx)=>(<span key={idx} className="bg-slate-100 text-slate-500 text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-slate-200">{ex.trim()}</span>))}</div><p className="text-[8px] font-black uppercase text-indigo-600 mt-1">Serviço: {getVal(o,['servico']) || '-'}</p></td>
                        <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                           {!isApenasRT && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => { setFormOfficer({...o, expediente: String(getVal(o,['expediente'])).split(',').map(x=>x.trim())}); setShowOfficerModal(true); }} className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"><Edit3 size={14}/></button>
                                <button onClick={() => { if(window.confirm(`Remover ${getVal(o,['nome'])}?`)) sendData('deleteOfficer', { nome: getVal(o,['nome']) }); }} className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"><Trash2 size={14}/></button>
                              </div>
                           )}
                        </td>
                      </tr>
                   ))}
                </tbody>
              </table></div>
            </div>
         );
      case 'absenteismo':
         return (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 animate-fadeIn font-sans shadow-sm">
               <div className="flex justify-between items-center mb-8 border-b pb-6">
                 <div>
                    <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter flex items-center gap-2"><TrendingDown className="text-red-500"/> Absenteísmo</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Dados de Atestados Médicos ({absenteismoDados.currentYear})</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taxa Anual Acumulada</p>
                    <h2 className="text-4xl font-black text-red-600 tracking-tighter">{absenteismoDados.annualRate}%</h2>
                 </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {absenteismoDados.months.map((m, idx) => (
                     <div key={idx} className={`p-5 rounded-2xl border transition-all ${m.rate > 5 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                        <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">{m.monthName}</p>
                        <div className="flex justify-between items-end">
                           <p className="text-2xl font-black tracking-tighter text-slate-800">{m.rate}%</p>
                           <p className="text-[9px] font-bold uppercase text-slate-400">{m.lostDays} dias</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         );
      case 'escala':
         return isCimirro ? <EscalaManager appData={appData} /> : null;
      case 'atestados':
         return (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm animate-fadeIn font-sans">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-xl uppercase tracking-tighter flex items-center gap-2"><ShieldAlert className="text-red-500"/> Registro de Atestados</h3>
               </div>
               <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] font-black uppercase border-b text-slate-400 tracking-widest"><tr><th className="p-4">Militar</th><th className="p-4">Início</th><th className="p-4">Dias</th><th className="p-4 text-center">Anexo</th><th className="p-4">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
               <tbody className="divide-y divide-slate-50">
                  {(appData.atestados||[]).map((a,i)=>{
                     const idR = getVal(a,['id']);
                     const isP = getVal(a,['status']) === 'Pendente';
                     return (
                     <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-black uppercase text-xs">{getVal(a,['militar'])}</td>
                        <td className="p-4 text-[10px] font-bold text-slate-400 font-mono">{formatDate(getVal(a,['inicio']))}</td>
                        <td className="p-4 text-[10px] font-black text-red-500">{getVal(a,['dias'])} dias</td>
                        <td className="p-4 text-center">{getVal(a,['anexo']) ? <a href={getVal(a,['anexo'])} target="_blank" rel="noreferrer" className="text-blue-500 p-2 bg-blue-50 rounded-lg inline-block hover:bg-blue-100 transition-colors shadow-sm"><Paperclip size={14}/></a> : '-'}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded text-[8px] font-black uppercase ${isP ? 'bg-amber-100 text-amber-600' : 'bg-green-50 text-green-700'}`}>{getVal(a,['status'])}</span></td>
                        <td className="p-4 text-right">
                           {isP && !isApenasRT && (
                              <button onClick={()=>handleHomologar(idR, 'Atestados')} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 active:scale-95 transition-all">Aprovar</button>
                           )}
                        </td>
                     </tr>
                  )})}
               </tbody>
               </table></div>
            </div>
         );
      case 'ferias':
         return <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm animate-fadeIn"><h3 className="font-black text-xl uppercase mb-6 tracking-tighter flex items-center gap-2"><Sun className="text-amber-500"/> Escala de Férias</h3><GanttViewer feriasData={appData.ferias || []} /></div>;
      case 'licencas':
         return (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm animate-fadeIn font-sans">
               <h3 className="font-black text-xl uppercase mb-6 tracking-tighter flex items-center gap-2"><Baby className="text-pink-500"/> Mural de Licenças</h3>
               <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] font-black uppercase border-b text-slate-400 tracking-widest"><tr><th className="p-4">Militar</th><th className="p-4">Início</th><th className="p-4">Duração</th><th className="p-4">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
               <tbody className="divide-y divide-slate-50">
                  {(appData.licencas||[]).map((l,i)=>(
                     <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-black uppercase text-xs">{getVal(l,['militar'])}</td>
                        <td className="p-4 text-[10px] font-bold text-slate-400 font-mono">{formatDate(getVal(l,['inicio']))}</td>
                        <td className="p-4 text-[10px] font-black text-pink-500">{getVal(l,['dias'])} dias</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded text-[8px] font-black uppercase ${getVal(l,['status'])==='Pendente'?'bg-amber-100 text-amber-600':'bg-green-50 text-green-700'}`}>{getVal(l,['status'])}</span></td>
                        <td className="p-4 text-right">
                           {getVal(l,['status']) === 'Pendente' && !isApenasRT && (
                              <button onClick={()=>handleHomologar(getVal(l,['id']), 'Licencas')} className="bg-pink-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-md hover:bg-pink-700 active:scale-95 transition-all">Aprovar</button>
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
               </table></div>
            </div>
         );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <aside className={`${sidebarOpen ? 'w-64 md:w-72' : 'w-20 md:w-24'} bg-slate-950 text-white transition-all duration-300 flex flex-col z-40 border-r border-white/5 shadow-2xl`}>
         <div className="p-6 md:p-8 h-20 md:h-24 flex items-center border-b border-white/5">{sidebarOpen && <div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Plane size={20}/></div><span className="font-black text-lg md:text-xl uppercase tracking-tighter">ENF-HACO</span></div>}<button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-2 rounded-xl hover:bg-white/10 transition-colors"><Menu size={20}/></button></div>
         <nav className="flex-1 py-6 px-3 md:px-4 space-y-2 overflow-y-auto">
            {[ 
               { id: 'dashboard', label: 'Início', icon: LayoutDashboard }, 
               { id: 'atestados', label: 'Atestados', icon: ShieldAlert }, 
               { id: 'ferias', label: 'Férias', icon: Sun }, 
               { id: 'licencas', label: 'Licenças', icon: Baby }, 
               { id: 'efetivo', label: 'Efetivo', icon: Users }, 
               isCimirro && { id: 'escala', label: 'Escala Vermelha', icon: Calendar }, 
               { id: 'absenteismo', label: 'Absenteísmo', icon: TrendingDown } 
            ].filter(Boolean).map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><item.icon size={20}/>{sidebarOpen && <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{item.label}</span>}</button>
            ))}
         </nav>
         <div className="p-6 border-t border-white/5 space-y-3">
            <button onClick={onToggleAdmin} className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase w-full p-3.5 rounded-xl shadow-lg transition-all"><UserCircle size={16}/> {sidebarOpen && 'Meu Painel'}</button>
            <button onClick={onLogout} className="flex items-center justify-center gap-3 text-slate-500 hover:text-red-400 font-black text-[10px] uppercase w-full p-3 rounded-xl transition-all"><LogOut size={16}/> {sidebarOpen && 'Sair'}</button>
         </div>
      </aside>
      <main className="flex-1 overflow-auto p-8 md:p-10 relative bg-slate-50/50">
         <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6 print:hidden">
            <h2 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</h2>
            <div className="flex items-center gap-4">
              <WeatherWidgetMini />
              <button onClick={() => syncData(true)} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-blue-600 hover:bg-slate-50 active:scale-95 transition-all"><RefreshCw size={20} className={isSyncing?'animate-spin':''}/></button>
            </div>
         </header>
         {renderContent()}
         {showOfficerModal && !isApenasRT && (
            <Modal title={formOfficer.nome ? "Editar Militar" : "Incluir Militar"} onClose={()=>setShowOfficerModal(false)}>
               <form onSubmit={(e)=>{e.preventDefault(); sendData('saveOfficer', {...formOfficer, id: formOfficer.id || Date.now(), expediente: Array.isArray(formOfficer.expediente) ? formOfficer.expediente.join(', ') : formOfficer.expediente});}} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nome de Guerra</label><input type="text" required value={getVal(formOfficer,['nome'])} className="w-full p-4 border rounded-2xl bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500 outline-none mt-1" onChange={e=>setFormOfficer({...formOfficer, nome: e.target.value})}/></div>
                     <div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Patente</label><input type="text" required value={getVal(formOfficer,['patente'])} className="w-full p-4 border rounded-2xl bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500 outline-none mt-1" onChange={e=>setFormOfficer({...formOfficer, patente: e.target.value})}/></div>
                     <div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Antiguidade</label><input type="number" required value={getVal(formOfficer,['antiguidade'])} className="w-full p-4 border rounded-2xl bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500 outline-none mt-1" onChange={e=>setFormOfficer({...formOfficer, antiguidade: e.target.value})}/></div>
                     <div className="col-span-2 py-3 border-t"><label className="text-[9px] font-black uppercase text-blue-500 ml-1 mb-2 block tracking-widest font-black">Locais Expediente</label>
                        <div className="grid grid-cols-4 gap-2">
                           {LOCAIS_EXPEDIENTE.map(local => (
                              <button key={local} type="button" onClick={() => handleToggleExpediente(local)} className={`py-2 rounded-xl text-[8px] font-black border transition-all ${ (formOfficer.expediente || []).includes(local) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-200' }`}>{local}</button>
                           ))}
                        </div>
                     </div>
                     <div className="col-span-2"><label className="text-[9px] font-black uppercase text-indigo-500 ml-1 mb-2 block tracking-widest font-black">Alocação Serviço (Único)</label>
                        <div className="flex gap-2">
                           {LOCAIS_SERVICO.map(serv => (
                              <button key={serv} type="button" onClick={() => setFormOfficer({...formOfficer, servico: serv})} className={`flex-1 p-3 rounded-xl text-[10px] font-black border transition-all ${ formOfficer.servico === serv ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200' }`}>{serv}</button>
                           ))}
                        </div>
                     </div>
                     <div className="col-span-2 flex items-center gap-3 p-4 bg-pink-50 rounded-2xl border border-pink-100 cursor-pointer hover:bg-pink-100 transition-colors" onClick={() => setFormOfficer({...formOfficer, gestante: formOfficer.gestante === 'Sim' ? '' : 'Sim'})}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formOfficer.gestante === 'Sim' ? 'bg-pink-500 border-pink-500' : 'border-pink-200 bg-white'}`}>
                           {formOfficer.gestante === 'Sim' && <CheckSquare size={14} className="text-white"/>}
                        </div>
                        <span className="text-[10px] font-black uppercase text-pink-600 tracking-widest">Militar Gestante (Isenta de Escala Vermelha)</span>
                     </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all mt-4">{isSaving ? 'A Gravar...' : 'Salvar Alterações'}</button>
               </form>
            </Modal>
         )}
      </main>
    </div>
  );
}

// =========================================================================
// --- COMPONENTE APP PRINCIPAL ---
// =========================================================================

export default function App() {
  const [auth, setAuth] = useState({ user: null, role: null, isAdmin: false });
  const [appData, setAppData] = useState({ officers: [], atestados: [], permutas: [], ferias: [], licencas: [], escalasVermelhas: [], upi: { leitosOcupados: 0, mediaBraden: 0, mediaFugulin: 0 } });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);

  const syncData = async (force = false) => {
    if (isSyncing) return;
    setIsSyncing(true); setSyncError(false);
    try {
      // Muitos scripts do GAS esperam um POST com parâmetro 'read' para evitar erros de doGet inválido
      // ou retornam texto puro em vez de JSON se houver erro de permissão.
      const response = await fetch(API_URL_GESTAO, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'read' })
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // Se falhar o POST (ex: script só aceita GET), tentamos o GET simples como fallback
        const getResponse = await fetch(`${API_URL_GESTAO}?action=read`);
        const getText = await getResponse.text();
        data = JSON.parse(getText);
      }

      if (data && data.status === 'success') {
         setAppData({
            officers: data.oficiais || [],
            atestados: data.atestados || [],
            permutas: data.permutas || [],
            ferias: data.ferias || [],
            licencas: data.licencas || [],
            escalasVermelhas: data.escalaVermelha || [],
            upi: data.upi_resumo || { leitosOcupados: 0, mediaBraden: 0, mediaFugulin: 0 }
         });
      } else { 
        console.error("Erro no formato da resposta", data);
        setSyncError(true); 
      }
    } catch (e) { 
      console.error("Erro na conexão com API", e);
      setSyncError(true); 
    } 
    finally { setIsSyncing(false); }
  };

  useEffect(() => { syncData(); }, []);

  if (!auth.user) return <LoginScreen onLogin={(user, role) => setAuth({ user, role, isAdmin: role === 'admin' })} appData={appData} isSyncing={isSyncing} syncError={syncError} onForceSync={() => syncData()} />;

  if (auth.isAdmin) {
    return (
      <ErrorBoundary>
        <MainSystem user={auth.user} role={auth.role} onLogout={() => setAuth({ user: null, role: null, isAdmin: false })} appData={appData} syncData={syncData} isSyncing={isSyncing} onToggleAdmin={() => setAuth({ ...auth, isAdmin: false })} isCimirro={auth.user.includes('Cimirro') || auth.user.includes('Norberto')} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <UserDashboard user={auth.user} onLogout={() => setAuth({ user: null, role: null, isAdmin: false })} appData={appData} syncData={syncData} isSyncing={isSyncing} isAdmin={auth.role === 'rt' || auth.user.includes('Cimirro') || auth.user.includes('Norberto')} onToggleAdmin={() => setAuth({ ...auth, isAdmin: true })} />
    </ErrorBoundary>
  );
}
