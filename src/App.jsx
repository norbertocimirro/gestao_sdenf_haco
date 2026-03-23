import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Cake, BookOpen, Plus, Trash2, Edit3, 
  UserPlus, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, Thermometer, TrendingDown, Plane, CheckSquare, Square,
  ChevronUp, ChevronDown, ChevronsUpDown, CalendarClock, PieChart,
  ChevronLeft, ChevronRight, Key, Lock, Sun, CalendarDays, History, UserCircle, Shield,
  Bed, Baby, MapPin, Cloud, CloudRain, Droplets, Wind, Calendar, RefreshCcw, Printer, CheckCircle
} from 'lucide-react';

// =========================================================================
// --- CONFIGURAÇÕES GLOBAIS DE CONEXÃO E DADOS ---
// =========================================================================
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 
const API_URL_PASSAGEM = "https://script.google.com/macros/s/AKfycbyHw6wCJGdI1I1NX7kIwqdyW3BLRcIwBVX28HsimrdElZ2EOY82c4p3Kt73XY0n1vsbww/exec";

const LOCAIS_EXPEDIENTE = ["SDENF", "FUNSA", "CAIS", "UCC", "UPA", "UTI", "UPI", "SAD", "SSOP", "SIL", "FERISTA"];
const LOCAIS_SERVICO = ["UTI", "UPI"];

const SECTORS_PASS = [
    { id: 'UPI', name: 'UPI (Clínica/Cirúrgica)', type: 'ward' },
    { id: 'UTI', name: 'UTI (Intensiva)', type: 'ward' },
    { id: 'UCC', name: 'UCC (Centro Cirúrgico)', type: 'surgery' },
    { id: 'UPA', name: 'UPA (Pronto Atendimento)', type: 'er' },
    { id: 'CAIS', name: 'CAIS (ESF)', type: 'er' }
];

const SHIFTS_PASS = [
    { id: 'Manhã', color: 'bg-amber-100 text-amber-700' },
    { id: 'Tarde', color: 'bg-orange-100 text-orange-700' },
    { id: 'Noite', color: 'bg-indigo-100 text-indigo-700' }
];

const MONTHS_PASS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

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

// Leitor Ultra-Seguro para a Passagem de Turno (Ignora falhas no Google Sheets)
const safeGet = (obj, searchTerms) => {
    if (!obj || typeof obj !== 'object') return "";
    const keys = Object.keys(obj);
    for (let term of searchTerms) {
        const t = String(term).trim().toLowerCase();
        const foundKey = keys.find(k => String(k).trim().toLowerCase() === t);
        if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null && obj[foundKey] !== "") {
            return obj[foundKey];
        }
    }
    return "";
};

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

const safeParseFloat = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const strVal = String(value);
  const match = strVal.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return 0;
  const num = parseFloat(match[0].replace(',', '.'));
  return isNaN(num) ? 0 : num;
};

const getBradenClass = (score) => {
   if (score === 0) return { label: "Sem Dados", color: "text-slate-500" };
   if (score <= 9) return { label: "Risco Muito Elevado", color: "text-red-500" };
   if (score <= 12) return { label: "Risco Elevado", color: "text-orange-500" };
   if (score <= 14) return { label: "Risco Moderado", color: "text-amber-500" };
   if (score <= 18) return { label: "Baixo Risco", color: "text-yellow-600" };
   return { label: "Sem Risco", color: "text-green-500" };
};

