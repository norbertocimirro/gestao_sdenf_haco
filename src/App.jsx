import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Cake, BookOpen, Plus, Trash2, Edit3, 
  UserPlus, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, Thermometer, TrendingDown, Plane, CheckSquare, Square,
  ChevronUp, ChevronDown, ChevronsUpDown
} from 'lucide-react';

// --- CONFIGURAÇÃO DE CONEXÃO ---
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 
const API_URL_INDICADORES = "https://script.google.com/macros/s/AKfycbxJp8-2qRibag95GfPnazUNWC-EdA8VUFYecZHg9Pp1hl5OlR3kofF-HbElRYCGcdv0/exec"; 

const LOCAIS_EXPEDIENTE = ["SDENF", "FUNSA", "CAIS", "UCC", "UPA", "UTI", "UPI", "SAD", "SSOP", "SIL", "FERISTA"];
const LOCAIS_SERVICO = ["UTI", "UPI"];

// --- HELPERS DE SEGURANÇA ---

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
  if (!value) return 0;
  const num = parseFloat(String(value).replace(',', '.'));
  return isNaN(num) ? 0 : num;
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

// --- COMPONENTES VISUAIS ---

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-fadeIn border border-slate-200">
      <div className="p-5 border-b flex justify-between items-center bg-slate-50">
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><CloseIcon size={20}/></button>
      </div>
      <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

// MOTOR DE COMPRESSÃO DE IMAGENS
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
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
        onFileSelect(compressedFile); setFileName(`✅ Imagem pronta (${file.name})`);
      } else if (file.type === 'application/pdf') {
        if (file.size > 10 * 1024 * 1024) { alert("O PDF excede 10MB. Envie um mais leve."); e.target.value = ""; setIsProcessing(false); setFileName(""); return; }
        const reader = new FileReader();
        reader.onloadend = () => { onFileSelect({ name: file.name, type: file.type, base64: reader.result.split(',')[1] }); setFileName(`✅ PDF anexado (${file.name})`); };
        reader.readAsDataURL(file);
      } else { alert("Apenas PDF ou Imagens (Fotos)."); e.target.value = ""; setFileName(""); }
    } catch (err) { alert("Erro ao processar ficheiro."); setFileName(""); } 
    finally { setIsProcessing(false); }
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl relative overflow-hidden transition-all hover:bg-slate-100">
      <div className="flex items-center gap-3 mb-2"><Paperclip size={16} className="text-slate-500"/><label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">Anexar Documento / Foto</label></div>
      <input type="file" accept="image/*,application/pdf" onChange={handleChange} disabled={isProcessing} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
      {isProcessing && <div className="absolute inset-0 bg-white/80 flex items-center justify-center gap-2 text-blue-600 font-bold text-xs"><Loader2 size={16} className="animate-spin"/> Comprimindo arquivo...</div>}
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
              <div className="flex-1"><p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{getVal(p, ['patente', 'posto'])} {getVal(p, ['nome'])}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{getVal(p, ['setor'])}</p></div>
           </div>
        ))}
        {birthdays.length === 0 && <p className="text-center py-6 text-slate-400 text-[10px] font-black uppercase tracking-widest">Nenhum aniversariante</p>}
      </div>
    </div>
  );
};

// --- ÁREA DE LOGIN ---

