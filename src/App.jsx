import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Cake, BookOpen, Plus, Trash2, Edit3, 
  UserPlus, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, Thermometer, TrendingDown, Plane, CheckSquare, Square,
  ChevronUp, ChevronDown, ChevronsUpDown, CalendarClock, PieChart,
  ChevronLeft, ChevronRight, Key, Lock, Sun, CalendarDays, History
} from 'lucide-react';

// --- CONFIGURAÇÃO DE CONEXÃO ---
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 

const LOCAIS_EXPEDIENTE = ["SDENF", "FUNSA", "CAIS", "UCC", "UPA", "UTI", "UPI", "SAD", "SSOP", "SIL", "FERISTA"];
const LOCAIS_SERVICO = ["UTI", "UPI"];

// --- HELPERS DE SEGURANÇA E LEITURA ---

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

const getActiveAtestados = (atestados) => {
  if (!Array.isArray(atestados)) return [];
  const today = new Date();
  today.setHours(0,0,0,0);
  
  return atestados.filter(a => {
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
      if (getVal(a, ['status']) !== 'Homologado') return; 
      
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

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
        <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center justify-center font-sans">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-200 text-center"><AlertCircle size={64} className="text-red-500 mx-auto mb-4" /><h1 className="text-2xl font-black text-slate-800 mb-2 uppercase">Erro de Interface</h1><p className="text-slate-500 mb-4 text-sm">{this.state.error?.toString()}</p><button onClick={() => {localStorage.removeItem('sga_app_cache'); window.location.reload();}} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg hover:bg-slate-800 transition-all">Limpar Cache e Recarregar</button></div>
        </div>
      );
    return this.props.children;
  }
}

// --- COMPONENTES VISUAIS E COMPARTILHADOS ---

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
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