const getFugulinClass = (score) => {
   if (score === 0) return { label: "Sem Dados", color: "text-slate-500" };
   if (score <= 14) return { label: "Cuidado Mínimo", color: "text-green-500" };
   if (score <= 20) return { label: "Cuidado Intermediário", color: "text-yellow-500" };
   if (score <= 26) return { label: "Alta Dependência", color: "text-orange-500" };
   if (score <= 29) return { label: "Semi-Intensivo", color: "text-red-400" };
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
    end.setHours(0,0,0,0);
    
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
    const possibleDays = totalOfficers * daysInMonth;
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
             <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase">Erro de Interface</h1>
             <p className="text-slate-500 mb-4 text-sm">{this.state.error?.toString()}</p>
             <button onClick={() => {localStorage.removeItem('sga_app_cache'); window.location.reload();}} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg hover:bg-slate-800 transition-all">Limpar Cache e Recarregar</button>
          </div>
        </div>
      );
    return this.props.children;
  }
}

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans print:hidden">
    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn border border-slate-200">
      <div className="p-5 border-b flex justify-between items-center bg-slate-50">
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg flex items-center gap-2">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><CloseIcon size={20}/></button>
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
      } catch (e) {
        console.error("Erro clima", e);
      }
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
         {weather.precipitation > 0 && (
            <>
               <span className="w-px h-3 bg-slate-200"></span>
               <span className="flex items-center gap-0.5 text-blue-500" title="Chuva"><CloudRain size={10}/> {weather.precipitation}mm</span>
            </>
         )}
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

  const feriasHomologadas = feriasData.filter(f => {
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
          <div className="text-[10px] font-black uppercase text-slate-700 tracking-widest select-none">
            {obterNomeMes(mesFiltro)}
          </div>
          <button onClick={() => handleMudarMes(1)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-white rounded-xl transition-all active:scale-95"><ChevronRight size={16}/></button>
       </div>
       
       <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <div className="min-w-[800px]">
             <div className="bg-slate-100 flex border-b border-slate-200">
                <div className="w-32 p-3 text-[9px] font-black uppercase text-slate-500 tracking-widest sticky left-0 bg-slate-100 border-r border-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] flex items-center shrink-0">
                   Militar
                </div>
                <div className="w-32 md:w-40 p-3 text-[9px] font-black uppercase text-slate-500 tracking-widest sticky left-32 bg-slate-100 border-r border-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] flex items-center shrink-0">
                   Período
                </div>
                <div className="flex-1 flex">
                   {daysArrayF.map(d => {
                      const dt = new Date(anoStrF, mesStrF, d);
                      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                      return (
                        <div key={d} className={`flex-1 min-w-[20px] flex justify-center items-center py-2 border-r border-slate-200/60 text-[8px] font-bold ${isWeekend ? 'bg-slate-200 text-slate-400' : 'text-slate-600'}`}>
                           {d}
                        </div>
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
                      <div className="w-32 p-3 text-[9px] md:text-[10px] font-black uppercase text-slate-700 tracking-tighter truncate sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] flex items-center transition-colors shrink-0">
                         {militar}
                      </div>
                      <div className="w-32 md:w-40 p-2 md:p-3 text-[8px] md:text-[9px] font-bold text-amber-700 sticky left-32 bg-amber-50 group-hover:bg-amber-100 border-r border-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-center transition-colors shrink-0 relative">
                         <span className="font-mono">{formatDate(start)}</span>
                         <span className="font-mono opacity-60 text-[7px]">até {formatDate(end)}</span>
                         <span className="absolute top-1 right-1 text-[7px] font-black uppercase bg-amber-200 px-1 rounded text-amber-800">{dias}d</span>
                      </div>
                      <div className="flex-1 flex">
                         {daysArrayF.map(d => {
                            const currentDate = new Date(anoStrF, mesStrF, d, 12, 0, 0); 
                            const isVacation = start && end && currentDate >= start && currentDate <= end;
                            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                            
                            let bgClass = "bg-transparent";
                            if (isVacation) bgClass = "bg-amber-400 shadow-inner z-10 border-t border-b border-amber-500";
                            else if (isWeekend) bgClass = "bg-slate-100/50";

                            return (
                               <div key={d} className={`flex-1 min-w-[20px] border-r border-slate-100 ${bgClass}`} title={isVacation ? `Férias: ${militar} (Dia ${d})` : ''}></div>
                            )
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
// --- MÓDULO PASSAGEM DE TURNO (TOTALMENTE BLINDADO) ---
// =========================================================================

const PassagemTurno = ({ currentUser, onBack }) => {
    const [view, setView] = useState('dashboard'); 
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filterDay, setFilterDay] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');

    const [formData, setFormData] = useState({
        selectedSectorId: '', shift: 'Manhã', nurseName: currentUser || '', sgtsNames: '',
        intercurrences: '', patients: '', discharges: '', admissions: '',
        transfers: '', procedures: '', consultations: ''
    });

    const fetchSheetData = async () => {
        if (!API_URL_PASSAGEM || API_URL_PASSAGEM === "") return;
        setLoading(true);
        try {
            const response = await fetch(API_URL_PASSAGEM);
            const data = await response.json();
            if (data && Array.isArray(data)) {
// Dentro de fetchSheetData, melhore a ordenação: [cite: 123]
setReports(data.filter(item => item && typeof item === 'object').sort((a, b) => {
    const parseTS = (obj) => {
        const val = safeGet(obj, ['timestamp', 'carimbo de data/hora', 'data']);
        if (!val) return 0;
        // Tenta converter se for número (timestamp puro) ou string [cite: 139, 142]
        const d = (typeof val === 'number' || /^\d+$/.test(val)) ? new Date(Number(val)) : new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    };
    return parseTS(b) - parseTS(a); // Mais novo primeiro [cite: 123]
}));
        } catch (error) { 
            console.error("Erro ao carregar dados:", error); 
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchSheetData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!API_URL_PASSAGEM) return alert("URL da planilha não configurada.");
        setSubmitting(true);
        
        const sector = SECTORS_PASS.find(s => s.id === formData.selectedSectorId);
        
        // Envia múltiplos nomes de chaves para evitar que a formatação do Google Sheets quebre o sistema
        const payload = { 
            ...formData, 
            sectorId: formData.selectedSectorId,
            setor: formData.selectedSectorId,
            turno: formData.shift,
            enfermeiro: formData.nurseName,
            sargentos: formData.sgtsNames,
            pacientes: formData.patients,
            altas: formData.discharges,
            baixas: formData.admissions,
            transferencias: formData.transfers,
            atendimentos: formData.consultations || formData.procedures,
            procedimentos: formData.consultations || formData.procedures,
            intercorrencias: formData.intercurrences,
            obs: formData.intercurrences,
            data: new Date().toISOString(),
            sectorName: sector?.name || '', 
            sectorType: sector?.type || '', 
            timestamp: Date.now(), 
            authorName: currentUser || 'Desconhecido' 
        };

        try {
            await fetch(API_URL_PASSAGEM, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
            setTimeout(() => { 
                fetchSheetData(); 
                setView('dashboard'); 
                setSubmitting(false);
                setFormData(prev => ({...prev, intercurrences: '', patients: '', discharges: '', admissions: '', transfers: '', procedures: '', consultations: ''}));
            }, 1500);
        } catch (error) { 
            setSubmitting(false);
            alert("Erro ao salvar dados.");
        }
    };

    const filteredAndGrouped = useMemo(() => {
        const filtered = reports.filter(r => {
            const tsRaw = safeGet(r, ['timestamp', 'carimbo de data/hora', 'data']);
            if (!r || !tsRaw) return false;
            
            let d;
            if (typeof tsRaw === 'number' || (typeof tsRaw === 'string' && /^\d+$/.test(tsRaw))) {
                d = new Date(Number(tsRaw));
            } else {
                d = new Date(tsRaw);
            }

            if (isNaN(d.getTime())) return false;
            const dayMatch = !filterDay || d.getDate() === parseInt(filterDay);
            const monthMatch = !filterMonth || (d.getMonth() + 1) === parseInt(filterMonth);
            const yearMatch = !filterYear || d.getFullYear() === parseInt(filterYear);
            return dayMatch && monthMatch && yearMatch;
        });

        const groups = {};
        filtered.forEach(r => {
            const tsRaw = safeGet(r, ['timestamp', 'carimbo de data/hora', 'data']);
            if (!tsRaw) return;
            
            let d;
            if (typeof tsRaw === 'number' || (typeof tsRaw === 'string' && /^\d+$/.test(tsRaw))) {
                d = new Date(Number(tsRaw));
            } else {
                d = new Date(tsRaw);
            }
            
            if (isNaN(d.getTime())) return;
            const ds = d.toLocaleDateString('pt-BR');
            if (!groups[ds]) groups[ds] = [];
            groups[ds].push(r);
        });
        return groups;
    }, [reports, filterDay, filterMonth, filterYear]);

    const availableYears = useMemo(() => {
        const years = [...new Set(reports.map(r => {
           const tsRaw = safeGet(r, ['timestamp', 'carimbo de data/hora', 'data']);
           if (!tsRaw) return null;
           let d;
           if (typeof tsRaw === 'number' || (typeof tsRaw === 'string' && /^\d+$/.test(tsRaw))) {
                d = new Date(Number(tsRaw));
           } else {
                d = new Date(tsRaw);
           }
           return isNaN(d.getTime()) ? null : d.getFullYear();
        }))].filter(y => y !== null);
        return years.sort((a,b) => b-a);
    }, [reports]);

    return (
        <div className="relative w-full h-full min-h-[85vh] bg-slate-50 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200 flex flex-col font-sans">
            <header className="bg-slate-900 text-white p-5 shadow-lg shrink-0 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    {onBack && <button onClick={onBack} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all"><ChevronLeft size={18}/></button>}
                    <div className="bg-emerald-600 p-2 rounded-xl"><Shield size={20} /></div>
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-tight leading-none">HACO Integrado</h1>
                        <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-1">Passagem de Turno</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchSheetData} className={`p-2.5 bg-slate-800 rounded-xl transition-all ${loading ? 'animate-spin opacity-50' : 'active:scale-90'}`}><RefreshCw size={18}/></button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-32">
                {view === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                        {SECTORS_PASS.map(s => {
                            const latest = reports.find(r => {
                                const rId = safeGet(r, ['selectedSectorId', 'sectorid', 'setor', 'unidade', 'local']);
                                return r && String(rId).trim().toUpperCase() === s.id.toUpperCase();
                            });
                            
                            const shiftVal = latest ? safeGet(latest, ['shift', 'turno', 'periodo']) : null;
                            const shift = shiftVal ? SHIFTS_PASS.find(sh => String(sh.id).toLowerCase() === String(shiftVal).toLowerCase()) : null;
                            const IconRender = s.id === 'UPI' ? Bed : s.id === 'UTI' ? Activity : s.id === 'UCC' ? Users : AlertCircle;
                            
                            let timeString = '--:--';
                            if (latest) {
                               const tsRaw = safeGet(latest, ['timestamp', 'carimbo de data/hora', 'data']);
                               if (tsRaw) {
                                   let dTemp;
                                   if (typeof tsRaw === 'number' || (typeof tsRaw === 'string' && /^\d+$/.test(tsRaw))) {
                                        dTemp = new Date(Number(tsRaw));
                                   } else {
                                        dTemp = new Date(tsRaw);
                                   }
                                   if (!isNaN(dTemp.getTime())) timeString = dTemp.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
                               }
                            }

                            return (
                                <div key={s.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-7 transition-all hover:shadow-xl hover:border-emerald-100">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-slate-50 text-slate-700 rounded-2xl"><IconRender size={24}/></div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-2xl tracking-tighter leading-none">{s.id}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{s.name}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => { setFormData({...formData, selectedSectorId: s.id}); setView('form'); }} className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg active:scale-90"><Plus size={22}/></button>
                                    </div>
                                    {latest ? (
                                        <div className="space-y-5">
                                            <div className="flex justify-between items-center">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-xl shadow-sm ${shift?.color || 'bg-slate-100 text-slate-500'}`}>{shiftVal || 'TURNO'}</span>
                                                <span className="text-[10px] text-slate-300 italic font-bold">{timeString}</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {s.type === 'ward' ? (
                                                    ['Pac', 'Alt', 'Baix', 'Trn'].map((l, i) => {
                                                        const keySearch = [['patients', 'pacientes', 'censo'], ['discharges', 'altas'], ['admissions', 'baixas'], ['transfers', 'transferencias']][i];
                                                        return (
                                                            <div key={l} className="bg-slate-50 p-2.5 rounded-2xl text-center border border-slate-100/50">
                                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mb-1">{l}</p>
                                                                <p className="text-sm font-black text-slate-800 leading-none">{safeGet(latest, keySearch) || 0}</p>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    <div className="col-span-4 bg-slate-50 p-4 rounded-2xl flex justify-between items-center px-6 border border-slate-100/50">
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Produção Turno</span>
                                                        <span className="font-black text-emerald-700 text-lg leading-none">{safeGet(latest, ['procedures', 'procedimentos', 'consultations', 'atendimentos']) || 0}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pt-4 border-t border-slate-50">
                                                <p className="text-[10px] text-slate-400 font-bold truncate">Resp: <span className="text-slate-600">{safeGet(latest, ['nurseName', 'enfermeiro', 'authorName', 'responsavel'])}</span></p>
                                            </div>
                                        </div>
                                    ) : <div className="py-12 text-center text-slate-200 font-black text-[10px] uppercase tracking-[0.3em] border-2 border-dashed border-slate-50 rounded-[2rem]">Sem registro hoje</div>}
                                </div>
                            );
                        })}
                    </div>
                )}

                {view === 'form' && (
                    <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-2xl animate-fadeIn border border-slate-100">
                        <div className="flex justify-between items-center mb-10">
                            <button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-200"><RefreshCw size={20} className="rotate-180"/></button>
                            <div className="text-right">
                                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{formData.selectedSectorId}</h2>
                                <p className="text-[10px] text-emerald-500 font-black uppercase">Passagem de Turno</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Qual o Turno?</label>
                                    <div className="flex gap-3 h-14">
                                        {SHIFTS_PASS.map(s => (
                                            <button key={s.id} type="button" onClick={() => setFormData({...formData, shift: s.id})} className={`flex-1 rounded-2xl border-2 font-black text-[11px] uppercase tracking-widest transition-all ${formData.shift === s.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-300'}`}>{s.id}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Enfermeiro de Plantão</label>
                                    <input type="text" required value={formData.nurseName} onChange={e => setFormData({...formData, nurseName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-50" />
                                </div>
                            </div>
                            
                            <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl">
                                <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-8 border-l-4 border-emerald-600 pl-4">Censo e Movimentação</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {['UPI', 'UTI'].includes(formData.selectedSectorId) ? (
                                        ['patients', 'discharges', 'admissions', 'transfers'].map((f, i) => (
                                            <div key={f} className="space-y-2 text-center">
                                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{['Total Pacientes', 'Altas', 'Baixas', 'Transf. Ext'][i]}</label>
                                                <input type="number" required value={formData[f] || ''} onChange={e => setFormData({...formData, [f]: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center font-black text-xl outline-none" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-4 space-y-2">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total de Atendimentos / Procedimentos</label>
                                            <input type="number" required value={formData.procedures || formData.consultations || ''} onChange={e => setFormData({...formData, procedures: e.target.value, consultations: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center font-black text-2xl outline-none" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Nomes dos Sargentos Escalados</label>
                                <input type="text" required value={formData.sgtsNames} onChange={e => setFormData({...formData, sgtsNames: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" placeholder="Sgt Silva, Sgt Santos..." />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Intercorrências</label>
                                <textarea value={formData.intercurrences} onChange={e => setFormData({...formData, intercurrences: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] h-40 outline-none font-bold text-sm shadow-inner" placeholder="Relate as novidades..."></textarea>
                            </div>

                            <button type="submit" disabled={submitting} className={`w-full ${submitting ? 'bg-slate-400 animate-pulse' : 'bg-emerald-700 hover:bg-emerald-800'} text-white font-black py-7 rounded-[2rem] text-xl italic shadow-xl shadow-emerald-900/20`}>
                                {submitting ? 'PROCESSANDO...' : 'ENVIAR PARA PLANILHA'}
                            </button>
                        </form>
                    </div>
                )}

                {view === 'history' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="bg-white p-6 rounded-[2.5rem] grid grid-cols-3 gap-3 shadow-sm border border-slate-200">
                            <select style={selectStyle} value={filterDay} onChange={e => setFilterDay(e.target.value)} className="bg-slate-50 p-4 rounded-2xl text-xs font-black outline-none border border-slate-100"><option value="">Dia</option>{Array.from({length:31}, (_,i)=><option key={i+1}>{i+1}</option>)}</select>
                            <select style={selectStyle} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-slate-50 p-4 rounded-2xl text-xs font-black outline-none border border-slate-100"><option value="">Mês</option>{MONTHS_PASS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
                            <select style={selectStyle} value={filterYear} onChange={e => setFilterYear(e.target.value)} className="bg-slate-50 p-4 rounded-2xl text-xs font-black outline-none border border-slate-100"><option value="">Ano</option>{availableYears.map(y=><option key={y} value={y}>{y}</option>)}</select>
                        </div>
                        
                        {Object.keys(filteredAndGrouped).length === 0 ? (
                            <div className="text-center py-24 text-slate-400 font-black uppercase text-[10px] tracking-[0.4em]">Aguardando dados...</div>
                        ) : Object.keys(filteredAndGrouped).map(date => (
                            <div key={date} className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                    <div className="flex items-center gap-2 bg-white px-4 py-1 rounded-full border border-slate-200">
                                        <Calendar size={14} className="text-emerald-600"/>
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{date}</span>
                                    </div>
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                </div>
                                {filteredAndGrouped[date].map((r, i) => {
                                    const sId = safeGet(r, ['selectedSectorId', 'sectorid', 'setor', 'unidade']);
                                    const shiftId = safeGet(r, ['shift', 'turno', 'periodo']);
                                    const shift = SHIFTS_PASS.find(s => String(s.id).toLowerCase() === String(shiftId).toLowerCase());
                                    const sectorConfig = SECTORS_PASS.find(s => s.id.toUpperCase() === String(sId).trim().toUpperCase()); [cite: 4]
                                    const isWard = sectorConfig?.type === 'ward'; // Agora identifica pelo tipo (ward, er, surgery)
                                    
                                    let timeStr = '--:--';
                                    const tsRaw = safeGet(r, ['timestamp', 'carimbo de data/hora', 'data']);
                                    if (tsRaw) {
                                       let dTemp;
                                       if (typeof tsRaw === 'number' || (typeof tsRaw === 'string' && /^\d+$/.test(tsRaw))) {
                                            dTemp = new Date(Number(tsRaw));
                                       } else {
                                            dTemp = new Date(tsRaw);
                                       }
                                       if (!isNaN(dTemp.getTime())) timeStr = dTemp.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
                                    }

                                    return (
                                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-3">
                                                    <span className="text-[11px] font-black bg-slate-900 text-white px-4 py-1.5 rounded-xl uppercase tracking-tighter">{sId || 'GERAL'}</span>
                                                    <span className={`text-[11px] font-black px-4 py-1.5 rounded-xl ${shift?.color || 'bg-slate-100 text-slate-500'}`}>{shiftId || 'TURNO'}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-300 font-bold">{timeStr}</span>
                                            </div>
                                            
                                            {/* CARD COM MÉTRICAS NO HISTÓRICO */}
                                            <div className="bg-slate-50 p-3 rounded-2xl mb-4 flex gap-4 overflow-x-auto border border-slate-100">
                                                {isWard ? (
                                                    <>
                                                       <div className="text-center flex-1"><p className="text-[8px] font-black text-slate-400 uppercase">Pacientes</p><p className="text-sm font-black text-slate-800">{safeGet(r, ['patients', 'pacientes', 'censo']) || 0}</p></div>
                                                       <div className="text-center flex-1"><p className="text-[8px] font-black text-slate-400 uppercase">Altas</p><p className="text-sm font-black text-slate-800">{safeGet(r, ['discharges', 'altas']) || 0}</p></div>
                                                       <div className="text-center flex-1"><p className="text-[8px] font-black text-slate-400 uppercase">Baixas</p><p className="text-sm font-black text-slate-800">{safeGet(r, ['admissions', 'baixas', 'internacoes']) || 0}</p></div>
                                                       <div className="text-center flex-1"><p className="text-[8px] font-black text-slate-400 uppercase">Transf.</p><p className="text-sm font-black text-slate-800">{safeGet(r, ['transfers', 'transferencias', 'transf']) || 0}</p></div>
                                                    </>
                                                ) : (
                                                    <div className="text-center w-full"><p className="text-[8px] font-black text-slate-400 uppercase">Atendimentos / Procedimentos</p><p className="text-lg font-black text-emerald-600">{safeGet(r, ['procedures', 'procedimentos', 'consultations', 'atendimentos']) || 0}</p></div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <p className="text-[11px] text-slate-500 font-bold uppercase"><span className="text-slate-300 mr-2">ENF:</span> {safeGet(r, ['nurseName', 'enfermeiro', 'responsavel', 'authorName']) || '-'}</p>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase"><span className="text-slate-300 mr-2">SGT:</span> {safeGet(r, ['sgtsNames', 'sargentos', 'equipe']) || '-'}</p>
                                            </div>
                                            {safeGet(r, ['intercurrences', 'intercorrencias', 'obs']) && (
                                                <div className="bg-white p-4 rounded-[1.5rem] italic text-xs font-bold text-slate-700 border border-slate-200">"{safeGet(r, ['intercurrences', 'intercorrencias', 'obs'])}"</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 p-5 flex justify-around items-center rounded-t-[3.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.05)] z-30 shrink-0">
                <button onClick={() => setView('dashboard')} className={`transition-all ${view === 'dashboard' ? 'text-emerald-700 scale-125' : 'text-slate-300'}`}><Activity size={26}/></button>
                <button onClick={() => { setFormData({...formData, selectedSectorId: ''}); setView('form'); }} className="bg-emerald-700 text-white p-4 rounded-[2rem] -mt-16 shadow-2xl shadow-emerald-500/50 border-[6px] border-white active:scale-90"><Plus size={32}/></button>
                <button onClick={() => setView('history')} className={`transition-all ${view === 'history' ? 'text-emerald-700 scale-125' : 'text-slate-300'}`}><History size={26}/></button>
            </nav>
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
                     end.setHours(23, 59, 59);
                     start.setHours(0, 0, 0);
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
        let rawD1 = parseDate(getVal(o, ['plantao 1', 'ultimo 1', 'recente', 'ultimo plantao 1'])); 
        let rawD2 = parseDate(getVal(o, ['plantao 2', 'ultimo 2', 'penultimo', 'ultimo plantao 2'])); 
        let rawD3 = parseDate(getVal(o, ['plantao 3', 'ultimo 3', 'antepenultimo', 'ultimo plantao 3'])); 
        let isGestante = String(getVal(o, ['gestante'])).toLowerCase() === 'sim' || String(getVal(o, ['gestante'])).toLowerCase() === 'true';

        let vazios = 0;
        if (!rawD1) vazios++;
        if (!rawD2) vazios++;
        if (!rawD3) vazios++;

        return {
           nomeCompleto: `${getVal(o, ['patente', 'posto'])} ${getVal(o, ['nome'])}`,
           nomeCurto: getVal(o, ['nome']),
           servico: String(getVal(o, ['servico'])).toUpperCase() || 'UPI',
           antiguidade: parseInt(getVal(o, ['antiguidade'])) || 0, 
           vazios: vazios, 
           d1: rawD1 ? rawD1.getTime() : new Date(2000, 0, 1).getTime(),
           d2: rawD2 ? rawD2.getTime() : new Date(2000, 0, 1).getTime(),
           d3: rawD3 ? rawD3.getTime() : new Date(2000, 0, 1).getTime(),
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
               if (new Date(o.d1).getDate() === d && new Date(o.d1).getMonth() === mes) return false; 
               return true;
            });

            disponiveis.sort((a, b) => {
               if (a.vazios !== b.vazios) return b.vazios - a.vazios; 
               if (a.d1 !== b.d1) return a.d1 - b.d1; 
               if (a.d2 !== b.d2) return a.d2 - b.d2; 
               if (a.d3 !== b.d3) return a.d3 - b.d3; 
               return b.antiguidade - a.antiguidade;  
            });

            if (disponiveis.length > 0) {
               let escalado = disponiveis[0];
               poolOficiais = poolOficiais.map(o => 
                  o.nomeCurto === escalado.nomeCurto 
                    ? { ...o, d3: o.d2, d2: o.d1, d1: dt.getTime(), vazios: Math.max(0, o.vazios - 1) } 
                    : o
               );
               return escalado.nomeCompleto;
            }
            return "SEM ESCALA";
         };

         schedule[d] = {
             upiD: getNext('UPI'),
             upiN: getNext('UPI'),
             utiD: getNext('UTI'),
             utiN: getNext('UTI')
         };
     }

     setTimeout(() => {
        setEscalaGerada(schedule);
        setIsGerando(false);
     }, 600); 
  };

  const renderSlot = (nomeBase) => {
     if (!nomeBase) return "-";
     return <span className={nomeBase === 'SEM ESCALA' ? 'text-red-600 font-black print:text-red-600' : 'text-slate-800 print:text-black'}>{nomeBase}</span>;
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn font-sans print:shadow-none print:border-none print:p-0">
       
       <div className="hidden print:block text-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Escala de Enfermagem - Vermelha</h2>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mt-1">Mês Ref: {mesStr} | Setores: UPI / UTI</p>
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
                <div>
                   <h3 className="font-black text-slate-800 text-lg uppercase tracking-tighter flex items-center gap-2"><CheckCircle className="text-green-500"/> Escala Oficial do Mês</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dados extraídos da aba "EscalaVermelha"</p>
                </div>
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2">
                   <Printer size={14}/> PDF
                </button>
             </div>

             <div className="overflow-x-auto rounded-xl border border-slate-200 print:overflow-visible print:border-none print:w-full">
                <table className="w-full text-left text-xs font-sans min-w-[800px] print:min-w-full print:border-collapse">
                   <thead className="bg-slate-100 text-[9px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-200 print:bg-gray-100 print:text-black">
                      <tr>
                         <th className="p-3 border-r border-slate-200 print:border print:border-gray-300">Data</th>
                         <th className="p-3 border-r border-slate-200 print:border print:border-gray-300">Semana</th>
                         <th className="p-3 border-r border-slate-200 text-blue-800 bg-blue-50 print:bg-transparent print:border print:border-gray-300 print:text-black">UPI Diurno</th>
                         <th className="p-3 border-r border-slate-200 text-blue-900 bg-blue-100 print:bg-transparent print:border print:border-gray-300 print:text-black">UPI Noturno</th>
                         <th className="p-3 border-r border-slate-200 text-indigo-800 bg-indigo-50 print:bg-transparent print:border print:border-gray-300 print:text-black">UTI Diurno</th>
                         <th className="p-3 text-indigo-900 bg-indigo-100 print:bg-transparent print:border print:border-gray-300 print:text-black">UTI Noturno</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 print:divide-gray-300">
                      {(appData.escalasVermelhas || []).length > 0 ? (
                         (appData.escalasVermelhas || []).map((linha, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                               <td className="p-3 font-black text-slate-600 print:border print:border-gray-300 print:text-black">{formatDate(getVal(linha, ['data', 'dia']))}</td>
                               <td className="p-3 font-bold text-slate-400 print:border print:border-gray-300 print:text-black">{getVal(linha, ['semana', 'dia da semana'])}</td>
                               <td className="p-3 font-bold text-[10px] uppercase tracking-tighter border-r border-slate-100 print:border print:border-gray-300">{getVal(linha, ['upi diurno', 'upi d'])}</td>
                               <td className="p-3 font-bold text-[10px] uppercase tracking-tighter border-r border-slate-100 print:border print:border-gray-300">{getVal(linha, ['upi noturno', 'upi n'])}</td>
                               <td className="p-3 font-bold text-[10px] uppercase tracking-tighter border-r border-slate-100 print:border print:border-gray-300">{getVal(linha, ['uti diurno', 'uti d'])}</td>
                               <td className="p-3 font-bold text-[10px] uppercase tracking-tighter print:border print:border-gray-300">{getVal(linha, ['uti noturno', 'uti n'])}</td>
                            </tr>
                         ))
                      ) : (
                         <tr><td colSpan="6" className="p-6 text-center text-slate-400 font-bold uppercase tracking-widest text-[9px]">Nenhuma Escala Publicada no Google Sheets</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
       ) : (
          <div className="animate-fadeIn print:block">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
               <div className="flex gap-2 w-full md:w-auto">
                  <input type="month" value={mesStr} onChange={e => setMesStr(e.target.value)} className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs"/>
                  <button onClick={gerarEscalaAlgoritmo} disabled={isGerando} className="bg-purple-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                     {isGerando ? <Loader2 size={14} className="animate-spin"/> : <RefreshCcw size={14}/>} Gerar Escala
                  </button>
                  <button onClick={() => window.print()} disabled={!escalaGerada || isGerando} className="bg-slate-800 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                     <Printer size={14}/> PDF
                  </button>
               </div>
             </div>

             <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl mb-6 text-xs text-purple-900 font-medium print:hidden">
                <div className="mt-2">
                   <label className="block text-[10px] font-black uppercase tracking-widest mb-1">Feriados deste Mês (Dias separados por vírgula):</label>
                   <input type="text" placeholder="Ex: 3, 14, 21" value={feriados} onChange={e => setFeriados(e.target.value)} className="w-full md:w-1/2 p-2 rounded-lg bg-white border border-purple-200 focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
             </div>

             {escalaGerada && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 print:overflow-visible print:border-none print:w-full">
                   <table className="w-full text-left text-xs font-sans min-w-[800px] print:min-w-full print:border-collapse">
                      <thead className="bg-slate-100 text-[9px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-200 print:bg-gray-100 print:text-black">
                         <tr>
                            <th className="p-3 text-center w-16 border-r border-slate-200 print:border print:border-gray-300">Dia</th>
                            <th className="p-3 text-center w-16 border-r border-slate-200 print:border print:border-gray-300">Semana</th>
                            <th className="p-3 border-r border-slate-200 text-blue-800 bg-blue-50 print:bg-transparent print:border print:border-gray-300 print:text-black">UPI Diurno</th>
                            <th className="p-3 border-r border-slate-200 text-blue-900 bg-blue-100 print:bg-transparent print:border print:border-gray-300 print:text-black">UPI Noturno</th>
                            <th className="p-3 border-r border-slate-200 text-indigo-800 bg-indigo-50 print:bg-transparent print:border print:border-gray-300 print:text-black">UTI Diurno</th>
                            <th className="p-3 text-indigo-900 bg-indigo-100 print:bg-transparent print:border print:border-gray-300 print:text-black">UTI Noturno</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-gray-300">
                         {daysArray.map(d => {
                            const dt = new Date(ano, mes, d);
                            const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                            const isFeriado = feriadosArray.includes(d);
                            const isVermelha = isWeekend || isFeriado;
                            const diaNome = dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
                            
                            const bgRow = isVermelha ? 'bg-red-50/40 hover:bg-red-50 print:bg-gray-50' : 'bg-white hover:bg-slate-50 opacity-40 print:hidden';
                            const assignment = escalaGerada[String(d)];

                            if (!isVermelha) return null;

                            return (
                               <tr key={d} className={`transition-colors ${bgRow}`}>
                                  <td className={`p-3 text-center border-r border-slate-100 print:border print:border-gray-300 font-black ${isVermelha ? 'text-red-500 print:text-black' : 'text-slate-400'}`}>{String(d).padStart(2, '0')}</td>
                                  <td className={`p-3 text-center border-r border-slate-100 print:border print:border-gray-300 font-bold ${isVermelha ? 'text-red-400 print:text-black' : 'text-slate-400'}`}>
                                     {isFeriado ? 'FER' : diaNome}
                                  </td>
                                  <td className={`p-3 border-r border-slate-100 print:border print:border-gray-300 font-bold text-[10px] uppercase tracking-tighter`}>{assignment ? renderSlot(assignment.upiD) : '-'}</td>
                                  <td className={`p-3 border-r border-slate-100 print:border print:border-gray-300 font-bold text-[10px] uppercase tracking-tighter`}>{assignment ? renderSlot(assignment.upiN) : '-'}</td>
                                  <td className={`p-3 border-r border-slate-100 print:border print:border-gray-300 font-bold text-[10px] uppercase tracking-tighter`}>{assignment ? renderSlot(assignment.utiD) : '-'}</td>
                                  <td className={`p-3 font-bold text-[10px] uppercase tracking-tighter print:border print:border-gray-300`}>{assignment ? renderSlot(assignment.utiN) : '-'}</td>
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
// --- TELAS BASE DO SISTEMA DE GESTÃO (LOGIN E PAINEIS) ---
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
       const correctPasswordRaw = getVal(selectedUser, ['senha', 'password', 'pwd']) || '123456';
       const correctPassword = String(correctPasswordRaw).trim();
       const inputPassword = String(password).trim();
       
       if (inputPassword === correctPassword) {
           const nome = getVal(selectedUser, ['nome']);
           let role = getVal(selectedUser, ['role']) || 'user';
           if (nome.includes('Cimirro') || nome.includes('Zanini') || nome.includes('Renata')) {
              role = nome.includes('Renata') ? 'rt' : 'admin'; 
           }
           onLogin(nome, role);
       } else {
           setLoginError('Senha incorreta.');
       }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden print:hidden">
      {isSyncing && <div className="absolute top-6 right-6 flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-900/30 px-4 py-2 rounded-full border border-blue-800/50"><Loader2 size={14} className="animate-spin"/> Conectando ao Banco</div>}
      
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 relative z-10">
        <div className="text-center mb-8">
           <div className="bg-blue-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
              <Plane size={32} className="text-white transform -rotate-12"/>
           </div>
           <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Enfermagem HACO</h1>
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] mt-1">Gestão de Enfermagem</p>
        </div>
        
        {syncError && (
           <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-6 border border-red-100 flex items-center justify-between">
              <span>⚠️ Falha na Leitura</span>
              <button onClick={onForceSync} className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700">Tentar Novamente</button>
           </div>
        )}

        <div className="bg-slate-100 p-1.5 rounded-2xl flex mb-6">
           <button onClick={() => {setRoleGroup('chefia'); setUser(''); setPassword(''); setLoginError('');}} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${roleGroup === 'chefia' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Chefia / RT</button>
           <button onClick={() => {setRoleGroup('tropa'); setUser(''); setPassword(''); setLoginError('');}} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${roleGroup === 'tropa' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}>Oficiais</button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Identificação do Militar</label>
            <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer" value={user} onChange={e => {setUser(e.target.value); setPassword(''); setLoginError('');}}>
               <option value="">{isSyncing && list.length === 0 ? "A ler dados da Planilha..." : "Escolha o seu nome..."}</option>
               {filtered.map((o, idx) => (<option key={idx} value={getVal(o, ['nome'])}>{getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}</option>))}
               {!isSyncing && list.length === 0 && <option value="" disabled>Banco de Dados Vazio.</option>}
            </select>
          </div>

          {user && (
            <div className="relative animate-fadeIn">
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Senha de Acesso</label>
              <input type="password" value={password} onChange={e => {setPassword(e.target.value); setLoginError('');}} placeholder="Digite sua senha" onKeyDown={e => e.key === 'Enter' && handleAuth()} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
              {loginError && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{loginError}</p>}
            </div>
          )}

          <button onClick={handleAuth} disabled={!user || !password || isSyncing} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 ${user && password ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/40' : 'bg-slate-300 cursor-not-allowed'}`}>Entrar no Sistema</button>
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
     if (!referencia) return "TODOS OS REGISTOS";
     const [ano, mes] = referencia.split('-');
     const d = new Date(ano, parseInt(mes) - 1, 1);
     return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const userSafeName = String(user).toLowerCase().trim();

  const atestadosFiltrados = (appData.atestados || []).filter(a => {
     const nomeA = String(getVal(a, ['militar', 'nome', 'oficial'])).toLowerCase();
     if (!nomeA.includes(userSafeName) && !userSafeName.includes(nomeA)) return false;
     if (!mesFiltro) return true;
     const d = parseDate(getVal(a,['inicio', 'data']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(a => ({...a, _tipo: 'Atestado'})).reverse();

  const permutasFiltradas = (appData.permutas || []).filter(p => {
     const nomeSolicitante = String(getVal(p, ['solicitante', 'nome', 'militar'])).toLowerCase();
     const nomeSubstituto = String(getVal(p, ['substituto'])).toLowerCase();
     if (!nomeSolicitante.includes(userSafeName) && !userSafeName.includes(nomeSolicitante) &&
         !nomeSubstituto.includes(userSafeName) && !userSafeName.includes(nomeSubstituto)) return false;
     
     if (!mesFiltro) return true;
     const d = parseDate(getVal(p,['sai', 'datasai']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(p => ({...p, _tipo: 'Permuta'})).reverse();

  const feriasFiltradas = (appData.ferias || []).filter(f => {
     const nomeF = String(getVal(f, ['militar', 'nome', 'oficial'])).toLowerCase();
     if (!nomeF.includes(userSafeName) && !userSafeName.includes(nomeF)) return false;
     if (!mesFiltro) return true;
     const d = parseDate(getVal(f,['inicio', 'data', 'saida']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(f => ({...f, _tipo: 'Férias'})).reverse();

  const licencasFiltradas = (appData.licencas || []).filter(l => {
     const nomeL = String(getVal(l, ['militar', 'nome', 'oficial'])).toLowerCase();
     if (!nomeL.includes(userSafeName) && !userSafeName.includes(nomeL)) return false;
     if (!mesFiltro) return true;
     const d = parseDate(getVal(l,['inicio', 'data']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(l => ({...l, _tipo: 'Licença'})).reverse();

  const handleSend = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload: { ...payload, file: fileData } }) });
      setTimeout(() => { setIsSaving(false); setModals({ atestado: false, permuta: false, ferias: false, licenca: false, gantt: false, password: false }); setFileData(null); syncData(true); }, 1500);
    } catch(e) { setIsSaving(false); alert("Erro ao enviar."); }
  };

  const closeModals = () => { setModals({ atestado: false, permuta: false, ferias: false, licenca: false, gantt: false, password: false }); setFileData(null); }

  const handleChangePassword = (e) => {
     e.preventDefault();
     if(passForm.new !== passForm.confirm) return alert("As senhas não conferem.");
     if(passForm.new.length < 4) return alert("A senha deve ter pelo menos 4 caracteres.");
     const myOfficerData = appData.officers.find(o => getVal(o, ['nome']) === user);
     if(!myOfficerData) return alert("Erro ao localizar perfil.");
     handleSend('saveOfficer', { ...myOfficerData, senha: passForm.new });
  };

  if (activeTab === 'passagem') {
     return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans p-2 md:p-6 pb-0">
           <PassagemTurno currentUser={user} onBack={() => setActiveTab('dashboard')} />
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md text-xl">HA</div>
          <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-tighter">Ten {user}</h1><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Painel Individual</p></div>
        </div>
        <div className="flex items-center gap-2">
           <WeatherWidgetMini />
           {isAdmin && (
              <button onClick={onToggleAdmin} className="bg-blue-50 p-2.5 rounded-xl text-blue-600 font-black flex items-center gap-2 text-[9px] uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-90 border border-blue-200">
                 <Shield size={14}/> Gestão
              </button>
           )}
           <button onClick={() => setModals({...modals, password: true})} className="bg-slate-100 p-2.5 rounded-xl text-slate-500 hover:text-blue-500 transition-all active:scale-90"><Key size={16}/></button>
           <button onClick={onLogout} className="bg-slate-100 p-2.5 rounded-xl text-slate-500 hover:text-red-500 transition-all active:scale-90"><LogOut size={16}/></button>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-5">
        <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden"><h2 className="text-xl font-black uppercase tracking-tighter relative z-10">Mural</h2><Plane className="absolute -bottom-4 -right-4 text-white/10" size={100}/></div>
        
        <button onClick={() => setActiveTab('passagem')} className="w-full bg-emerald-600 text-white p-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/30 flex items-center justify-between active:scale-95 transition-all group border border-emerald-500 hover:bg-emerald-500">
           <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                 <Bed size={24} className="text-white"/>
              </div>
              <div className="text-left">
                 <span className="block text-lg tracking-tighter leading-none mb-1">Passagem de Turno</span>
                 <span className="block text-[9px] text-emerald-100 opacity-90">Registrar Censo e Intercorrências</span>
              </div>
           </div>
           <ChevronRight size={24} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
        </button>

        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => setModals({...modals, atestado: true})} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all"><ShieldAlert size={18}/></div><span className="font-black text-[8px] uppercase text-slate-700 tracking-widest text-center">Atestado</span></button>
          <button onClick={() => setModals({...modals, permuta: true})} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><ArrowRightLeft size={18}/></div><span className="font-black text-[8px] uppercase text-slate-700 tracking-widest text-center">Permuta</span></button>
          <button onClick={() => setModals({...modals, ferias: true})} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all"><Sun size={18}/></div><span className="font-black text-[8px] uppercase text-slate-700 tracking-widest text-center">Férias</span></button>
          <button onClick={() => setModals({...modals, licenca: true})} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-pink-50 text-pink-500 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-all"><Baby size={18}/></div><span className="font-black text-[8px] uppercase text-slate-700 tracking-widest text-center">Licença</span></button>
        </div>

        <button onClick={() => setModals({...modals, gantt: true})} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
           <CalendarDays size={16}/> Visualizar Escala de Férias Geral
        </button>

        <div className="pt-4">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
             <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                Meus Registros 
                <button onClick={()=>syncData(true)} className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-90"><RefreshCw size={12} className={isSyncing?'animate-spin text-blue-600':''}/></button>
             </h3>
             <div className="flex items-center gap-2">
                 <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                    <button onClick={() => handleMudarMes(-1)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronLeft size={14}/></button>
                    <div className="w-28 text-center text-[8px] font-black uppercase text-slate-700 tracking-widest select-none">{obterNomeMes(mesFiltro)}</div>
                    <button onClick={() => handleMudarMes(1)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronRight size={14}/></button>
                 </div>
                 {mesFiltro && (<button onClick={() => setMesFiltro('')} className="text-[8px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors shrink-0">Ver Todos</button>)}
             </div>
           </div>

          <div className="space-y-2">
            {[...permutasFiltradas, ...atestadosFiltrados, ...feriasFiltradas, ...licencasFiltradas].sort((a,b) => {
                const dateA = parseDate(getVal(a,['inicio', 'data', 'sai', 'datasai']))?.getTime() || 0;
                const dateB = parseDate(getVal(b,['inicio', 'data', 'sai', 'datasai']))?.getTime() || 0;
                return dateB - dateA;
            }).map((item, i) => {
              const anexoUrl = getVal(item, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
              let titulo = ""; let icon = null;
              if (item._tipo === 'Atestado') { titulo = `Afastamento: ${getVal(item,['dias'])}d`; icon = <ShieldAlert size={12} className="text-red-500 inline mr-1"/>; }
              if (item._tipo === 'Permuta') { 
                  const eSub = String(getVal(item,['substituto'])).toLowerCase().includes(userSafeName);
                  titulo = eSub ? `Cobriu: ${getVal(item,['solicitante'])}` : `Pediu Troca: ${getVal(item,['substituto'])}`; 
                  icon = <ArrowRightLeft size={12} className={eSub ? "text-green-500 inline mr-1" : "text-indigo-500 inline mr-1"}/>; 
              }
              if (item._tipo === 'Férias') { titulo = `Férias: ${getVal(item,['dias', 'quantidade'])}d`; icon = <Sun size={12} className="text-amber-500 inline mr-1"/>; }
              if (item._tipo === 'Licença') { titulo = `Licença: ${getVal(item,['dias', 'quantidade'])}d`; icon = <Baby size={12} className="text-pink-500 inline mr-1"/>; }

              const statusAtual = getVal(item,['status']) || 'Homologado'; 
              const isRejected = statusAtual.toLowerCase().includes('rejeitado');

              return (
              <div key={i} className={`bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center ${isRejected ? 'border-red-200' : 'border-slate-100'}`}>
                <div className="text-xs">
                  <p className="font-black text-slate-800 uppercase text-[10px] mb-1 flex items-center">{icon} {titulo}</p>
                  <div className="flex gap-2 font-bold text-slate-400 text-[8px] uppercase tracking-widest items-center">
                    <span className="bg-slate-50 px-2 py-1 rounded">{formatDate(getVal(item,['inicio', 'data', 'sai', 'datasai']))}</span>
                    {getVal(item,['substituto']) && <span className="bg-slate-50 px-2 py-1 rounded flex items-center gap-1"><ArrowRightLeft size={8}/>{formatDate(getVal(item,['entra', 'dataentra']))}</span>}
                    {anexoUrl && <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 hover:text-blue-700"><Paperclip size={10}/> Anexo</a>}
                  </div>
                </div>
                <span className={`text-[8px] px-2 py-1 rounded-md font-black uppercase tracking-widest text-right max-w-[100px] leading-tight ${isRejected ? 'bg-red-50 text-red-600' : statusAtual==='Pendente' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-700'}`}>{statusAtual}</span>
              </div>
            )})}
            {(permutasFiltradas.length === 0 && atestadosFiltrados.length === 0 && feriasFiltradas.length === 0 && licencasFiltradas.length === 0) && <p className="text-center text-[10px] text-slate-400 font-bold py-6 uppercase border border-dashed rounded-2xl">Sem registos no período</p>}
          </div>
        </div>
      </main>

      {/* MODAIS USER */}
      {modals.gantt && <Modal title={<><CalendarDays size={18}/> Escala Geral de Férias</>} onClose={closeModals}><GanttViewer feriasData={appData.ferias} /></Modal>}
      {modals.password && <Modal title="Trocar Senha de Acesso" onClose={closeModals}><form onSubmit={handleChangePassword} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nova Senha</label><input type="password" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 focus:ring-2 outline-none" onChange={e=>setPassForm({...passForm,new:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirmar Nova Senha</label><input type="password" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 focus:ring-2 outline-none" onChange={e=>setPassForm({...passForm,confirm:e.target.value})}/></div><div className="bg-blue-50 p-3 rounded-xl flex items-start gap-2"><Lock size={14} className="text-blue-500 mt-0.5 shrink-0"/><p className="text-[9px] font-bold text-blue-800">Ao guardar, a sua nova senha substituirá a senha padrão. Mantenha-a em segurança.</p></div><button disabled={isSaving} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Atualizar...":"Salvar Nova Senha"}</button></form></Modal>}
      {modals.atestado && <Modal title="Anexar Atestado" onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveAtestado',{id:Date.now().toString(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Total de Dias</label><input type="number" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,dias:e.target.value})}/></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-red-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Protocolar Pedido"}</button></form></Modal>}
      {modals.permuta && <Modal title="Pedir Permuta" onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('savePermuta',{id:Date.now().toString(),status:'Pendente',solicitante:user,substituto:form.sub,datasai:form.sai,dataentra:form.entra});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data de Saída</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,sai:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Militar Substituto</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,sub:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data de Substituição</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,entra:e.target.value})}/></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Solicitar Troca"}</button></form></Modal>}
      {modals.ferias && <Modal title={<><Sun size={18}/> Solicitar Férias</>} onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveFerias',{id:Date.now().toString(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Quantidade de Dias (Parcelamento)</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 cursor-pointer" onChange={e=>setForm({...form,dias:e.target.value})}><option value="">Selecione o parcelamento...</option><option value="10">10 dias (Para parcelamento 10/10/10 ou 20/10)</option><option value="15">15 dias (Para parcelamento 15/15)</option><option value="20">20 dias (Para parcelamento 20/10)</option><option value="30">30 dias (Mês Integral)</option></select></div><div className="bg-amber-50 p-3 rounded-xl flex items-start gap-2 border border-amber-100"><AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0"/><p className="text-[9px] font-bold text-amber-800">O pedido ficará <span className="font-black uppercase">Pendente</span> até homologação da Chefia. Recomenda-se olhar o Gantt Geral antes de solicitar.</p></div><button disabled={isSaving} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Protocolar Férias"}</button></form></Modal>}
      {modals.licenca && <Modal title={<><Baby size={18}/> Solicitar Licença-Maternidade</>} onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveLicenca',{id:Date.now().toString(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Duração da Licença</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 cursor-pointer" onChange={e=>setForm({...form,dias:e.target.value})}><option value="">Selecione...</option><option value="120">120 dias</option><option value="180">180 dias</option></select></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Protocolar Licença"}</button></form></Modal>}
    </div>
  );
};

const MainSystem = ({ user, role, onLogout, appData, syncData, isSyncing, onToggleAdmin, isCimirro }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [homologandoId, setHomologandoId] = useState(null); 
  
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [showAtestadoModal, setShowAtestadoModal] = useState(false);
  const [showPermutaModal, setShowPermutaModal] = useState(false);
  const [showFeriasModal, setShowFeriasModal] = useState(false);
  const [showLicencaModal, setShowLicencaModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  
  const [historyOfficer, setHistoryOfficer] = useState(null);

  const [formOfficer, setFormOfficer] = useState({ expediente: [], servico: '', gestante: '' });
  const [formAtestado, setFormAtestado] = useState({});
  const [formPermuta, setFormPermuta] = useState({});
  const [formFerias, setFormFerias] = useState({});
  const [formLicenca, setFormLicenca] = useState({});
  const [passForm, setPassForm] = useState({ new: '', confirm: '' });
  const [fileData, setFileData] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: 'antiguidade', direction: 'asc' });

  const isApenasRT = role === 'rt'; 

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
     if (!referencia) return "TODOS OS REGISTOS";
     const [ano, mes] = referencia.split('-');
     const dataFicticia = new Date(ano, parseInt(mes) - 1, 1);
     return dataFicticia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const licencasAtivas = getActiveAfastamentos(appData.licencas);
  const atestadosAtivos = getActiveAfastamentos(appData.atestados);
  const absenteismoDados = calculateAbsenteismoStats(appData.atestados, (appData.officers||[]).length);
  const taxaMensalAbs = absenteismoDados.months[new Date().getMonth()].rate;
  const nomeMesAtual = absenteismoDados.months[new Date().getMonth()].monthName;

  const sendData = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload }) });
      setTimeout(() => { 
          setIsSaving(false); 
          setShowOfficerModal(false); setShowAtestadoModal(false); setShowPermutaModal(false); setShowFeriasModal(false); setShowLicencaModal(false); setShowPassModal(false);
          setFileData(null); syncData(true); 
      }, 1500); 
    } catch (e) { setIsSaving(false); alert("Falha na gravação."); }
  };

  const handleHomologar = async (id, sheetName, novoStatus = 'Homologado') => {
    if (isApenasRT) return;
    if (!id) { alert("ERRO DE PLANILHA: Registo sem 'id'."); return; }
    setHomologandoId(id);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'updateStatus', payload: { sheet: sheetName, id: id, status: novoStatus } }) });
      setTimeout(() => { setHomologandoId(null); syncData(true); }, 2000);
    } catch(e) { setHomologandoId(null); alert("Erro de conexão ao atualizar."); }
  };

  const handleToggleExpediente = (local) => {
    const current = Array.isArray(formOfficer.expediente) ? formOfficer.expediente : [];
    if (current.includes(local)) setFormOfficer({...formOfficer, expediente: current.filter(l => l !== local)});
    else setFormOfficer({...formOfficer, expediente: [...current, local]});
  };

  const handleSaveOfficer = (e) => {
    e.preventDefault();
    if(isApenasRT) return;
    sendData('saveOfficer', { ...formOfficer, id: formOfficer.id || Date.now(), expediente: Array.isArray(formOfficer.expediente) ? formOfficer.expediente.join(', ') : '', servico: formOfficer.servico || '' });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if(passForm.new !== passForm.confirm) return alert("As senhas não conferem.");
    if(passForm.new.length < 4) return alert("A senha deve ter pelo menos 4 caracteres.");
    const myOfficerData = appData.officers.find(o => getVal(o, ['nome']) === user);
    if(!myOfficerData) return alert("Erro ao localizar perfil.");
    sendData('saveOfficer', { ...myOfficerData, senha: passForm.new });
 };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ label, sortKey, align = 'left' }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th className={`p-3 md:p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`} onClick={() => handleSort(sortKey)}>
        <div className={`inline-flex items-center gap-1 ${isActive ? 'text-blue-600 font-black' : 'text-slate-400'}`}>
          {label} {isActive ? (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ChevronsUpDown size={12} className="opacity-40"/>}
        </div>
      </th>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        const bradenInfo = getBradenClass(appData.upi.mediaBraden);
        const fugulinInfo = getFugulinClass(appData.upi.mediaFugulin);
        const contagemFUNSA = (appData.officers||[]).filter(o => String(getVal(o,['expediente'])).toUpperCase().includes('FUNSA')).length;
        const contagemEfetivoBase = (appData.officers||[]).length;
        const contagemAssistencial = contagemEfetivoBase - contagemFUNSA;
        const pendentesCount = (appData.atestados||[]).filter(x=>getVal(x,['status'])==='Pendente').length + (appData.permutas||[]).filter(x=>getVal(x,['status'])==='Pendente').length + (appData.ferias||[]).filter(x=>getVal(x,['status'])==='Pendente').length + (appData.licencas||[]).filter(x=>getVal(x,['status'])==='Pendente').length;

        return (
          <div className="space-y-6 animate-fadeIn font-sans">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="col-span-2 md:col-span-4 bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center border border-slate-800 relative overflow-hidden gap-6">
                   <div className="absolute -top-10 -right-10 opacity-5"><Activity size={180}/></div>
                   <div className="flex items-center gap-5 relative z-10">
                      <div className="bg-blue-600 p-4 rounded-2xl shadow-lg"><Activity size={28}/></div>
                      <div>
                         <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Status UPI</h3>
                      </div>
                   </div>
                   <div className="flex gap-6 md:gap-8 text-center relative z-10 font-black w-full md:w-auto justify-between md:justify-end flex-wrap">
                      <div><p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1 justify-center"><Bed size={10}/> Ocupação</p><p className="text-3xl md:text-4xl">{appData.upi.leitosOcupados} <span className="text-base text-slate-700 font-bold">/ 15</span></p></div>
                      <div><p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Acamados</p><p className="text-3xl md:text-4xl text-blue-400">{appData.upi.acamados || 0}</p></div>
                      <div className="w-px bg-slate-800 hidden md:block"></div>
                      <div>
                         <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Braden</p>
                         <p className="text-3xl md:text-4xl text-yellow-500 mb-1">{appData.upi.mediaBraden.toFixed(1)}</p>
                         <p className={`text-[8px] uppercase tracking-widest font-black ${bradenInfo.color} bg-slate-800/50 px-2 py-0.5 rounded`}>{bradenInfo.label}</p>
                      </div>
                      <div>
                         <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Fugulin</p>
                         <p className="text-3xl md:text-4xl text-green-500 mb-1">{appData.upi.mediaFugulin.toFixed(1)}</p>
                         <p className={`text-[8px] uppercase tracking-widest font-black ${fugulinInfo.color} bg-slate-800/50 px-2 py-0.5 rounded`}>{fugulinInfo.label}</p>
                      </div>
                   </div>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4 md:gap-6">
                   <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-sm relative">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Efetivo Total</p>
                     <h3 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">{contagemEfetivoBase}</h3>
                     <div className="flex gap-2 text-[8px] font-black uppercase tracking-widest w-full px-2">
                        <span className="bg-blue-50 text-blue-600 py-1 flex-1 text-center rounded">{contagemAssistencial} Assis.</span>
                        <span className="bg-indigo-50 text-indigo-600 py-1 flex-1 text-center rounded">{contagemFUNSA} Funsa</span>
                     </div>
                   </div>
                   <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Pendentes</p>
                     <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{pendentesCount}</h3>
                   </div>
                   
                   <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex flex-col items-center justify-center shadow-sm relative">
                     <p className="text-[9px] font-black uppercase text-red-400 tracking-widest mb-2 flex items-center gap-1"><CalendarClock size={10}/> Em Vigor</p>
                     <div className="flex gap-4 w-full justify-center">
                        <div className="text-center">
                           <h3 className="text-2xl md:text-3xl font-black text-red-600 tracking-tighter leading-none">{atestadosAtivos.length}</h3>
                           <span className="text-[7px] uppercase font-black text-red-400 tracking-widest">Atestados</span>
                        </div>
                        <div className="w-px bg-red-200"></div>
                        <div className="text-center">
                           <h3 className="text-2xl md:text-3xl font-black text-pink-500 tracking-tighter leading-none">{licencasAtivas.length}</h3>
                           <span className="text-[7px] uppercase font-black text-pink-400 tracking-widest">Licenças</span>
                        </div>
                     </div>
                   </div>

                   <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-sm hover:border-blue-200 cursor-pointer transition-all" onClick={() => setActiveTab('absenteismo')}>
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1"><PieChart size={10}/> Absenteísmo ({nomeMesAtual})</p>
                     <h3 className="text-3xl font-black text-blue-600 tracking-tighter">{taxaMensalAbs}%</h3>
                   </div>
                </div>

                <div className="col-span-2 shadow-sm border border-slate-200 rounded-3xl bg-white overflow-hidden flex flex-col h-full min-h-[200px]">
                   <BirthdayWidget staff={appData.officers}/>
                </div>
            </div>
          </div>
        );
      case 'absenteismo':
         return (
           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn font-sans">
              <div className="flex justify-between items-center mb-8 border-b pb-6">
                <div>
                   <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter flex items-center gap-2"><TrendingDown className="text-red-500"/> Painel de Absenteísmo</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cálculo de dias perdidos por Atestados Médicos ({absenteismoDados.currentYear})</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taxa Anual Acumulada</p>
                   <h2 className="text-4xl font-black text-red-600 tracking-tighter">{absenteismoDados.annualRate}%</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {absenteismoDados.months.map((m, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border transition-all ${m.rate > 5 ? 'bg-red-50 border-red-100' : m.rate > 0 ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-50'}`}>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{m.monthName}</p>
                       <div className="flex justify-between items-end">
                          <div><p className="text-2xl font-black tracking-tighter text-slate-800">{m.rate}%</p></div>
                          <p className="text-[9px] font-bold uppercase text-slate-400">{m.lostDays} dias</p>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="mt-8 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-500 font-bold flex gap-3"><AlertCircle size={16} className="text-blue-500 shrink-0"/><p>A taxa de absenteísmo exclui atestados rejeitados e considera apenas dias homologados cruzados contra a força de trabalho teórica.</p></div>
           </div>
         );
      case 'efetivo':
         const sortedOfficers = [...(appData.officers||[])].sort((a,b) => {
            const { key, direction } = sortConfig;
            let valA, valB;
            if (key === 'antiguidade') {
                valA = parseInt(getVal(a, ['antiguidade'])) || 9999; valB = parseInt(getVal(b, ['antiguidade'])) || 9999;
                return direction === 'asc' ? valA - valB : valB - valA;
            } else if (key === 'nome') { valA = String(getVal(a, ['nome'])).toLowerCase(); valB = String(getVal(b, ['nome'])).toLowerCase();
            } else if (key === 'expediente') { valA = String(getVal(a, ['expediente'])).toLowerCase(); valB = String(getVal(b, ['expediente'])).toLowerCase();
            } else if (key === 'idade') { valA = parseDate(getVal(a, ['nasc']))?.getTime() || 9999999999999; valB = parseDate(getVal(b, ['nasc']))?.getTime() || 9999999999999;
            } else if (key === 'ingresso') { valA = parseDate(getVal(a, ['ingres']))?.getTime() || 9999999999999; valB = parseDate(getVal(b, ['ingres']))?.getTime() || 9999999999999; }
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
         });

         return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter">Quadro de Oficiais</h3>
                {!isApenasRT && <button onClick={() => { setFormOfficer({ expediente: [], servico: '', gestante: '' }); setShowOfficerModal(true); }} className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md transition-all"><UserPlus size={16}/> Incluir Oficial</button>}
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm font-sans min-w-[800px]"><thead className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr><SortableHeader label="Ant." sortKey="antiguidade" align="center" /><SortableHeader label="Posto/Nome" sortKey="nome" /><SortableHeader label="Alocação" sortKey="expediente" /><SortableHeader label="Idade" sortKey="idade" align="center" /><SortableHeader label="Praça/Serviço" sortKey="ingresso" align="center" />{!isApenasRT && <th className="p-3 md:p-4 text-right">Ação</th>}</tr>
                  </thead><tbody className="divide-y divide-slate-50">
                    {sortedOfficers.map((o, i) => {
                      const tIdade = calculateDetailedTime(getVal(o, ['nasc']));
                      const tServico = calculateDetailedTime(getVal(o, ['ingres']));
                      const expedientes = String(getVal(o, ['expediente']) || "").split(',').map(x => x.trim()).filter(x => x !== "");
                      const isRT = String(getVal(o, ['role'])).toLowerCase() === 'rt'; 
                      const isGestante = String(getVal(o, ['gestante'])).toLowerCase() === 'sim' || String(getVal(o, ['gestante'])).toLowerCase() === 'true';

                      return (
                      <tr key={i} className="hover:bg-slate-50/80 group transition-colors">
                        <td className="p-3 md:p-4 text-center text-slate-300 font-black text-base">{getVal(o, ['antiguidade'])}</td>
                        <td className="p-3 md:p-4"><div className="flex flex-col items-start gap-1"><div className="flex items-center gap-2"><span onClick={() => setHistoryOfficer(o)} className="font-black text-blue-600 hover:text-blue-800 uppercase tracking-tighter text-xs md:text-sm cursor-pointer hover:underline transition-all" title="Ver Dossiê">{getVal(o,['patente','posto'])} {getVal(o, ['nome'])}</span>{isRT && <span className="bg-amber-400 text-slate-900 text-[6px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded shadow-sm">RT Enfermagem</span>}{isGestante && <span className="bg-pink-400 text-white text-[6px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5"><Baby size={8}/> Gestante</span>}</div><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(getVal(o,['nasc']))}</span></div></td>
                        <td className="p-3 md:p-4"><div className="flex flex-col gap-1"><div className="flex flex-wrap gap-1">{expedientes.map((ex, idx) => (<span key={idx} className="bg-blue-50 text-blue-600 text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-blue-100">{ex}</span>))}</div><span className={`text-[8px] font-black uppercase inline-block ${getVal(o,['servico']) === 'UTI' ? 'text-purple-600' : 'text-blue-600'}`}>SV: {getVal(o,['servico']) || '-'}</span></div></td>
                        <td className={`p-3 md:p-4 text-center text-[10px] font-bold ${tIdade.y >= 45 ? 'text-red-600 bg-red-50 rounded-lg' : 'text-slate-600'}`}>{tIdade.display}</td>
                        <td className={`p-3 md:p-4 text-center text-[10px] font-bold ${tServico.y >= 7 ? 'text-red-600 bg-red-50 rounded-lg' : 'text-slate-600'}`}><div className="flex flex-col items-center"><span className="text-[8px] text-slate-400 font-mono">{formatDate(getVal(o,['ingres']))}</span><span>{tServico.display}</span></div></td>
                        {!isApenasRT && <td className="p-3 md:p-4 text-right"><div className="flex gap-2 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { const expArr = String(getVal(o, ['expediente']) || "").split(',').map(x => x.trim()).filter(x => x !== ""); setFormOfficer({ ...o, nome: getVal(o,['nome']), patente: getVal(o,['patente','posto']), antiguidade: getVal(o,['antiguidade']), nascimento: formatDateForInput(getVal(o,['nasc'])), ingresso: formatDateForInput(getVal(o,['ingres'])), role: getVal(o,['role']), expediente: expArr, servico: getVal(o,['servico']), gestante: isGestante ? 'Sim' : '' }); setShowOfficerModal(true); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14}/></button><button onClick={() => { if(window.confirm(`Remover ${getVal(o,['nome'])}?`)) sendData('deleteOfficer', { nome: getVal(o,['nome']) }); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/></button></div></td>}
                      </tr>
                    )})}
                    {sortedOfficers.length === 0 && <tr><td colSpan={isApenasRT ? 5 : 6} className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum oficial</td></tr>}
                  </tbody>
                </table></div>
            </div>
         );
      case 'atestados':
         const atestadosListFiltrados = (appData.atestados||[]).filter(a => {
            if (!mesFiltro) return true;
            const d = parseDate(getVal(a,['inicio', 'data']));
            return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
         });

         return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter">Atestados Médicos</h3>
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button onClick={() => handleMudarMes(-1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronLeft size={16}/></button>
                      <div className="w-36 text-center text-[10px] font-black uppercase text-slate-700 tracking-widest select-none">{obterNomeMes(mesFiltro)}</div>
                      <button onClick={() => handleMudarMes(1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronRight size={16}/></button>
                    </div>
                    {mesFiltro && <button onClick={() => setMesFiltro('')} className="text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors shrink-0">Ver Todos</button>}
                    {!isApenasRT && <button onClick={() => setShowAtestadoModal(true)} className="bg-red-600 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md transition-all ml-auto md:ml-2"><Plus size={16}/> Lançar</button>}
                 </div>
               </div>
               <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Militar</th><th className="p-4 text-center">Dias</th><th className="p-4">Início</th><th className="p-4 text-center">Anexo</th><th className="p-4">Status</th>{!isApenasRT && <th className="p-4 text-right">Ações</th>}</tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {atestadosListFiltrados.map((a, i) => {
                      const anexoUrl = getVal(a, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                      const idRegisto = getVal(a, ['id', 'identificador']);
                      const isVigor = atestadosAtivos.includes(a);
                      const isPendente = getVal(a,['status']) === 'Pendente';
                      const isRejeitado = String(getVal(a,['status'])).includes('Rejeitado');
                      return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-800 text-xs md:text-sm font-black tracking-tighter uppercase flex items-center gap-2">{getVal(a,['militar'])} {isVigor && <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest">Em Vigor</span>}</td>
                        <td className="p-4 text-center text-slate-500 font-bold text-xs">{getVal(a,['dias'])}d</td>
                        <td className="p-4 text-[10px] font-mono font-bold text-slate-400">{formatDate(getVal(a,['inicio', 'data']))}</td>
                        <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors" title="Ver Anexo"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-right leading-tight block w-max ${isRejeitado ? 'bg-red-100 text-red-700' : isPendente ? 'bg-amber-100 text-amber-700' : 'bg-green-50 text-green-700'}`}>{getVal(a,['status'])}</span></td>
                        {!isApenasRT && <td className="p-4 text-right">
                           {isPendente && (
                              <div className="flex justify-end gap-2">
                                 <button onClick={()=>handleHomologar(idRegisto, 'Atestados', 'Homologado')} disabled={homologandoId === idRegisto} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">{homologandoId === idRegisto ? <Loader2 size={12} className="animate-spin inline"/> : 'Aprovar'}</button>
                                 <button onClick={()=>{const m = window.prompt("Motivo:"); if(m) handleHomologar(idRegisto, 'Atestados', `Rejeitado: ${m}`);}} disabled={homologandoId === idRegisto} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">Rejeitar</button>
                              </div>
                           )}
                        </td>}
                      </tr>
                    )})}
                    {atestadosListFiltrados.length === 0 && <tr><td colSpan={isApenasRT ? 5 : 6} className="p-8 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">Sem registos</td></tr>}
                  </tbody>
                </table></div>
            </div>
         );
      case 'permutas':
         const permutasListFiltradas = (appData.permutas||[]).filter(p => {
            if (!mesFiltro) return true;
            const d = parseDate(getVal(p,['sai', 'datasai']));
            return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
         });

         return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter">Permutas</h3>
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button onClick={() => handleMudarMes(-1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronLeft size={16}/></button>
                      <div className="w-36 text-center text-[10px] font-black uppercase text-slate-700 tracking-widest select-none">{obterNomeMes(mesFiltro)}</div>
                      <button onClick={() => handleMudarMes(1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronRight size={16}/></button>
                    </div>
                    {mesFiltro && <button onClick={() => setMesFiltro('')} className="text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors shrink-0">Ver Todos</button>}
                    {!isApenasRT && <button onClick={() => setShowPermutaModal(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md transition-all ml-auto md:ml-2"><Plus size={16}/> Lançar</button>}
                 </div>
               </div>
               <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Solicitante</th><th className="p-4">Substituto</th><th className="p-4">Período (S/E)</th><th className="p-4 text-center">Anexo</th><th className="p-4">Status</th>{!isApenasRT && <th className="p-4 text-right">Ações</th>}</tr></thead>
                 <tbody className="divide-y divide-slate-50">
                   {permutasListFiltradas.map((p, idx) => {
                     const anexoUrl = getVal(p, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                     const idRegisto = getVal(p, ['id', 'identificador']);
                     const isPendente = getVal(p,['status']) === 'Pendente';
                     const isRejeitado = String(getVal(p,['status'])).includes('Rejeitado');
                     return (
                     <tr key={idx} className="hover:bg-slate-50 transition-colors">
                       <td className="p-4 text-slate-800 text-xs font-black uppercase tracking-tighter">{getVal(p, ['solicitante'])}</td>
                       <td className="p-4 text-slate-600 text-xs font-bold uppercase tracking-tighter">{getVal(p, ['substituto'])}</td>
                       <td className="p-4"><div className="flex gap-4 font-mono font-bold text-[9px]"><span className="text-red-500">S: {formatDate(getVal(p,['sai','datasai']))}</span><span className="text-green-600">E: {formatDate(getVal(p,['entra','dataentra']))}</span></div></td>
                       <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                       <td className="p-4"><span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-right leading-tight block w-max ${isRejeitado ? 'bg-red-100 text-red-700' : isPendente ? 'bg-amber-100 text-amber-700' : 'bg-green-50 text-green-700'}`}>{getVal(p, ['status'])}</span></td>
                       {!isApenasRT && <td className="p-4 text-right">
                           {isPendente && (
                              <div className="flex justify-end gap-2">
                                 <button onClick={()=>handleHomologar(idRegisto, 'Permutas', 'Homologado')} disabled={homologandoId === idRegisto} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">{homologandoId === idRegisto ? <Loader2 size={12} className="animate-spin inline"/> : 'Aprovar'}</button>
                                 <button onClick={()=>{const m = window.prompt("Motivo:"); if(m) handleHomologar(idRegisto, 'Permutas', `Rejeitado: ${m}`);}} disabled={homologandoId === idRegisto} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">Rejeitar</button>
                              </div>
                           )}
                       </td>}
                     </tr>
                   )})}
                   {permutasListFiltradas.length === 0 && <tr><td colSpan={isApenasRT ? 5 : 6} className="p-8 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">Nenhuma permuta</td></tr>}
                 </tbody>
               </table></div>
            </div>
         );
      case 'ferias':
         const feriasPendentes = (appData.ferias || []).filter(f => getVal(f, ['status']) === 'Pendente');
         return (
            <div className="space-y-6">
               {!isApenasRT && feriasPendentes.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-amber-200 p-6 md:p-8 animate-fadeIn relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                     <h3 className="font-black text-amber-600 text-lg uppercase tracking-tighter mb-4 flex items-center gap-2"><Sun size={20}/> Aprovação de Férias</h3>
                     <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Militar</th><th className="p-4 text-center">Dias (Parcela)</th><th className="p-4">Início</th><th className="p-4 text-right">Ações</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {feriasPendentes.map((f, i) => {
                             const idRegisto = getVal(f, ['id', 'identificador']);
                             return (
                             <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                               <td className="p-4 text-slate-800 text-xs font-black uppercase tracking-tighter">{getVal(f, ['militar'])}</td>
                               <td className="p-4 text-center text-slate-600 font-bold text-xs">{getVal(f, ['dias', 'quantidade'])}d</td>
                               <td className="p-4 font-mono font-bold text-slate-500 text-[10px]">{formatDate(getVal(f,['inicio', 'data']))}</td>
                               <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={()=>handleHomologar(idRegisto, 'Ferias', 'Homologado')} disabled={homologandoId === idRegisto} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50">{homologandoId === idRegisto ? <Loader2 size={12} className="animate-spin inline"/> : 'Aprovar'}</button>
                                    <button onClick={()=>{const m = window.prompt("Motivo:"); if(m) handleHomologar(idRegisto, 'Ferias', `Rejeitado: ${m}`);}} disabled={homologandoId === idRegisto} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">Rejeitar</button>
                                  </div>
                               </td>
                             </tr>
                          )})}
                        </tbody>
                     </table></div>
                  </div>
               )}
               <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter">Escala de Férias</h3>
                    {!isApenasRT && <button onClick={() => setShowFeriasModal(true)} className="bg-amber-500 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md transition-all"><Plus size={16}/> Lançamento Direto</button>}
                  </div>
                  <GanttViewer feriasData={appData.ferias || []} />
               </div>
            </div>
         );
      case 'licencas':
         const licencasPendentes = (appData.licencas || []).filter(l => getVal(l, ['status']) === 'Pendente');
         const licencasFiltradas = (appData.licencas||[]).filter(l => {
            if (!mesFiltro) return true;
            const d = parseDate(getVal(l,['inicio', 'data']));
            return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
         });

         return (
            <div className="space-y-6">
               {!isApenasRT && licencasPendentes.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-pink-200 p-6 md:p-8 animate-fadeIn relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
                     <h3 className="font-black text-pink-600 text-lg uppercase tracking-tighter mb-4 flex items-center gap-2"><Baby size={20}/> Licenças Pendentes</h3>
                     <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Militar</th><th className="p-4 text-center">Dias</th><th className="p-4">Início</th><th className="p-4 text-center">Anexo</th><th className="p-4 text-right">Ações</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {licencasPendentes.map((l, i) => {
                             const anexoUrl = getVal(l, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                             const idRegisto = getVal(l, ['id', 'identificador']);
                             return (
                             <tr key={i} className="hover:bg-pink-50/50 transition-colors">
                               <td className="p-4 text-slate-800 text-xs font-black uppercase tracking-tighter">{getVal(l, ['militar'])}</td>
                               <td className="p-4 text-center text-slate-600 font-bold text-xs">{getVal(l, ['dias', 'quantidade'])}d</td>
                               <td className="p-4 font-mono font-bold text-slate-500 text-[10px]">{formatDate(getVal(l,['inicio', 'data']))}</td>
                               <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                               <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={()=>handleHomologar(idRegisto, 'Licencas', 'Homologado')} disabled={homologandoId === idRegisto} className="bg-pink-500 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50">{homologandoId === idRegisto ? <Loader2 size={12} className="animate-spin inline"/> : 'Aprovar'}</button>
                                    <button onClick={()=>{const m = window.prompt("Motivo:"); if(m) handleHomologar(idRegisto, 'Licencas', `Rejeitado: ${m}`);}} disabled={homologandoId === idRegisto} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">Rejeitar</button>
                                  </div>
                               </td>
                             </tr>
                          )})}
                        </tbody>
                     </table></div>
                  </div>
               )}
               <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter">Mural de Licenças</h3>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                          <button onClick={() => handleMudarMes(-1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronLeft size={16}/></button>
                          <div className="w-36 text-center text-[10px] font-black uppercase text-slate-700 tracking-widest select-none">{obterNomeMes(mesFiltro)}</div>
                          <button onClick={() => handleMudarMes(1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronRight size={16}/></button>
                        </div>
                        {mesFiltro && <button onClick={() => setMesFiltro('')} className="text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors shrink-0">Ver Todos</button>}
                        {!isApenasRT && <button onClick={() => setShowLicencaModal(true)} className="bg-pink-600 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md transition-all ml-auto md:ml-2"><Plus size={16}/> Lançar Licença</button>}
                    </div>
                  </div>
                  <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Militar</th><th className="p-4 text-center">Dias</th><th className="p-4">Início</th><th className="p-4 text-center">Anexo</th><th className="p-4">Status</th>{!isApenasRT && <th className="p-4 text-right">Ação</th>}</tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {licencasFiltradas.map((l, i) => {
                      const anexoUrl = getVal(l, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                      const idRegisto = getVal(l, ['id', 'identificador']);
                      const isPendente = getVal(l,['status']) === 'Pendente';
                      const isRejeitado = String(getVal(l,['status'])).includes('Rejeitado');
                      
                      return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-800 text-xs md:text-sm font-black tracking-tighter uppercase flex items-center gap-2">{getVal(l,['militar'])}</td>
                        <td className="p-4 text-center text-slate-500 font-bold text-xs">{getVal(l,['dias'])}d</td>
                        <td className="p-4 text-[10px] font-mono font-bold text-slate-400">{formatDate(getVal(l,['inicio', 'data']))}</td>
                        <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-right leading-tight block w-max ${isRejeitado ? 'bg-red-100 text-red-700' : isPendente ? 'bg-amber-100 text-amber-700' : 'bg-green-50 text-green-700'}`}>{getVal(l,['status'])}</span></td>
                        {!isApenasRT && <td className="p-4 text-right">
                           {isPendente && (
                              <button onClick={()=>handleHomologar(idRegisto, 'Licencas', 'Homologado')} disabled={homologandoId === idRegisto} className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-pink-700 active:scale-95 transition-all disabled:opacity-50">{homologandoId === idRegisto ? <Loader2 size={12} className="animate-spin inline"/> : 'Aprovar'}</button>
                           )}
                        </td>}
                      </tr>
                    )})}
                    {licencasFiltradas.length === 0 && <tr><td colSpan={isApenasRT ? 5 : 6} className="p-8 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">Nenhuma licença no período</td></tr>}
                  </tbody>
                </table></div>
               </div>
            </div>
         );
      case 'escala':
         if (!isCimirro) return null;
         return (
            <div className="animate-fadeIn">
               <EscalaManager appData={appData} />
            </div>
         );
      
      // ABA: PASSAGEM DE TURNO NO ADMIN
      case 'passagem':
         return (
             <div className="animate-fadeIn w-full h-full flex flex-col pt-4">
                 <PassagemTurno currentUser={user} onBack={() => setActiveTab('dashboard')} />
             </div>
         );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden print:bg-white print:h-auto print:overflow-visible">
      <aside className={`print:hidden ${sidebarOpen ? 'w-64 md:w-72' : 'w-20 md:w-24'} bg-slate-950 text-white transition-all duration-300 flex flex-col z-40 shadow-2xl border-r border-white/5`}>
         <div className="p-6 md:p-8 h-20 md:h-24 flex items-center border-b border-white/5">{sidebarOpen && <div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"><Plane size={20}/></div><span className="font-black text-lg md:text-xl uppercase tracking-tighter">ENF-HACO</span></div>}<button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-all"><Menu size={20} className="text-slate-400"/></button></div>
         <nav className="flex-1 py-6 px-3 md:px-4 space-y-2 overflow-y-auto">
            {/* Menu da Chefia / RT */}
            {[ { id: 'dashboard', label: 'Início', icon: LayoutDashboard }, 
               { id: 'passagem', label: 'Passagem Turno', icon: BookOpen }, 
               { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: isApenasRT ? 0 : (appData.atestados||[]).filter(x=>getVal(x,['status'])==='Pendente').length }, 
               { id: 'permutas', label: 'Permutas', icon: ArrowRightLeft, badge: isApenasRT ? 0 : (appData.permutas||[]).filter(x=>getVal(x,['status'])==='Pendente').length }, 
               { id: 'ferias', label: 'Férias', icon: Sun, badge: isApenasRT ? 0 : (appData.ferias||[]).filter(x=>getVal(x,['status'])==='Pendente').length }, 
               { id: 'licencas', label: 'Licenças', icon: Baby, badge: isApenasRT ? 0 : (appData.licencas||[]).filter(x=>getVal(x,['status'])==='Pendente').length }, 
               { id: 'efetivo', label: 'Efetivo', icon: Users },
               isCimirro && { id: 'escala', label: 'Escala Mensal', icon: Calendar }, 
               { id: 'absenteismo', label: 'Absenteísmo', icon: TrendingDown } ].filter(Boolean).map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-3.5 md:p-4 rounded-2xl transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                 <div className="relative"><item.icon size={20}/>{item.badge > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-black">{item.badge}</span>}</div>{sidebarOpen && <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{item.label}</span>}</button>
            ))}
         </nav>
         <div className="p-4 md:p-6 border-t border-white/5 flex flex-col items-center gap-3">
            {sidebarOpen && <div className="text-center w-full"><div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-black shadow-md bg-slate-800 text-white border border-slate-700 mb-2">{user.substring(0,2).toUpperCase()}</div><p className="font-black text-xs tracking-tight truncate w-full uppercase">{user}</p><p className="text-[8px] text-blue-400 uppercase font-bold tracking-widest">{role}</p></div>}
            <button onClick={onToggleAdmin} className="flex items-center justify-center gap-3 text-white bg-blue-600 hover:bg-blue-500 font-black text-[10px] uppercase tracking-widest w-full p-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all"><UserCircle size={16}/> {sidebarOpen && 'Meu Painel'}</button>
            <button onClick={() => setShowPassModal(true)} className="flex items-center justify-center gap-3 text-slate-500 hover:text-blue-500 font-black text-[10px] uppercase tracking-widest w-full p-2.5 rounded-xl hover:bg-white/5 transition-all"><Key size={16}/> {sidebarOpen && 'Trocar Senha'}</button>
            <button onClick={onLogout} className="flex items-center justify-center gap-3 text-slate-500 hover:text-red-400 font-black text-[10px] uppercase tracking-widest w-full p-2.5 rounded-xl hover:bg-white/5 transition-all"><LogOut size={16}/> {sidebarOpen && 'Sair'}</button>
         </div>
      </aside>
      <main className={`flex-1 overflow-auto p-6 md:p-10 bg-slate-50/50 relative z-10 print:p-0 print:bg-white print:overflow-visible ${activeTab === 'passagem' ? 'flex flex-col' : ''}`}>
         {activeTab !== 'passagem' && (
             <header className="print:hidden flex justify-between items-end mb-8 md:mb-10 border-b border-slate-200 pb-6 md:pb-8">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                   <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p>
                   <WeatherWidgetMini />
                </div>
                <button onClick={() => syncData(true)} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-blue-600 hover:bg-slate-50 active:scale-95 transition-all"><RefreshCw size={20} className={isSyncing?'animate-spin':''}/></button>
             </header>
         )}
         {renderContent()}
         
         {/* MODAIS GESTÃO */}
         {showOfficerModal && !isApenasRT && (
           <Modal title={formOfficer.nome ? "Editar Oficial" : "Incluir Militar"} onClose={() => setShowOfficerModal(false)}>
              <form onSubmit={handleSaveOfficer} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nome de Guerra</label><input type="text" required className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={formOfficer.nome || ''} onChange={e => setFormOfficer({...formOfficer, nome: e.target.value})}/></div>
                    <div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Patente</label><input type="text" required className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={formOfficer.patente || ''} onChange={e => setFormOfficer({...formOfficer, patente: e.target.value})}/></div>
                    <div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Antiguidade</label><input type="number" required className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={formOfficer.antiguidade || ''} onChange={e => setFormOfficer({...formOfficer, antiguidade: e.target.value})}/></div>
                    <div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data Nasc.</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={formOfficer.nascimento || ''} onChange={e => setFormOfficer({...formOfficer, nascimento: e.target.value})}/></div>
                    <div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data Praça</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={formOfficer.ingresso || ''} onChange={e => setFormOfficer({...formOfficer, ingresso: e.target.value})}/></div>
                    <div className="col-span-2 pt-3 border-t"><label className="text-[9px] font-black uppercase text-blue-500 ml-1 tracking-widest mb-2 block">Alocação Expediente (Múltiplo)</label>
                      <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                        {LOCAIS_EXPEDIENTE.map(local => (
                          <button key={local} type="button" onClick={() => handleToggleExpediente(local)} className={`py-2 px-1 rounded-xl text-[8px] font-black transition-all border ${ (formOfficer.expediente || []).includes(local) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300' }`}>{local}</button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 pt-3"><label className="text-[9px] font-black uppercase text-indigo-500 ml-1 tracking-widest mb-2 block">Alocação Serviço (Único)</label>
                      <div className="flex gap-3">
                        {LOCAIS_SERVICO.map(serv => (
                          <button key={serv} type="button" onClick={() => setFormOfficer({...formOfficer, servico: serv})} className={`flex-1 p-3 rounded-2xl text-[10px] font-black transition-all border flex items-center justify-center gap-2 ${ formOfficer.servico === serv ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200' }`}>
                             {formOfficer.servico === serv ? <CheckSquare size={12}/> : <Square size={12}/>} {serv}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 pt-3">
                       <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-pink-500 bg-pink-50 p-4 rounded-2xl border border-pink-200 cursor-pointer hover:bg-pink-100 transition-colors">
                         <input type="checkbox" className="w-4 h-4 accent-pink-500" checked={formOfficer.gestante === 'Sim'} onChange={e => setFormOfficer({...formOfficer, gestante: e.target.checked ? 'Sim' : ''})} />
                         Militar Gestante (Isenta de Escala Vermelha)
                       </label>
                    </div>
                 </div>
                 <button type="submit" disabled={isSaving} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all mt-4">{isSaving ? "A Processar..." : "Gravar Dados"}</button>
              </form>
           </Modal>
         )}
         {showPassModal && (
           <Modal title="Trocar Senha de Acesso" onClose={() => setShowPassModal(false)}>
              <form onSubmit={handleChangePassword} className="space-y-4">
                 <div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nova Senha</label><input type="password" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 focus:ring-2 outline-none" onChange={e=>setPassForm({...passForm,new:e.target.value})}/></div>
                 <div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirmar Nova Senha</label><input type="password" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 focus:ring-2 outline-none" onChange={e=>setPassForm({...passForm,confirm:e.target.value})}/></div>
                 <div className="bg-blue-50 p-3 rounded-xl flex items-start gap-2"><Lock size={14} className="text-blue-500 mt-0.5 shrink-0"/><p className="text-[9px] font-bold text-blue-800">Ao guardar, a sua nova senha substituirá a senha padrão. Mantenha-a em segurança.</p></div>
                 <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Atualizar...":"Salvar Nova Senha"}</button>
              </form>
           </Modal>
         )}
      </main>
    </div>
  );
}
// =========================================================================
// --- COMPONENTE RAIZ (O QUE ESTAVA FALTANDO) ---
// =========================================================================

const App = () => {
  const [auth, setAuth] = useState({ loggedIn: false, user: null, role: null });
  const [appData, setAppData] = useState({ officers: [], atestados: [], permutas: [], ferias: [], licencas: [], escalasVermelhas: [], upi: { leitosOcupados: 0, mediaBraden: 0, mediaFugulin: 0 } });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  const syncData = async (showLoader = false) => {
    if (showLoader) setIsSyncing(true);
    try {
      const res = await fetch(API_URL_GESTAO);
      const data = await res.json();
      setAppData(data);
      setSyncError(false);
    } catch (e) {
      setSyncError(true);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { syncData(true); }, []);

  const handleLogin = (user, role) => {
    setAuth({ loggedIn: true, user, role });
    if (role === 'admin' || role === 'rt') setIsAdminView(true);
  };

  const handleLogout = () => {
    setAuth({ loggedIn: false, user: null, role: null });
    setIsAdminView(false);
  };

  if (!auth.loggedIn) {
    return <LoginScreen onLogin={handleLogin} appData={appData} isSyncing={isSyncing} syncError={syncError} onForceSync={() => syncData(true)} />;
  }

  return (
    <ErrorBoundary>
      {isAdminView ? (
        <MainSystem 
          user={auth.user} role={auth.role} onLogout={handleLogout} 
          appData={appData} syncData={syncData} isSyncing={isSyncing} 
          onToggleAdmin={() => setIsAdminView(false)} 
          isCimirro={auth.user.includes('Cimirro')}
        />
      ) : (
        <UserDashboard 
          user={auth.user} onLogout={handleLogout} 
          appData={appData} syncData={syncData} isSyncing={isSyncing} 
          isAdmin={auth.role === 'admin' || auth.role === 'rt'}
          onToggleAdmin={() => setIsAdminView(true)}
        />
      )}
    </ErrorBoundary>
  );
};

export default App; // ESTA É A LINHA QUE O VERCEL/VITE EXIGE