const LoginScreen = ({ onLogin, appData, isSyncing, syncError, onForceSync }) => {
  const [roleGroup, setRoleGroup] = useState('chefia');
  const [user, setUser] = useState('');
  
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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {isSyncing && <div className="absolute top-6 right-6 flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-900/30 px-4 py-2 rounded-full border border-blue-800/50"><Loader2 size={14} className="animate-spin"/> Conectando...</div>}
      
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 relative z-10">
        <div className="text-center mb-8">
           <div className="bg-blue-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
              <Plane size={32} className="text-white transform -rotate-12"/>
           </div>
           <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">SGA-Enf HACO</h1>
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] mt-1">Gestão de Enfermagem</p>
        </div>
        
        {syncError && (
           <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-6 border border-red-100 flex items-center justify-between">
              <span>⚠️ Falha na Leitura</span>
              <button onClick={onForceSync} className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700">Tentar Novamente</button>
           </div>
        )}

        <div className="bg-slate-100 p-1.5 rounded-2xl flex mb-6">
           <button onClick={() => setRoleGroup('chefia')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${roleGroup === 'chefia' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Chefia / RT</button>
           <button onClick={() => setRoleGroup('tropa')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${roleGroup === 'tropa' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}>Oficiais</button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Identificação do Militar</label>
            <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none cursor-pointer" value={user} onChange={e => setUser(e.target.value)}>
               <option value="">{isSyncing && list.length === 0 ? "A ler dados..." : "Escolha o seu nome..."}</option>
               {filtered.map((o, idx) => (<option key={idx} value={getVal(o, ['nome'])}>{getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}</option>))}
               {!isSyncing && list.length === 0 && <option value="" disabled>Banco de Dados Vazio.</option>}
            </select>
          </div>

          <button 
             onClick={() => {
                const selectedUser = list.find(o => getVal(o, ['nome']) === user);
                if (selectedUser) {
                   const nome = getVal(selectedUser, ['nome']);
                   let role = getVal(selectedUser, ['role']) || 'user';
                   if (nome.includes('Cimirro') || nome.includes('Zanini')) role = 'admin';
                   onLogin(nome, role);
                }
             }} 
             disabled={!user || isSyncing} 
             className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 ${user ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/40' : 'bg-slate-300 cursor-not-allowed'}`}
          >
             Entrar no Sistema
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ÁREA DO OFICIAL (TROPA) ---

const UserDashboard = ({ user, onLogout, appData, syncData, isSyncing }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [modals, setModals] = useState({ atestado: false, permuta: false });
  const [form, setForm] = useState({ dias: '', inicio: '', sub: '', sai: '', entra: '' });
  const [fileData, setFileData] = useState(null);

  const atestadosFiltrados = (appData.atestados || []).filter(a => String(getVal(a, ['militar'])).includes(user)).reverse();
  const permutasFiltradas = (appData.permutas || []).filter(p => String(getVal(p, ['solicitante'])).includes(user)).reverse();

  const handleSend = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload: { ...payload, file: fileData } }) });
      setTimeout(() => { setIsSaving(false); setModals({ atestado: false, permuta: false }); setFileData(null); syncData(); }, 1500);
    } catch(e) { setIsSaving(false); alert("Erro ao enviar. Verifique a conexão."); }
  };

  const closeModals = () => { setModals({ atestado: false, permuta: false }); setFileData(null); }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-md text-xl">HA</div>
          <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-tighter">Ten {user}</h1><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Painel Individual</p></div>
        </div>
        <button onClick={onLogout} className="bg-slate-100 p-2.5 rounded-xl text-slate-400 hover:text-red-500 transition-all active:scale-90"><LogOut size={16}/></button>
      </header>
      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-5">
        <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden"><h2 className="text-xl font-black uppercase tracking-tighter relative z-10">Mural</h2><Plane className="absolute -bottom-4 -right-4 text-white/10" size={100}/></div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setModals({...modals, atestado: true})} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all"><ShieldAlert size={20}/></div><span className="font-black text-[9px] uppercase text-slate-700 tracking-widest">Atestado</span></button>
          <button onClick={() => setModals({...modals, permuta: true})} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><ArrowRightLeft size={20}/></div><span className="font-black text-[9px] uppercase text-slate-700 tracking-widest">Permuta</span></button>
        </div>
        <div className="pt-4"><h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-3 flex justify-between items-center">Meus Registros <button onClick={()=>syncData(true)} className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm active:scale-90"><RefreshCw size={12} className={isSyncing?'animate-spin text-blue-600':''}/></button></h3>
          <div className="space-y-2">
            {[...permutasFiltradas, ...atestadosFiltrados].map((item, i) => {
              const anexoUrl = getVal(item, ['anexo', 'arquivo', 'documento', 'url', 'link']);
              return (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div className="text-xs">
                  <p className="font-black text-slate-800 uppercase text-[10px] mb-1">{getVal(item,['substituto']) ? `Troca: ${getVal(item,['substituto'])}` : `Afastamento: ${getVal(item,['dias'])}d`}</p>
                  <div className="flex gap-2 font-bold text-slate-400 text-[8px] uppercase tracking-widest items-center">
                    <span className="bg-slate-50 px-2 py-1 rounded">{formatDate(getVal(item,['inicio', 'data', 'sai', 'datasai']))}</span>
                    {getVal(item,['substituto']) && <span className="bg-slate-50 px-2 py-1 rounded flex items-center gap-1"><ArrowRightLeft size={8}/>{formatDate(getVal(item,['entra', 'dataentra']))}</span>}
                    {anexoUrl && <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 hover:text-blue-700"><Paperclip size={8}/> Anexo</a>}
                  </div>
                </div>
                <span className={`text-[8px] px-2 py-1 rounded-md font-black uppercase tracking-widest ${getVal(item,['status'])==='Homologado'?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>{getVal(item,['status'])}</span>
              </div>
            )})}
            {(permutasFiltradas.length === 0 && atestadosFiltrados.length === 0) && <p className="text-center text-[10px] text-slate-400 font-bold py-6 uppercase border border-dashed rounded-2xl">Sem registos recentes</p>}
          </div>
        </div>
      </main>

      {/* MODAIS USER */}
      {modals.atestado && <Modal title="Anexar Atestado" onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveAtestado',{id: Date.now().toString(), status:'Pendente', militar:user, inicio:form.inicio, dias:form.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Total de Dias</label><input type="number" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,dias:e.target.value})}/></div><FileUpload onFileSelect={setFileData} /><button disabled={isSaving} className="w-full py-4 bg-red-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Protocolar Pedido"}</button></form></Modal>}
      {modals.permuta && <Modal title="Pedir Permuta" onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('savePermuta',{id: Date.now().toString(), status:'Pendente', solicitante:user, substituto:form.sub, datasai:form.sai, dataentra:form.entra});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data de Saída</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,sai:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Militar Substituto</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,sub:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data de Retorno</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,entra:e.target.value})}/></div><FileUpload onFileSelect={setFileData} /><button disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Solicitar Troca"}</button></form></Modal>}
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
  const [formOfficer, setFormOfficer] = useState({ expediente: [], servico: '' });
  
  const [sortConfig, setSortConfig] = useState({ key: 'antiguidade', direction: 'asc' });

  // Disparo genérico para salvar dados simples
  const sendData = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload }) });
      setTimeout(() => { setIsSaving(false); setShowOfficerModal(false); syncData(true); }, 1500); 
    } catch (e) { setIsSaving(false); alert("Falha na gravação."); }
  };

  // Disparo Visual Seguro para o Botão Homologar
  const handleHomologar = async (id, sheetName) => {
    if (!id) {
       alert("ERRO DE PLANILHA: Este registo não possui um 'id' salvo no Google Sheets. Crie a coluna 'id' ou aprove diretamente na planilha.");
       return;
    }
    setHomologandoId(id); // Trava o botão visualmente
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                <div className="md:col-span-4 bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center border border-slate-800 relative overflow-hidden gap-6">
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
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 flex flex-col items-center justify-center group shadow-sm hover:border-red-200 transition-all">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 group-hover:text-red-500 transition-colors">Pendentes</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{(appData.atestados||[]).filter(x=>getVal(x,['status'])==='Pendente').length + (appData.permutas||[]).filter(x=>getVal(x,['status'])==='Pendente').length}</h3>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 flex flex-col items-center justify-center group shadow-sm hover:border-blue-200 transition-all">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 group-hover:text-blue-600 transition-colors">Efetivo</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{(appData.officers||[]).length}</h3>
                </div>
                <div className="md:col-span-2 row-span-2 shadow-sm border border-slate-200 rounded-3xl bg-white overflow-hidden flex flex-col min-h-[250px]"><BirthdayWidget staff={appData.officers}/></div>
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
                <button onClick={() => { setFormOfficer({ expediente: [], servico: '' }); setShowOfficerModal(true); }} className="bg-blue-600 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-md transition-all"><UserPlus size={16}/> Incluir Oficial</button>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm font-sans min-w-[800px]"><thead className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr><SortableHeader label="Ant." sortKey="antiguidade" align="center" /><SortableHeader label="Posto/Nome" sortKey="nome" /><SortableHeader label="Alocação" sortKey="expediente" /><SortableHeader label="Idade" sortKey="idade" align="center" /><SortableHeader label="Praça/Serviço" sortKey="ingresso" align="center" /><th className="p-3 md:p-4 text-right">Ação</th></tr>
                  </thead><tbody className="divide-y divide-slate-50">
                    {sortedOfficers.map((o, i) => {
                      const tIdade = calculateDetailedTime(getVal(o, ['nasc']));
                      const tServico = calculateDetailedTime(getVal(o, ['ingres']));
                      const expedientes = String(getVal(o, ['expediente']) || "").split(',').map(x => x.trim()).filter(x => x !== "");
                      
                      return (
                      <tr key={i} className="hover:bg-slate-50/80 group transition-colors">
                        <td className="p-3 md:p-4 text-center text-slate-300 font-black text-base">{getVal(o, ['antiguidade'])}</td>
                        <td className="p-3 md:p-4"><div className="flex flex-col"><span className="font-black text-slate-800 uppercase tracking-tighter text-xs md:text-sm">{getVal(o,['patente','posto'])} {getVal(o,['nome'])}</span><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(getVal(o,['nasc']))}</span></div></td>
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
         return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
               <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter mb-6">Gestão de Atestados</h3>
               <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Militar</th><th className="p-4 text-center">Dias</th><th className="p-4">Início</th><th className="p-4 text-center">Anexo</th><th className="p-4">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {(appData.atestados||[]).map((a, i) => {
                      const anexoUrl = getVal(a, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                      const idRegisto = getVal(a, ['id', 'identificador']);
                      return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-800 text-xs md:text-sm font-black tracking-tighter uppercase">{getVal(a,['militar'])}</td>
                        <td className="p-4 text-center text-slate-500 font-bold text-xs">{getVal(a,['dias'])}d</td>
                        <td className="p-4 text-[10px] font-mono font-bold text-slate-400">{formatDate(getVal(a,['inicio', 'data']))}</td>
                        <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors" title="Visualizar Anexo"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-md text-[8px] font-black tracking-widest uppercase ${getVal(a,['status']) === 'Homologado' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{getVal(a,['status'])}</span></td>
                        <td className="p-4 text-right">{getVal(a,['status']) === 'Pendente' && <button onClick={()=>handleHomologar(idRegisto, 'Atestados')} disabled={homologandoId === idRegisto} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:bg-blue-300 disabled:cursor-not-allowed">{homologandoId === idRegisto ? <Loader2 size={12} className="animate-spin inline"/> : 'Homologar'}</button>}</td>
                      </tr>
                    )})}
                    {(appData.atestados||[]).length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">Sem registos recentes</td></tr>}
                  </tbody>
                </table></div>
            </div>
         );
      case 'permutas':
         return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 animate-fadeIn">
               <h3 className="font-black text-slate-800 text-lg md:text-xl uppercase tracking-tighter mb-6">Permutas Solicitadas</h3>
               <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Solicitante</th><th className="p-4">Substituto</th><th className="p-4">Período (S / E)</th><th className="p-4 text-center">Anexo</th><th className="p-4">Status</th><th className="p-4 text-right">Ação</th></tr></thead>
                 <tbody className="divide-y divide-slate-50">
                   {(appData.permutas||[]).map((p, idx) => {
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
                   {(appData.permutas||[]).length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-300 font-bold text-xs uppercase tracking-widest">Nenhuma permuta registada</td></tr>}
                 </tbody>
               </table></div>
            </div>
         );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64 md:w-72' : 'w-20 md:w-24'} bg-slate-950 text-white transition-all duration-300 flex flex-col z-20 shadow-2xl border-r border-white/5`}>
         <div className="p-6 md:p-8 h-20 md:h-24 flex items-center border-b border-white/5">{sidebarOpen && <div className="flex items-center gap-3"><div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"><Plane size={20}/></div><span className="font-black text-lg md:text-xl uppercase tracking-tighter">SGA-Enf</span></div>}<button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-all"><Menu size={20} className="text-slate-400"/></button></div>
         <nav className="flex-1 py-6 px-3 md:px-4 space-y-2 overflow-y-auto">
            {[ { id: 'dashboard', label: 'Início', icon: LayoutDashboard }, { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: (appData.atestados||[]).filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'permutas', label: 'Permutas', icon: ArrowRightLeft, badge: (appData.permutas||[]).filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'efetivo', label: 'Efetivo Oficiais', icon: Users } ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-3.5 md:p-4 rounded-2xl transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                 <div className="relative"><item.icon size={20}/>{item.badge > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-black">{item.badge}</span>}</div>{sidebarOpen && <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{item.label}</span>}</button>
            ))}
         </nav>
         <div className="p-4 md:p-6 border-t border-white/5 flex flex-col items-center gap-4">
            {sidebarOpen && <div className="text-center w-full"><div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-black shadow-md bg-slate-800 text-white border border-slate-700 mb-2">{user.substring(0,2).toUpperCase()}</div><p className="font-black text-xs tracking-tight truncate w-full uppercase">{user}</p><p className="text-[8px] text-blue-400 uppercase font-bold tracking-widest">{role}</p></div>}
            <button onClick={onLogout} className="flex items-center justify-center gap-3 text-slate-500 hover:text-red-400 font-black text-[10px] uppercase tracking-widest w-full p-3 rounded-xl hover:bg-white/5 transition-all"><LogOut size={18}/> {sidebarOpen && 'Sair'}</button>
         </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-10 bg-slate-50/50">
         <header className="flex justify-between items-end mb-8 md:mb-10 border-b border-slate-200 pb-6 md:pb-8"><div className="space-y-1"><h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab}</h2><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p></div><button onClick={() => syncData(true)} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-blue-600 hover:bg-slate-50 active:scale-95 transition-all"><RefreshCw size={20} className={isSyncing?'animate-spin':''}/></button></header>
         {renderContent()}

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
      </main>
    </div>
  );
};

// --- APP ENTRY COM LOGIN E CACHE ---

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  
  const [appData, setAppData] = useState(() => {
    try {
      const cached = localStorage.getItem('sga_app_cache');
      if (cached) return JSON.parse(cached);
    } catch(e) {}
    return { officers: [], atestados: [], permutas: [], upi: {leitosOcupados: 0, mediaBraden: 0, mediaFugulin: 0, dataReferencia: '--'} };
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
      const [resG, resI] = await Promise.all([
        fetchSafeJSON(`${API_URL_GESTAO}?action=getData`),
        fetchSafeJSON(`${API_URL_INDICADORES}?action=getData`)
      ]);
      
      if (!resG) throw new Error("Falha na sincronização. A Google não enviou os dados.");

      const newData = {
        officers: Array.isArray(resG.officers) ? resG.officers : [],
        atestados: Array.isArray(resG.atestados) ? resG.atestados : [],
        permutas: Array.isArray(resG.permutas) ? resG.permutas : [],
        upi: {
          leitosOcupados: getVal(resI?.upiStats || {}, ['ocupado', 'leito']) || 0,
          mediaBraden: safeParseFloat(getVal(resI?.upiStats || {}, ['braden'])),
          mediaFugulin: safeParseFloat(getVal(resI?.upiStats || {}, ['fugulin'])),
          dataReferencia: getVal(resI?.upiStats || {}, ['data', 'ref']) || '--'
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

  const handleLogin = (u, r) => { setUser(u); setRole(r); };
  
  return (
    <ErrorBoundary>
      {!user ? (
        <LoginScreen onLogin={handleLogin} appData={appData} isSyncing={isSyncing} syncError={syncError} onForceSync={() => syncData(true)} />
      ) : role === 'admin' || role === 'rt' ? (
        <MainSystem user={user} role={role} onLogout={() => setUser(null)} globalOfficers={appData.officers} appData={appData} syncData={syncData} isSyncing={isSyncing} />
      ) : (
        <UserDashboard user={user} onLogout={() => setUser(null)} appData={appData} syncData={syncData} isSyncing={isSyncing} />
      )}
    </ErrorBoundary>
  );
}