const BirthdayWidget = ({ staff }) => {
  const list = Array.isArray(staff) ? staff : [];
  const currentMonth = new Date().getMonth();
  const birthdays = list.filter(p => {
    const d = parseDate(getVal(p, ['nasc']));
    return d && d.getMonth() === currentMonth;
  }).sort((a, b) => (parseDate(getVal(a, ['nasc']))?.getDate() || 0) - (parseDate(getVal(b, ['nasc']))?.getDate() || 0));

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full font-sans">
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

// COMPONENTE GANTT COMPARTILHADO (Usado por Admin e Tropa)
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

  // Filtra apenas férias que já foram homologadas (ou antigas que não tinham a coluna status)
  const feriasHomologadas = feriasData.filter(f => {
     const st = getVal(f, ['status']);
     return !st || st === 'Homologado'; 
  });

  const feriasListFiltradas = feriasHomologadas.filter(f => {
     const start = parseDate(getVal(f, ['inicio', 'data', 'saida']));
     const dias = parseInt(getVal(f, ['dias', 'quantidade'])) || 30; 
     if (!start) return false;
     
     const end = new Date(start);
     end.setDate(end.getDate() + dias - 1);
     
     const monthStart = new Date(anoStrF, mesStrF, 1);
     const monthEnd = new Date(anoStrF, mesStrF + 1, 0);

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
             {/* Cabeçalho do Gantt */}
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
             
             {/* Corpo do Gantt */}
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
                            const currentDate = new Date(anoStrF, mesStrF, d);
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


// --- ECRÃ DE LOGIN ---

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
        return r === 'admin' || r === 'rt' || n.includes('Cimirro') || n.includes('Zanini');
      }) 
    : list.filter(o => {
        const r = String(getVal(o, ['role'])).toLowerCase();
        const n = String(getVal(o, ['nome']));
        return r !== 'admin' && r !== 'rt' && !n.includes('Cimirro') && !n.includes('Zanini');
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
           if (nome.includes('Cimirro') || nome.includes('Zanini')) role = 'admin';
           onLogin(nome, role);
       } else {
           setLoginError('Senha incorreta.');
       }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
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

// --- ÁREA DO OFICIAL (TROPA) ---

const UserDashboard = ({ user, onLogout, appData, syncData, isSyncing }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [modals, setModals] = useState({ atestado: false, permuta: false, ferias: false, gantt: false, password: false });
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

  // Filtros para mostrar na lista do painel do usuário
  const atestadosFiltrados = (appData.atestados || []).filter(a => {
     if (!String(getVal(a, ['militar'])).includes(user)) return false;
     if (!mesFiltro) return true;
     const d = parseDate(getVal(a,['inicio', 'data']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(a => ({...a, _tipo: 'Atestado'})).reverse();

  const permutasFiltradas = (appData.permutas || []).filter(p => {
     if (!String(getVal(p, ['solicitante'])).includes(user)) return false;
     if (!mesFiltro) return true;
     const d = parseDate(getVal(p,['sai', 'datasai']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(p => ({...p, _tipo: 'Permuta'})).reverse();

  const feriasFiltradas = (appData.ferias || []).filter(f => {
     if (!String(getVal(f, ['militar'])).includes(user)) return false;
     if (!mesFiltro) return true;
     const d = parseDate(getVal(f,['inicio', 'data', 'saida']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(f => ({...f, _tipo: 'Férias'})).reverse();

  const handleSend = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload: { ...payload, file: fileData } }) });
      setTimeout(() => { setIsSaving(false); setModals({ atestado: false, permuta: false, ferias: false, gantt: false, password: false }); setFileData(null); syncData(true); }, 1500);
    } catch(e) { setIsSaving(false); alert("Erro ao enviar. Verifique a conexão."); }
  };

  const closeModals = () => { setModals({ atestado: false, permuta: false, ferias: false, gantt: false, password: false }); setFileData(null); }

  const handleChangePassword = (e) => {
     e.preventDefault();
     if(passForm.new !== passForm.confirm) return alert("As senhas não conferem.");
     if(passForm.new.length < 4) return alert("A senha deve ter pelo menos 4 caracteres.");
     const myOfficerData = appData.officers.find(o => getVal(o, ['nome']) === user);
     if(!myOfficerData) return alert("Erro ao localizar seu perfil.");
     handleSend('saveOfficer', { ...myOfficerData, senha: passForm.new });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md text-xl">HA</div>
          <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-tighter">Ten {user}</h1><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Painel Individual</p></div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setModals({...modals, password: true})} className="bg-slate-100 p-2.5 rounded-xl text-slate-500 hover:text-blue-500 transition-all active:scale-90"><Key size={16}/></button>
           <button onClick={onLogout} className="bg-slate-100 p-2.5 rounded-xl text-slate-500 hover:text-red-500 transition-all active:scale-90"><LogOut size={16}/></button>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-5">
        <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden"><h2 className="text-xl font-black uppercase tracking-tighter relative z-10">Mural</h2><Plane className="absolute -bottom-4 -right-4 text-white/10" size={100}/></div>
        
        {/* NOVO MENU DE BOTÕES (AGORA COM 3 OPÇÕES) */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => setModals({...modals, atestado: true})} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all"><ShieldAlert size={20}/></div><span className="font-black text-[9px] uppercase text-slate-700 tracking-widest text-center">Atestado</span></button>
          <button onClick={() => setModals({...modals, permuta: true})} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><ArrowRightLeft size={20}/></div><span className="font-black text-[9px] uppercase text-slate-700 tracking-widest text-center">Permuta</span></button>
          <button onClick={() => setModals({...modals, ferias: true})} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all"><Sun size={20}/></div><span className="font-black text-[9px] uppercase text-slate-700 tracking-widest text-center">Férias</span></button>
        </div>

        {/* BOTÃO PARA ABRIR O GANTT GERAL */}
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
                    <div className="w-28 text-center text-[8px] font-black uppercase text-slate-700 tracking-widest select-none">
                      {obterNomeMes(mesFiltro)}
                    </div>
                    <button onClick={() => handleMudarMes(1)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronRight size={14}/></button>
                 </div>
                 {mesFiltro && (
                    <button onClick={() => setMesFiltro('')} className="text-[8px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors shrink-0">Ver Todos</button>
                 )}
             </div>
           </div>

          <div className="space-y-2">
            {/* Renderiza tudo misturado na timeline do usuario */}
            {[...permutasFiltradas, ...atestadosFiltrados, ...feriasFiltradas].sort((a,b) => {
                const dateA = parseDate(getVal(a,['inicio', 'data', 'sai', 'datasai']))?.getTime() || 0;
                const dateB = parseDate(getVal(b,['inicio', 'data', 'sai', 'datasai']))?.getTime() || 0;
                return dateB - dateA;
            }).map((item, i) => {
              const anexoUrl = getVal(item, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
              let titulo = "";
              let icon = null;
              
              if (item._tipo === 'Atestado') { titulo = `Afastamento: ${getVal(item,['dias'])}d`; icon = <ShieldAlert size={12} className="text-red-500 inline mr-1"/>; }
              if (item._tipo === 'Permuta') { titulo = `Troca: ${getVal(item,['substituto'])}`; icon = <ArrowRightLeft size={12} className="text-indigo-500 inline mr-1"/>; }
              if (item._tipo === 'Férias') { titulo = `Férias: ${getVal(item,['dias', 'quantidade'])}d`; icon = <Sun size={12} className="text-amber-500 inline mr-1"/>; }

              const statusAtual = getVal(item,['status']) || 'Homologado'; // fallback pra antigas

              return (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div className="text-xs">
                  <p className="font-black text-slate-800 uppercase text-[10px] mb-1">{icon} {titulo}</p>
                  <div className="flex gap-2 font-bold text-slate-400 text-[8px] uppercase tracking-widest items-center">
                    <span className="bg-slate-50 px-2 py-1 rounded">{formatDate(getVal(item,['inicio', 'data', 'sai', 'datasai']))}</span>
                    {getVal(item,['substituto']) && <span className="bg-slate-50 px-2 py-1 rounded flex items-center gap-1"><ArrowRightLeft size={8}/>{formatDate(getVal(item,['entra', 'dataentra']))}</span>}
                    {anexoUrl && <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 hover:text-blue-700"><Paperclip size={10}/> Anexo</a>}
                  </div>
                </div>
                <span className={`text-[8px] px-2 py-1 rounded-md font-black uppercase tracking-widest ${statusAtual==='Homologado'?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>{statusAtual}</span>
              </div>
            )})}
            {(permutasFiltradas.length === 0 && atestadosFiltrados.length === 0 && feriasFiltradas.length === 0) && <p className="text-center text-[10px] text-slate-400 font-bold py-6 uppercase border border-dashed rounded-2xl">Sem registos no período</p>}
          </div>
        </div>
      </main>

      {/* MODAIS USER */}
      {modals.gantt && <Modal title={<><CalendarDays size={18}/> Escala Geral de Férias</>} onClose={closeModals}><GanttViewer feriasData={appData.ferias} /></Modal>}
      {modals.password && <Modal title="Trocar Senha de Acesso" onClose={closeModals}><form onSubmit={handleChangePassword} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nova Senha</label><input type="password" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 focus:ring-2 outline-none" onChange={e=>setPassForm({...passForm,new:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Confirmar Nova Senha</label><input type="password" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 focus:ring-2 outline-none" onChange={e=>setPassForm({...passForm,confirm:e.target.value})}/></div><div className="bg-blue-50 p-3 rounded-xl flex items-start gap-2"><Lock size={14} className="text-blue-500 mt-0.5 shrink-0"/><p className="text-[9px] font-bold text-blue-800">Ao guardar, a sua nova senha substituirá a senha padrão. Mantenha-a em segurança.</p></div><button disabled={isSaving} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Atualizar...":"Salvar Nova Senha"}</button></form></Modal>}
      {modals.atestado && <Modal title="Anexar Atestado" onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveAtestado',{id:Date.now().toString(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Total de Dias</label><input type="number" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,dias:e.target.value})}/></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-red-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Protocolar Pedido"}</button></form></Modal>}
      {modals.permuta && <Modal title="Pedir Permuta" onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('savePermuta',{id:Date.now().toString(),status:'Pendente',solicitante:user,substituto:form.sub,datasai:form.sai,dataentra:form.entra});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data de Saída</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,sai:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Militar Substituto</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,sub:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data de Substituição</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,entra:e.target.value})}/></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Solicitar Troca"}</button></form></Modal>}
      
      {/* NOVO MODAL: PEDIR FÉRIAS DO USUÁRIO COM OPÇÕES RESTRITAS */}
      {modals.ferias && <Modal title={<><Sun size={18}/> Solicitar Férias</>} onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveFerias',{id:Date.now().toString(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Quantidade de Dias (Parcelamento)</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 cursor-pointer" onChange={e=>setForm({...form,dias:e.target.value})}><option value="">Selecione o parcelamento...</option><option value="10">10 dias (Para parcelamento 10/10/10 ou 20/10)</option><option value="15">15 dias (Para parcelamento 15/15)</option><option value="20">20 dias (Para parcelamento 20/10)</option><option value="30">30 dias (Mês Integral)</option></select></div><div className="bg-amber-50 p-3 rounded-xl flex items-start gap-2 border border-amber-100"><AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0"/><p className="text-[9px] font-bold text-amber-800">O pedido ficará <span className="font-black uppercase">Pendente</span> até homologação da Chefia. Recomenda-se olhar o Gantt Geral antes de solicitar.</p></div><button disabled={isSaving} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Protocolar Férias"}</button></form></Modal>}
    </div>
  );
};

// --- PAINEL CHEFIA (ADMIN) ---

const MainSystem = ({ user, role, onLogout, appData, syncData, isSyncing }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [homologandoId, setHomologandoId] = useState(null); 
  
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [showAtestadoModal, setShowAtestadoModal] = useState(false);
  const [showPermutaModal, setShowPermutaModal] = useState(false);
  const [showFeriasModal, setShowFeriasModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  
  // Controle do Modal de Histórico Individual no Efetivo
  const [historyOfficer, setHistoryOfficer] = useState(null);

  const [formOfficer, setFormOfficer] = useState({ expediente: [], servico: '' });
  const [formAtestado, setFormAtestado] = useState({});
  const [formPermuta, setFormPermuta] = useState({});
  const [formFerias, setFormFerias] = useState({});
  const [passForm, setPassForm] = useState({ new: '', confirm: '' });
  const [fileData, setFileData] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: 'antiguidade', direction: 'asc' });

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

  const atestadosAtivos = getActiveAtestados(appData.atestados);
  const absenteismoDados = calculateAbsenteismoStats(appData.atestados, (appData.officers||[]).length);
  const taxaMensalAbs = absenteismoDados.months[new Date().getMonth()].rate;
  const nomeMesAtual = absenteismoDados.months[new Date().getMonth()].monthName;

  const sendData = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload }) });
      setTimeout(() => { 
          setIsSaving(false); 
          setShowOfficerModal(false); 
          setShowAtestadoModal(false);
          setShowPermutaModal(false);
          setShowFeriasModal(false);
          setShowPassModal(false);
          setFileData(null);
          syncData(true); 
      }, 1500); 
    } catch (e) { setIsSaving(false); alert("Falha na gravação."); }
  };

  const handleHomologar = async (id, sheetName) => {
    if (!id) {
       alert("ERRO DE PLANILHA: Este registo não possui um 'id' salvo no Google Sheets. Crie a coluna 'id' na aba.");
       return;
    }
    setHomologandoId(id);
    try {
      await fetch(API_URL_GESTAO, { 
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify({ action: 'updateStatus', payload: { sheet: sheetName, id: id, status: 'Homologado' } }) 
      });
      setTimeout(() => { setHomologandoId(null); syncData(true); }, 2000);
    } catch(e) { setHomologandoId(null); alert("Erro de conexão ao homologar."); }
  };

  const handleToggleExpediente = (local) => {
    const current = Array.isArray(formOfficer.expediente) ? formOfficer.expediente : [];
    if (current.includes(local)) {
      setFormOfficer({...formOfficer, expediente: current.filter(l => l !== local)});
    } else {
      setFormOfficer({...formOfficer, expediente: [...current, local]});
    }
  };

  const handleSaveOfficer = (e) => {
    e.preventDefault();
    const payload = { ...formOfficer, id: formOfficer.id || Date.now(), expediente: Array.isArray(formOfficer.expediente) ? formOfficer.expediente.join(', ') : '', servico: formOfficer.servico || '' };
    sendData('saveOfficer', payload);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if(passForm.new !== passForm.confirm) return alert("As senhas não conferem.");
    if(passForm.new.length < 4) return alert("A senha deve ter pelo menos 4 caracteres.");
    const myOfficerData = appData.officers.find(o => getVal(o, ['nome']) === user);
    if(!myOfficerData) return alert("Erro ao localizar seu perfil.");
    const payload = { ...myOfficerData, senha: passForm.new };
    sendData('saveOfficer', payload);
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
        return (
          <div className="space-y-6 animate-fadeIn font-sans">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                
                {/* STATUS UPI CARD COMPACTO */}
                <div className="col-span-2 md:col-span-4 bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center border border-slate-800 relative overflow-hidden gap-6">
                   <div className="absolute -top-10 -right-10 opacity-5"><Activity size={180}/></div>
                   <div className="flex items-center gap-5 relative z-10">
                      <div className="bg-blue-600 p-4 rounded-2xl shadow-lg"><Activity size={28}/></div>
                      <div><h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Status UPI</h3><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Ref: {appData.upi.dataReferencia}</p></div>
                   </div>
                   <div className="flex gap-8 md:gap-12 text-center relative z-10 font-black w-full md:w-auto justify-between md:justify-end">
                      <div><p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Ocupação</p><p className="text-3xl md:text-4xl">{appData.upi.leitosOcupados} <span className="text-base text-slate-700 font-bold">/ 15</span></p></div>
                      <div><p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Braden</p><p className="text-3xl md:text-4xl text-yellow-500">{appData.upi.mediaBraden.toFixed(1)}</p></div>
                      <div><p className="text-slate-500 text-[9px] uppercase tracking-widest mb-1">Fugulin</p><p className="text-3xl md:text-4xl text-green-500">{appData.upi.mediaFugulin.toFixed(1)}</p></div>
                   </div>
                </div>

                {/* Sub-grid da esquerda: KPIs de Gestão */}
                <div className="col-span-2 grid grid-cols-2 gap-4 md:gap-6">
                   <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Efetivo Base</p>
                     <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{(appData.officers||[]).length}</h3>
                   </div>
                   <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Pendentes</p>
                     <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{(appData.atestados||[]).filter(x=>getVal(x,['status'])==='Pendente').length + (appData.permutas||[]).filter(x=>getVal(x,['status'])==='Pendente').length + (appData.ferias||[]).filter(x=>getVal(x,['status'])==='Pendente').length}</h3>
                   </div>
                   <div className="bg-red-50 p-5 rounded-3xl border border-red-100 flex flex-col items-center justify-center shadow-sm">
                     <p className="text-[9px] font-black uppercase text-red-400 tracking-widest mb-1 flex items-center gap-1"><CalendarClock size={10}/> Atestados Em Vigor</p>
                     <h3 className="text-3xl font-black text-red-600 tracking-tighter">{atestadosAtivos.length}</h3>
                   </div>
                   <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-sm hover:border-blue-200 cursor-pointer transition-all" onClick={() => setActiveTab('absenteismo')}>
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 flex items-center gap-1"><PieChart size={10}/> Absenteísmo ({nomeMesAtual})</p>
                     <h3 className="text-3xl font-black text-blue-600 tracking-tighter">{taxaMensalAbs}%</h3>
                   </div>
                </div>

                {/* Sub-grid da direita: Aniversários */}
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
                          <div>
                            <p className="text-2xl font-black tracking-tighter text-slate-800">{m.rate}%</p>
                          </div>
                          <p className="text-[9px] font-bold uppercase text-slate-400">{m.lostDays} dias perdidos</p>
                       </div>
                    </div>
                 ))}
              </div>
              
              <div className="mt-8 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-500 font-bold flex gap-3">
                 <AlertCircle size={16} className="text-blue-500 shrink-0"/>
                 <p>A taxa de absenteísmo é calculada cruzando os dias de atestado médico (homologados) que ocorrem em cada mês contra a força de trabalho teórica (Total de Oficiais x Dias do Mês). O cálculo serve para auditar o impacto na assistência do HACO.</p>
              </div>
           </div>
         );
      case 'efetivo':
         const sortedOfficers = [...(appData.officers||[])].sort((a,b) => {
            const { key, direction } = sortConfig;
            let valA, valB;
            if (key === 'antiguidade') {
                valA = parseInt(getVal(a, ['antiguidade'])) || 9999; valB = parseInt(getVal(b, ['antiguidade'])) || 9999;
                return direction === 'asc' ? valA - valB : valB - valA;
            } else if (key === 'nome') {
                valA = String(getVal(a, ['nome'])).toLowerCase(); valB = String(getVal(b, ['nome'])).toLowerCase();
            } else if (key === 'expediente') {
                valA = String(getVal(a, ['expediente'])).toLowerCase(); valB = String(getVal(b, ['expediente'])).toLowerCase();
            } else if (key === 'idade') {
                valA = parseDate(getVal(a, ['nasc']))?.getTime() || 9999999999999; valB = parseDate(getVal(b, ['nasc']))?.getTime() || 9999999999999;
            } else if (key === 'ingresso') {
                valA = parseDate(getVal(a, ['ingres']))?.getTime() || 9999999999999; valB = parseDate(getVal(b, ['ingres']))?.getTime() || 9999999999999;
            }
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
         });

         return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter">Quadro de Oficiais</h3>
                <button onClick={() => { setFormOfficer({ expediente: [], servico: '' }); setShowOfficerModal(true); }} className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md shadow-blue-500/20 transition-all"><UserPlus size={16}/> Incluir Oficial</button>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm font-sans min-w-[800px]"><thead className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr><SortableHeader label="Ant." sortKey="antiguidade" align="center" /><SortableHeader label="Posto/Nome" sortKey="nome" /><SortableHeader label="Alocação" sortKey="expediente" /><SortableHeader label="Idade" sortKey="idade" align="center" /><SortableHeader label="Praça/Serviço" sortKey="ingresso" align="center" /><th className="p-3 md:p-4 text-right">Ação</th></tr>
                  </thead><tbody className="divide-y divide-slate-50">
                    {sortedOfficers.map((o, i) => {
                      const tIdade = calculateDetailedTime(getVal(o, ['nasc']));
                      const tServico = calculateDetailedTime(getVal(o, ['ingres']));
                      const expedientes = String(getVal(o, ['expediente']) || "").split(',').map(x => x.trim()).filter(x => x !== "");
                      const nomeOficial = getVal(o, ['nome']);

                      return (
                      <tr key={i} className="hover:bg-slate-50/80 group transition-colors">
                        <td className="p-3 md:p-4 text-center text-slate-300 font-black text-base">{getVal(o, ['antiguidade'])}</td>
                        <td className="p-3 md:p-4">
                           <div className="flex flex-col">
                              {/* NOVO: Nome clicável para abrir Histórico */}
                              <span onClick={() => setHistoryOfficer(o)} className="font-black text-blue-600 hover:text-blue-800 uppercase tracking-tighter text-xs md:text-sm cursor-pointer hover:underline transition-all">
                                 {getVal(o,['patente','posto'])} {nomeOficial}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(getVal(o,['nasc']))}</span>
                           </div>
                        </td>
                        <td className="p-3 md:p-4"><div className="flex flex-col gap-1"><div className="flex flex-wrap gap-1">{expedientes.map((ex, idx) => (<span key={idx} className="bg-blue-50 text-blue-600 text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-blue-100">{ex}</span>))}</div><span className={`text-[8px] font-black uppercase inline-block ${getVal(o,['servico']) === 'UTI' ? 'text-purple-600' : 'text-blue-600'}`}>SV: {getVal(o,['servico']) || '-'}</span></div></td>
                        <td className={`p-3 md:p-4 text-center text-[10px] font-bold ${tIdade.y >= 45 ? 'text-red-600 bg-red-50 rounded-lg' : 'text-slate-600'}`}>{tIdade.display}</td>
                        <td className={`p-3 md:p-4 text-center text-[10px] font-bold ${tServico.y >= 7 ? 'text-red-600 bg-red-50 rounded-lg' : 'text-slate-600'}`}><div className="flex flex-col items-center"><span className="text-[8px] text-slate-400 font-mono">{formatDate(getVal(o,['ingres']))}</span><span>{tServico.display}</span></div></td>
                        <td className="p-3 md:p-4 text-right"><div className="flex gap-2 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { const expArr = String(getVal(o, ['expediente']) || "").split(',').map(x => x.trim()).filter(x => x !== ""); setFormOfficer({ ...o, nome: getVal(o,['nome']), patente: getVal(o,['patente','posto']), antiguidade: getVal(o,['antiguidade']), nascimento: formatDateForInput(getVal(o,['nasc'])), ingresso: formatDateForInput(getVal(o,['ingres'])), role: getVal(o,['role']), expediente: expArr, servico: getVal(o,['servico']) }); setShowOfficerModal(true); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14}/></button><button onClick={() => { if(window.confirm(`Remover ${getVal(o,['nome'])}?`)) sendData('deleteOfficer', { nome: getVal(o,['nome']) }); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/></button></div></td>
                      </tr>
                    )})}
                    {sortedOfficers.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum oficial cadastrado</td></tr>}
                  </tbody>
                </table></div>
            </div>
         );
      case 'atestados':
         const atestadosListFiltrados = (appData.atestados||[]).filter(a => {
            if (!mesFiltro) return true;
            const d = parseDate(getVal(a,['inicio', 'data']));
            if (!d) return false;
            const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return itemMonth === mesFiltro;
         });

         return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter">Gestão de Atestados</h3>
                 
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button onClick={() => handleMudarMes(-1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronLeft size={16}/></button>
                      <div className="w-36 text-center text-[10px] font-black uppercase text-slate-700 tracking-widest select-none">
                        {obterNomeMes(mesFiltro)}
                      </div>
                      <button onClick={() => handleMudarMes(1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronRight size={16}/></button>
                    </div>
                    {mesFiltro && (
                      <button onClick={() => setMesFiltro('')} className="text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors shrink-0">Ver Todos</button>
                    )}
                    <button onClick={() => setShowAtestadoModal(true)} className="bg-red-600 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md transition-all ml-auto md:ml-2"><Plus size={16}/> Lançar Atestado</button>
                 </div>
               </div>
               <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Militar</th><th className="p-4 text-center">Dias</th><th className="p-4">Início</th><th className="p-4 text-center">Anexo</th><th className="p-4">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {atestadosListFiltrados.map((a, i) => {
                      const anexoUrl = getVal(a, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                      const idRegisto = getVal(a, ['id', 'identificador']);
                      const isVigor = atestadosAtivos.includes(a);
                      
                      return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-800 text-xs md:text-sm font-black tracking-tighter uppercase flex items-center gap-2">{getVal(a,['militar'])} {isVigor && <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest">Em Vigor</span>}</td>
                        <td className="p-4 text-center text-slate-500 font-bold text-xs">{getVal(a,['dias'])}d</td>
                        <td className="p-4 text-[10px] font-mono font-bold text-slate-400">{formatDate(getVal(a,['inicio', 'data']))}</td>
                        <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors" title="Visualizar Anexo"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-md text-[8px] font-black tracking-widest uppercase ${getVal(a,['status']) === 'Homologado' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{getVal(a,['status'])}</span></td>
                        <td className="p-4 text-right">{getVal(a,['status']) === 'Pendente' && <button onClick={()=>handleHomologar(idRegisto, 'Atestados')} disabled={homologandoId === idRegisto} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed">{homologandoId === idRegisto ? <Loader2 size={12} className="animate-spin inline"/> : 'Homologar'}</button>}</td>
                      </tr>
                    )})}
                    {atestadosListFiltrados.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">Nenhum registo no período selecionado</td></tr>}
                  </tbody>
                </table></div>
            </div>
         );
      case 'permutas':
         const permutasListFiltradas = (appData.permutas||[]).filter(p => {
            if (!mesFiltro) return true;
            const d = parseDate(getVal(p,['sai', 'datasai']));
            if (!d) return false;
            const itemMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return itemMonth === mesFiltro;
         });

         return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter">Permutas Solicitadas</h3>
                 
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button onClick={() => handleMudarMes(-1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronLeft size={16}/></button>
                      <div className="w-36 text-center text-[10px] font-black uppercase text-slate-700 tracking-widest select-none">
                        {obterNomeMes(mesFiltro)}
                      </div>
                      <button onClick={() => handleMudarMes(1)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all active:scale-95"><ChevronRight size={16}/></button>
                    </div>
                    {mesFiltro && (
                      <button onClick={() => setMesFiltro('')} className="text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors shrink-0">Ver Todos</button>
                    )}
                    <button onClick={() => setShowPermutaModal(true)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md transition-all ml-auto md:ml-2"><Plus size={16}/> Lançar Permuta</button>
                 </div>
               </div>
               <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Solicitante</th><th className="p-4">Substituto</th><th className="p-4">Período (S / E)</th><th className="p-4 text-center">Anexo</th><th className="p-4">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
                 <tbody className="divide-y divide-slate-50">
                   {permutasListFiltradas.map((p, idx) => {
                     const anexoUrl = getVal(p, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                     const idRegisto = getVal(p, ['id', 'identificador']);
                     return (
                     <tr key={idx} className="hover:bg-slate-50 transition-colors">
                       <td className="p-4 text-slate-800 text-xs font-black uppercase tracking-tighter">{getVal(p, ['solicitante'])}</td>
                       <td className="p-4 text-slate-600 text-xs font-bold uppercase tracking-tighter">{getVal(p, ['substituto'])}</td>
                       <td className="p-4"><div className="flex gap-4 font-mono font-bold text-[9px]"><span className="text-red-500">S: {formatDate(getVal(p,['sai','datasai']))}</span><span className="text-green-600">E: {formatDate(getVal(p,['entra','dataentra']))}</span></div></td>
                       <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors" title="Visualizar Anexo"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                       <td className="p-4"><span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${getVal(p, ['status']) === 'Homologado' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{getVal(p, ['status'])}</span></td>
                       <td className="p-4 text-right">{getVal(p, ['status']) === 'Pendente' && <button onClick={() => handleHomologar(idRegisto, 'Permutas')} disabled={homologandoId === idRegisto} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed">{homologandoId === idRegisto ? <Loader2 size={12} className="animate-spin inline"/> : 'Homologar'}</button>}</td>
                     </tr>
                   )})}
                   {permutasListFiltradas.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">Nenhuma permuta no período selecionado</td></tr>}
                 </tbody>
               </table></div>
            </div>
         );
      case 'ferias':
         // NOVO: Separar as férias pendentes de homologação e as já homologadas
         const feriasPendentes = (appData.ferias || []).filter(f => getVal(f, ['status']) === 'Pendente');

         return (
            <div className="space-y-6">
               {/* 1. SEÇÃO DE PENDÊNCIAS (SE HOUVER) */}
               {feriasPendentes.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-amber-200 p-6 md:p-8 animate-fadeIn relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                     <h3 className="font-black text-amber-600 text-lg uppercase tracking-tighter mb-4 flex items-center gap-2"><Sun size={20}/> Solicitações Pendentes</h3>
                     <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Militar</th><th className="p-4 text-center">Dias (Parcela)</th><th className="p-4">Início</th><th className="p-4 text-right">Ação</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {feriasPendentes.map((f, i) => {
                             const idRegisto = getVal(f, ['id', 'identificador']);
                             return (
                             <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                               <td className="p-4 text-slate-800 text-xs font-black uppercase tracking-tighter">{getVal(f, ['militar'])}</td>
                               <td className="p-4 text-center text-slate-600 font-bold text-xs">{getVal(f, ['dias', 'quantidade'])}d</td>
                               <td className="p-4 font-mono font-bold text-slate-500 text-[10px]">{formatDate(getVal(f,['inicio', 'data']))}</td>
                               <td className="p-4 text-right"><button onClick={()=>handleHomologar(idRegisto, 'Ferias')} disabled={homologandoId === idRegisto} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-amber-600 active:scale-95 transition-all disabled:bg-amber-300 disabled:cursor-not-allowed">{homologandoId === idRegisto ? <Loader2 size={12} className="animate-spin inline"/> : 'Aprovar Férias'}</button></td>
                             </tr>
                          )})}
                        </tbody>
                     </table></div>
                  </div>
               )}

               {/* 2. GANTT COMPARTILHADO */}
               <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter">Escala de Férias</h3>
                    <button onClick={() => setShowFeriasModal(true)} className="bg-amber-500 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md transition-all"><Plus size={16}/> Lançamento Direto</button>
                  </div>
                  
                  {/* Chama o componente Gantt que construímos */}
                  <GanttViewer feriasData={appData.ferias || []} />
               </div>
            </div>
         );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64 md:w-72' : 'w-20 md:w-24'} bg-slate-950 text-white transition-all duration-300 flex flex-col z-40 shadow-2xl border-r border-white/5`}>
         <div className="p-6 md:p-8 h-20 md:h-24 flex items-center border-b border-white/5">{sidebarOpen && <div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"><Plane size={20}/></div><span className="font-black text-lg md:text-xl uppercase tracking-tighter">SGA-Enf</span></div>}<button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-all"><Menu size={20} className="text-slate-400"/></button></div>
         <nav className="flex-1 py-6 px-3 md:px-4 space-y-2 overflow-y-auto">
            {/* Menu da Chefia */}
            {[ { id: 'dashboard', label: 'Início', icon: LayoutDashboard }, { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: (appData.atestados||[]).filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'permutas', label: 'Permutas', icon: ArrowRightLeft, badge: (appData.permutas||[]).filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'ferias', label: 'Férias', icon: Sun, badge: (appData.ferias||[]).filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'efetivo', label: 'Efetivo', icon: Users }, { id: 'absenteismo', label: 'Absenteísmo', icon: TrendingDown } ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-3.5 md:p-4 rounded-2xl transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                 <div className="relative"><item.icon size={20}/>{item.badge > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-black">{item.badge}</span>}</div>{sidebarOpen && <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{item.label}</span>}</button>
            ))}
         </nav>
         <div className="p-4 md:p-6 border-t border-white/5 flex flex-col items-center gap-3">
            {sidebarOpen && <div className="text-center w-full"><div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-black shadow-md bg-slate-800 text-white border border-slate-700 mb-2">{user.substring(0,2).toUpperCase()}</div><p className="font-black text-xs tracking-tight truncate w-full uppercase">{user}</p><p className="text-[8px] text-blue-400 uppercase font-bold tracking-widest">{role}</p></div>}
            <button onClick={() => setShowPassModal(true)} className="flex items-center justify-center gap-3 text-slate-500 hover:text-blue-500 font-black text-[10px] uppercase tracking-widest w-full p-2.5 rounded-xl hover:bg-white/5 transition-all"><Key size={16}/> {sidebarOpen && 'Trocar Senha'}</button>
            <button onClick={onLogout} className="flex items-center justify-center gap-3 text-slate-500 hover:text-red-400 font-black text-[10px] uppercase tracking-widest w-full p-2.5 rounded-xl hover:bg-white/5 transition-all"><LogOut size={16}/> {sidebarOpen && 'Sair do Sistema'}</button>
         </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-10 bg-slate-50/50 relative z-10">
         <header className="flex justify-between items-end mb-8 md:mb-10 border-b border-slate-200 pb-6 md:pb-8"><div className="space-y-1"><h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab}</h2><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p></div><button onClick={() => syncData(true)} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-blue-600 hover:bg-slate-50 active:scale-95 transition-all"><RefreshCw size={20} className={isSyncing?'animate-spin':''}/></button></header>
         {renderContent()}

         {/* Lançamento direto pela Chefia (Modais Adicionais) */}
         {showOfficerModal && (
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
                          <button key={local} type="button" onClick={() => handleToggleExpediente(local)} className={`py-2 px-1 rounded-xl text-[8px] font-black transition-all border ${ (formOfficer.expediente || []).includes(local) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300' }`}>
                             {local}
                          </button>
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

         {/* Lançamento de Férias Direto (Admin pula homologação) */}
         {showFeriasModal && <Modal title="Lançar Férias (Chefia)" onClose={() => setShowFeriasModal(false)}><form onSubmit={(e)=>{e.preventDefault(); sendData('saveFerias',{id:Date.now().toString(),status:'Homologado',militar:formFerias.militar,inicio:formFerias.inicio,dias:formFerias.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Militar</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormFerias({...formFerias,militar:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormFerias({...formFerias,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Total de Dias</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 cursor-pointer" onChange={e=>setFormFerias({...formFerias,dias:e.target.value})}><option value="">Selecione o parcelamento...</option><option value="10">10 dias</option><option value="15">15 dias</option><option value="20">20 dias</option><option value="30">30 dias</option></select></div><button disabled={isSaving} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest">{isSaving?"A Enviar...":"Salvar e Homologar"}</button></form></Modal>}

         {showAtestadoModal && <Modal title="Lançar Atestado (Chefia)" onClose={() => { setShowAtestadoModal(false); setFileData(null); }}><form onSubmit={(e)=>{e.preventDefault(); sendData('saveAtestado',{id:Date.now().toString(),status:'Homologado',militar:formAtestado.militar,inicio:formAtestado.inicio,dias:formAtestado.dias,data:formAtestado.inicio,file:fileData});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Militar</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormAtestado({...formAtestado,militar:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormAtestado({...formAtestado,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Dias</label><input type="number" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormAtestado({...formAtestado,dias:e.target.value})}/></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest">{isSaving?"Enviando...":"Gravar e Homologar"}</button></form></Modal>}
         {showPermutaModal && <Modal title="Lançar Permuta (Chefia)" onClose={() => { setShowPermutaModal(false); setFileData(null); }}><form onSubmit={(e)=>{e.preventDefault(); sendData('savePermuta',{id:Date.now().toString(),status:'Homologado',solicitante:formPermuta.solicitante,substituto:formPermuta.sub,datasai:formPermuta.sai,dataentra:formPermuta.entra,file:fileData});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Solicitante (Sai)</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormPermuta({...formPermuta,solicitante:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Substituto (Entra)</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormPermuta({...formPermuta,sub:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Data Saída</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormPermuta({...formPermuta,sai:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Data de Substituição</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormPermuta({...formPermuta,entra:e.target.value})}/></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest">{isSaving?"Enviando...":"Gravar e Homologar"}</button></form></Modal>}
         
         {/* NOVO MODAL: HISTÓRICO DO MILITAR (Acionado pela Tabela de Efetivo) */}
         {historyOfficer && (
            <Modal title={<><History size={18}/> Dossiê: {getVal(historyOfficer,['patente','posto'])} {getVal(historyOfficer,['nome'])}</>} onClose={() => setHistoryOfficer(null)}>
               <div className="space-y-6">
                  {/* Férias */}
                  <div>
                     <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2 border-b border-amber-100 pb-1">Férias</h4>
                     <ul className="space-y-2">
                        {(appData.ferias||[]).filter(f => getVal(f,['militar']) === getVal(historyOfficer,['nome'])).length > 0 ? 
                           (appData.ferias||[]).filter(f => getVal(f,['militar']) === getVal(historyOfficer,['nome'])).map((f, i) => (
                              <li key={i} className="flex justify-between items-center text-xs bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                                 <span className="font-bold text-slate-700">{formatDate(getVal(f,['inicio', 'data']))} <span className="text-[9px] text-slate-400 font-mono">({getVal(f,['dias'])}d)</span></span>
                                 <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${getVal(f,['status'])==='Pendente' ? 'bg-amber-200 text-amber-800' : 'bg-green-100 text-green-700'}`}>{getVal(f,['status']) || 'Homologado'}</span>
                              </li>
                           )) : <li className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nenhum registo</li>}
                     </ul>
                  </div>
                  {/* Atestados */}
                  <div>
                     <h4 className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2 border-b border-red-100 pb-1">Atestados Médicos</h4>
                     <ul className="space-y-2">
                        {(appData.atestados||[]).filter(a => getVal(a,['militar']) === getVal(historyOfficer,['nome'])).length > 0 ? 
                           (appData.atestados||[]).filter(a => getVal(a,['militar']) === getVal(historyOfficer,['nome'])).map((a, i) => (
                              <li key={i} className="flex justify-between items-center text-xs bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                                 <span className="font-bold text-slate-700">{formatDate(getVal(a,['inicio', 'data']))} <span className="text-[9px] text-slate-400 font-mono">({getVal(a,['dias'])}d)</span></span>
                                 <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${getVal(a,['status'])==='Pendente' ? 'bg-amber-200 text-amber-800' : 'bg-green-100 text-green-700'}`}>{getVal(a,['status'])}</span>
                              </li>
                           )) : <li className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nenhum registo</li>}
                     </ul>
                  </div>
                  {/* Permutas */}
                  <div>
                     <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 border-b border-indigo-100 pb-1">Permutas (Como Solicitante)</h4>
                     <ul className="space-y-2">
                        {(appData.permutas||[]).filter(p => getVal(p,['solicitante']) === getVal(historyOfficer,['nome'])).length > 0 ? 
                           (appData.permutas||[]).filter(p => getVal(p,['solicitante']) === getVal(historyOfficer,['nome'])).map((p, i) => (
                              <li key={i} className="flex flex-col text-xs bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50 gap-1">
                                 <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-700">Substituto: {getVal(p,['substituto'])}</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${getVal(p,['status'])==='Pendente' ? 'bg-amber-200 text-amber-800' : 'bg-green-100 text-green-700'}`}>{getVal(p,['status'])}</span>
                                 </div>
                                 <span className="text-[9px] text-slate-500 font-mono">S: {formatDate(getVal(p,['sai']))} / E: {formatDate(getVal(p,['entra']))}</span>
                              </li>
                           )) : <li className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nenhum registo</li>}
                     </ul>
                  </div>
               </div>
            </Modal>
         )}
      </main>
    </div>
  );
};

// --- APP ENTRY COM LOGIN E CACHE SEGURO ---

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('sga_app_user') || null);
  const [role, setRole] = useState(() => localStorage.getItem('sga_app_role') || null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  
  const [appData, setAppData] = useState(() => {
    try {
      const cached = localStorage.getItem('sga_app_cache');
      if (cached) return JSON.parse(cached);
    } catch(e) {}
    return { officers: [], atestados: [], permutas: [], ferias: [], upi: {leitosOcupados: 0, mediaBraden: 0, mediaFugulin: 0, dataReferencia: '--'} };
  });

  const fetchSafeJSON = async (url) => {
     try {
       const res = await fetch(url);
       const text = await res.text();
       if (text.trim().startsWith('<')) throw new Error("Acesso negado (HTML). Verifique se o Apps Script foi implantado como 'Qualquer pessoa'.");
       return JSON.parse(text);
     } catch (e) {
       console.warn("Fetch falhou:", e);
       return null;
     }
  };

  const syncData = async (showFeedback = false) => {
    setIsSyncing(true);
    setSyncError("");
    try {
      const resG = await fetchSafeJSON(`${API_URL_GESTAO}?action=getData`);
      if (!resG) throw new Error("Falha na sincronização. A Google não enviou os dados.");

      const newData = {
        officers: Array.isArray(resG.officers) ? resG.officers : [],
        atestados: Array.isArray(resG.atestados) ? resG.atestados : [],
        permutas: Array.isArray(resG.permutas) ? resG.permutas : [],
        ferias: Array.isArray(resG.ferias) ? resG.ferias : [], 
        upi: {
          leitosOcupados: getVal(resG.upiStats, ['ocupacao', 'ocupados', 'leito']) || 0,
          mediaBraden: safeParseFloat(getVal(resG.upiStats, ['braden'])),
          mediaFugulin: safeParseFloat(getVal(resG.upiStats, ['fugulin', 'fugulim'])),
          dataReferencia: getVal(resG.upiStats, ['data', 'ref']) || new Date().toLocaleDateString('pt-BR')
        }
      };
      
      setAppData(newData);
      localStorage.setItem('sga_app_cache', JSON.stringify(newData));
      if (showFeedback) alert("Sistema Atualizado!");
    } catch(e) {
      setSyncError(e.message);
      if (showFeedback) alert(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { syncData(); }, []);

  const handleLogin = (u, r) => { 
    setUser(u); 
    setRole(r); 
    localStorage.setItem('sga_app_user', u);
    localStorage.setItem('sga_app_role', r);
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('sga_app_user');
    localStorage.removeItem('sga_app_role');
  }
  
  return (
    <ErrorBoundary>
      {!user ? (
        <LoginScreen onLogin={handleLogin} appData={appData} isSyncing={isSyncing} syncError={syncError} onForceSync={() => syncData(true)} />
      ) : role === 'admin' || role === 'rt' ? (
        <MainSystem user={user} role={role} onLogout={handleLogout} appData={appData} syncData={syncData} isSyncing={isSyncing} />
      ) : (
        <UserDashboard user={user} onLogout={handleLogout} appData={appData} syncData={syncData} isSyncing={isSyncing} />
      )}
    </ErrorBoundary>
  );
}
