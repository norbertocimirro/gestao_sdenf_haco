import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Cake, BookOpen, Plus, Trash2, Edit3, 
  UserPlus, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, Thermometer, TrendingDown, Plane, Calendar, Clock
} from 'lucide-react';

// --- CONFIGURAÇÃO DE CONEXÃO ---
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 
const API_URL_INDICADORES = "https://script.google.com/macros/s/AKfycbxJp8-2qRibag95GfPnazUNWC-EdA8VUFYecZHg9Pp1hl5OlR3kofF-HbElRYCGcdv0/exec"; 

// --- HELPERS DE DADOS ---

const getVal = (obj, searchTerms) => {
  if (!obj || typeof obj !== 'object') return "";
  const keys = Object.keys(obj);
  const foundKey = keys.find(k => 
    searchTerms.some(term => k.toLowerCase().trim() === term.toLowerCase().trim()) ||
    searchTerms.some(term => k.toLowerCase().includes(term.toLowerCase()))
  );
  return foundKey ? obj[foundKey] : "";
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s || s === "-") return null;

  try {
    // Formato DD/MM/YYYY
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
      }
    }
    // Formato YYYY-MM-DD
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-');
      if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
};

const formatDate = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return "-";
  return date.toLocaleDateString('pt-BR');
};

const calculateDetailedTime = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return { y: 0, m: 0, d: 0, invalid: true };
  
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
  
  return { 
    y: isNaN(y) ? 0 : y, 
    m: isNaN(m) ? 0 : m, 
    d: isNaN(d) ? 0 : d,
    invalid: false 
  };
};

const safeParseFloat = (value) => {
  if (!value) return 0;
  const num = parseFloat(String(value).replace(',', '.'));
  return isNaN(num) ? 0 : num;
};

// --- COMPONENTES ---

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn border border-slate-200">
      <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><CloseIcon size={20}/></button>
      </div>
      <div className="p-8 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const BirthdayWidget = ({ staff }) => {
  if (!Array.isArray(staff)) return null;
  const today = new Date();
  const currentMonth = today.getMonth();
  
  const birthdays = staff.filter(p => {
    const d = parseDate(getVal(p, ['nasc']));
    return d && d.getMonth() === currentMonth;
  }).sort((a, b) => {
    const dayA = parseDate(getVal(a, ['nasc'])).getDate();
    const dayB = parseDate(getVal(b, ['nasc'])).getDate();
    return dayA - dayB;
  });

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full font-sans">
      <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 text-white flex justify-between items-center">
        <h3 className="font-black flex items-center gap-2 text-[10px] uppercase tracking-widest"><Cake size={16} /> Aniversários do Mês</h3>
      </div>
      <div className="p-4 flex-1 overflow-y-auto max-h-[300px] space-y-2">
        {birthdays.map((p, i) => (
           <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-sm font-black">
                 {parseDate(getVal(p, ['nasc'])).getDate()}
              </div>
              <div className="flex-1">
                 <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{getVal(p, ['patente', 'posto'])} {getVal(p, ['nome'])}</p>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{getVal(p, ['setor'])}</p>
              </div>
           </div>
        ))}
        {birthdays.length === 0 && <p className="text-center py-8 text-slate-400 text-[10px] font-black uppercase tracking-widest">Nenhum registo</p>}
      </div>
    </div>
  );
};

// --- ÁREA DE LOGIN ---

const LoginScreen = ({ onLogin, officersList, isLoading }) => {
  const [roleGroup, setRoleGroup] = useState('chefia');
  const [user, setUser] = useState('');
  
  const list = Array.isArray(officersList) ? officersList : [];

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
           <div className="bg-blue-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/40">
              <Plane size={32} className="text-white transform -rotate-12"/>
           </div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tighter">SGA-Enf HACO</h1>
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Hospital de Aeronáutica de Canoas</p>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
           <button onClick={() => setRoleGroup('chefia')} className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${roleGroup === 'chefia' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Chefia / RT</button>
           <button onClick={() => setRoleGroup('tropa')} className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${roleGroup === 'tropa' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}>Oficiais</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Identificação do Militar</label>
            <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer" value={user} onChange={e => setUser(e.target.value)}>
               <option value="">{isLoading ? "A carregar dados..." : "Escolha o seu nome..."}</option>
               {filtered.map((o, idx) => (
                 <option key={idx} value={getVal(o, ['nome'])}>
                   {getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}
                 </option>
               ))}
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
             disabled={!user || isLoading} 
             className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 ${user ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/40' : 'bg-slate-300 cursor-not-allowed'}`}
          >
             {isLoading ? "Sincronizando..." : "Entrar no Sistema"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ÁREA DO OFICIAL (USER) ---

const UserDashboard = ({ user, onLogout }) => {
  const [data, setData] = useState({ atestados: [], permutas: [], officers: [] });
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modals, setModals] = useState({ atestado: false, permuta: false });
  const [form, setForm] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL_GESTAO}?action=getData`);
      const resData = await res.json();
      setData({
        atestados: Array.isArray(resData.atestados) ? resData.atestados.filter(a => String(getVal(a, ['militar'])).includes(user)).reverse() : [],
        permutas: Array.isArray(resData.permutas) ? resData.permutas.filter(p => String(getVal(p, ['solicitante'])).includes(user)).reverse() : [],
        officers: resData.officers || []
      });
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSend = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action, payload }) });
      setTimeout(() => { setIsSaving(false); setModals({ atestado: false, permuta: false }); fetchData(); }, 2000);
    } catch(e) { setIsSaving(false); alert("Erro ao enviar."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg">HA</div>
          <div><h1 className="font-black text-slate-800 text-sm uppercase tracking-tighter">Ten {user}</h1><p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Acesso Individual</p></div>
        </div>
        <button onClick={onLogout} className="bg-slate-100 p-2.5 rounded-xl text-slate-400 hover:text-red-500 transition-all"><LogOut size={18}/></button>
      </header>
      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-6">
        <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
           <h2 className="text-xl font-black uppercase tracking-tighter relative z-10">Solicitações</h2>
           <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest relative z-10">Mural de Pedidos</p>
           <Plane className="absolute -bottom-6 -right-6 text-white/10" size={120}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setModals({...modals, atestado: true})} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center gap-3 hover:shadow-xl transition-all group active:scale-95"><div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all"><ShieldAlert size={24}/></div><span className="font-black text-[9px] uppercase tracking-widest text-slate-600">Atestado</span></button>
          <button onClick={() => setModals({...modals, permuta: true})} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center gap-3 hover:shadow-xl transition-all group active:scale-95"><div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><ArrowRightLeft size={24}/></div><span className="font-black text-[9px] uppercase tracking-widest text-slate-600">Permuta</span></button>
        </div>
        <div className="pt-6"><h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] mb-4 flex justify-between">Meus Registros <button onClick={fetchData}><RefreshCw size={12} className={loading?'animate-spin':''}/></button></h3>
          <div className="space-y-3">
            {[...data.permutas, ...data.atestados].map((item, i) => (
              <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex justify-between items-center group">
                <div className="text-xs">
                  <p className="font-black text-slate-800 uppercase text-xs mb-1">{getVal(item,['substituto']) ? `Troca: ${getVal(item,['substituto'])}` : `Afastamento: ${getVal(item,['dias'])} dias`}</p>
                  <div className="flex gap-4 font-bold text-slate-400 text-[9px] uppercase">
                    <span>{formatDate(getVal(item,['inicio','data','sai']))}</span>
                    {getVal(item,['substituto']) && <span><ArrowRightLeft size={8} className="inline mr-1"/>{formatDate(getVal(item,['entra','dataentra']))}</span>}
                  </div>
                </div>
                <span className={`text-[8px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${getVal(item,['status'])==='Homologado'?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>{getVal(item,['status'])}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      {modals.atestado && <Modal title="Anexar Atestado" onClose={()=>setModals({...modals, atestado:false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveAtestado',{id:Date.now(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias,data:form.inicio});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Data de Início</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold mt-1 shadow-inner" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Total de Dias</label><input type="number" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold mt-1 shadow-inner" onChange={e=>setForm({...form,dias:e.target.value})}/></div><button disabled={isSaving} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl text-[10px] uppercase tracking-[0.2em]">{isSaving?"Enviando...":"Protocolar Pedido"}</button></form></Modal>}
      {modals.permuta && <Modal title="Pedir Permuta" onClose={()=>setModals({...modals, permuta:false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('savePermuta',{id:Date.now(),status:'Pendente',solicitante:user,substituto:form.sub,datasai:form.sai,dataentra:form.entra});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest">Data que você sai</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold mt-1 shadow-inner" onChange={e=>setForm({...form,sai:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest">Militar Substituto</label><select required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold mt-1 shadow-inner" onChange={e=>setForm({...form,sub:e.target.value})}><option value="">Escolha...</option>{data.officers.map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-2 tracking-widest">Data que você entra</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold mt-1 shadow-inner" onChange={e=>setForm({...form,entra:e.target.value})}/></div><button disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl text-[10px] uppercase tracking-[0.2em]">{isSaving?"Enviando...":"Solicitar Troca"}</button></form></Modal>}
    </div>
  );
};

// --- PAINEL CHEFIA (ADMIN) ---

const MainSystem = ({ user, role, onLogout, globalOfficers, refreshGlobal }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [formOfficer, setFormOfficer] = useState({});
  const [data, setData] = useState({ atestados: [], permutas: [], upi: {leitosOcupados: 0, mediaBraden: 0, mediaFugulin: 0, dataReferencia: '--'} });

  const refreshData = async (showFeedback = true) => {
    setLoading(true);
    try {
      await refreshGlobal(); 
      const r1 = await fetch(`${API_URL_GESTAO}?action=getData`);
      const d1 = await r1.json();
      setData(prev => ({ ...prev, atestados: Array.isArray(d1.atestados) ? d1.atestados : [], permutas: Array.isArray(d1.permutas) ? d1.permutas : [] }));
      
      const r2 = await fetch(`${API_URL_INDICADORES}?action=getData`);
      const d2 = await r2.json();
      if (d2.upiStats) {
         setData(prev => ({ ...prev, upi: {
           leitosOcupados: getVal(d2.upiStats, ['ocupado']) || 0,
           mediaBraden: safeParseFloat(getVal(d2.upiStats, ['braden'])),
           mediaFugulin: safeParseFloat(getVal(d2.upiStats, ['fugulin'])),
           dataReferencia: getVal(d2.upiStats, ['data']) || '--'
         }}));
      }
      if (showFeedback) alert("Banco de Dados Atualizado!");
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };
  
  useEffect(() => { refreshData(false); }, []);

  const sendData = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action, payload }) });
      setTimeout(() => { setIsSaving(false); setShowOfficerModal(false); refreshData(false); }, 2000); 
    } catch (e) { setIsSaving(false); alert("Erro."); }
  };

  const renderContent = () => {
    if (loading) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-blue-600" size={40}/> <p className="font-black text-slate-400 text-xs uppercase tracking-widest">Sincronizando Banco de Dados...</p></div>;
    
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-4 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex justify-between items-center border border-slate-800 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={200}/></div>
                   <div className="flex items-center gap-6 relative z-10"><div className="bg-blue-600 p-4 rounded-[1.5rem] shadow-xl"><Activity size={32}/></div><div><h3 className="text-xl font-black uppercase tracking-tighter">Status UPI</h3><p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Ref: {data.upi.dataReferencia}</p></div></div>
                   <div className="flex gap-10 text-center relative z-10">
                      <div><p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Ocupação</p><p className="text-3xl font-black">{data.upi.leitosOcupados} <span className="text-sm text-slate-700 font-bold">/ 15</span></p></div>
                      <div><p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Braden</p><p className="text-3xl font-black text-yellow-500">{data.upi.mediaBraden.toFixed(1)}</p></div>
                      <div><p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Fugulin</p><p className="text-3xl font-black text-green-500">{data.upi.mediaFugulin.toFixed(1)}</p></div>
                   </div>
                </div>
                <div className="md:col-span-2 row-span-2"><BirthdayWidget staff={globalOfficers}/></div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-center items-center group transition-all hover:border-blue-200"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-blue-600 transition-colors">Pendências</p><h3 className="text-4xl font-black text-slate-800 tracking-tighter">{data.atestados.filter(x=>getVal(x,['status'])==='Pendente').length + data.permutas.filter(x=>getVal(x,['status'])==='Pendente').length}</h3></div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-center items-center group transition-all hover:border-blue-200"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-blue-600 transition-colors">Efetivo</p><h3 className="text-4xl font-black text-slate-800 tracking-tighter">{globalOfficers.length}</h3></div>
            </div>
          </div>
        );
      case 'atestados':
        return (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 animate-fadeIn">
             <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-5">Militar</th><th className="p-5">Duração</th><th className="p-5">Início</th><th className="p-5">Status</th><th className="p-5 text-right">Ação</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                   {data.atestados.map((a, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/50 transition-all font-bold">
                       <td className="p-5 text-slate-800 uppercase tracking-tighter">{getVal(a, ['militar'])}</td>
                       <td className="p-5 text-slate-500">{getVal(a, ['dias'])} d</td>
                       <td className="p-5 text-slate-400 font-mono text-[10px] uppercase">{formatDate(getVal(a, ['inicio', 'data']))}</td>
                       <td className="p-5"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getVal(a, ['status']) === 'Homologado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{getVal(a, ['status'])}</span></td>
                       <td className="p-5 text-right">{getVal(a, ['status']) === 'Pendente' && <button onClick={() => sendData('updateStatus',{sheet:'Atestados',id:getVal(a,['id']),status:'Homologado'})} className="text-blue-600 font-black text-[9px] uppercase tracking-widest hover:underline">Homologar</button>}</td>
                     </tr>
                   ))}
                 </tbody>
               </table></div>
          </div>
        );
      case 'efetivo':
         const sorted = [...globalOfficers].sort((a,b) => (parseInt(getVal(a,['antiguidade'])) || 999) - (parseInt(getVal(b,['antiguidade'])) || 999));
         return (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 animate-fadeIn">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter">Gestão de Efetivo</h3>
                <button onClick={() => { setFormOfficer({}); setShowOfficerModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-xl shadow-blue-500/20"><UserPlus size={16}/> Incluir Oficial</button>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b"><tr><th className="p-4 text-center">Ant.</th><th className="p-4">Posto/Nome</th><th className="p-4 text-center">Idade Detalhada</th><th className="p-4 text-center">Data Praça</th><th className="p-4 text-center">Serviço</th><th className="p-4 text-right">Ação</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {sorted.map((o, i) => {
                      const idade = calculateDetailedTime(getVal(o, ['nasc']));
                      const servico = calculateDetailedTime(getVal(o, ['ingres']));
                      const alertaIdade = idade.y >= 45;
                      const alertaServico = servico.y >= 7;

                      return (
                      <tr key={i} className="hover:bg-slate-50/50 group transition-all">
                        <td className="p-4 text-center text-slate-300 font-black text-lg">{getVal(o, ['antiguidade'])}</td>
                        <td className="p-4 font-black text-slate-800 uppercase tracking-tighter">{getVal(o,['patente','posto'])} {getVal(o,['nome'])}</td>
                        <td className={`p-4 text-center ${alertaIdade ? 'text-red-600 bg-red-50 rounded-xl' : 'text-slate-600'}`}>{idade.invalid ? "-" : `${idade.y}a ${idade.m}m ${idade.d}d`}</td>
                        <td className="p-4 text-center text-slate-400 font-mono text-[10px] uppercase">{formatDate(getVal(o,['ingres']))}</td>
                        <td className={`p-4 text-center ${alertaServico ? 'text-red-600 bg-red-50 rounded-xl' : 'text-slate-600'}`}>{servico.invalid ? "-" : `${servico.y}a ${servico.m}m ${servico.d}d`}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setFormOfficer({ ...o, nome: getVal(o,['nome']), patente: getVal(o,['patente','posto']), antiguidade: getVal(o,['antiguidade']), nascimento: getVal(o,['nasc']), ingresso: getVal(o,['ingres']), role: getVal(o,['role']) }); setShowOfficerModal(true); }} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14}/></button>
                            <button onClick={() => { if(window.confirm(`Apagar ${getVal(o,['nome'])} do sistema?`)) sendData('deleteOfficer', { nome: getVal(o,['nome']) }); }} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table></div>
            </div>
         );
      case 'permutas':
         return (
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-10 animate-fadeIn">
               <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-6">Solicitante</th><th className="p-6">Substituto</th><th className="p-6">Datas</th><th className="p-6">Status</th><th className="p-6 text-right">Ação</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                   {data.permutas.map((p, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 transition-all font-bold text-[10px] uppercase">
                       <td className="p-6 text-slate-800 font-black">{getVal(p, ['solicitante'])}</td>
                       <td className="p-6 text-slate-500">{getVal(p, ['substituto'])}</td>
                       <td className="p-6"><div className="flex gap-4 font-mono"><span className="text-red-500">S: {formatDate(getVal(p,['sai','datasai']))}</span><span className="text-green-600">E: {formatDate(getVal(p,['entra','dataentra']))}</span></div></td>
                       <td className="p-6"><span className={`px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${getVal(p, ['status']) === 'Homologado' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{getVal(p, ['status'])}</span></td>
                       <td className="p-6 text-right">{getVal(p, ['status']) === 'Pendente' && <button onClick={() => sendData('updateStatus',{sheet:'Permutas',id:getVal(p,['id']),status:'Homologado'})} className="bg-blue-600 text-white px-4 py-2 rounded-xl uppercase tracking-widest">Homologar</button>}</td>
                     </tr>
                   ))}
                 </tbody>
               </table></div>
            </div>
         );
      case 'agenda': return <AgendaTab user={user} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-80' : 'w-24'} bg-slate-950 text-white transition-all duration-500 flex flex-col z-20 shadow-2xl border-r border-white/5`}>
         <div className="p-8 h-24 flex items-center border-b border-white/5">{sidebarOpen && <div className="flex items-center gap-3"><div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg"><Plane size={24}/></div><span className="font-black text-xl uppercase tracking-tighter">SGA-Enf</span></div>}<button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-2.5 hover:bg-white/10 rounded-2xl transition-all"><Menu size={22} className="text-slate-400"/></button></div>
         <div className={`p-6 border-b border-white/5 bg-white/5 ${!sidebarOpen && 'flex justify-center'}`}><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-xl bg-blue-600 text-white text-lg border-2 border-blue-400/20">{user.substring(0,2).toUpperCase()}</div>{sidebarOpen && (<div><p className="font-black text-sm tracking-tight truncate w-40 uppercase">{user}</p><p className="text-[9px] text-blue-400 uppercase font-black tracking-widest">{role}</p></div>)}</div></div>
         <nav className="flex-1 py-10 px-6 space-y-4 overflow-y-auto">
            {[ { id: 'dashboard', label: 'Início', icon: LayoutDashboard }, { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: data.atestados.filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'permutas', label: 'Permutas', icon: ArrowRightLeft, badge: data.permutas.filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'efetivo', label: 'Efetivo Oficiais', icon: Users }, { id: 'agenda', label: 'Minha Agenda', icon: BookOpen } ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-5 p-4.5 rounded-[1.5rem] transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                 <div className="relative"><item.icon size={22}/>{item.badge > 0 && <span className="absolute -top-3 -right-3 w-5.5 h-5.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white border-2 border-slate-950 font-black">{item.badge}</span>}</div>{sidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>}</button>
            ))}
         </nav>
         <div className="p-8 border-t border-white/5"><button onClick={onLogout} className="flex items-center gap-5 text-slate-600 hover:text-red-400 font-black text-[10px] uppercase tracking-widest w-full p-4.5"><LogOut size={20}/> {sidebarOpen && 'Sair do Sistema'}</button></div>
      </aside>
      <main className="flex-1 overflow-auto p-12 bg-slate-50/50 relative">
         <header className="flex justify-between items-end mb-12 border-b border-slate-200 pb-8"><div className="space-y-1"><h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab}</h2><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p></div><button onClick={() => refreshData(true)} className="p-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm text-blue-600 hover:scale-110 transition-all active:scale-95"><RefreshCw size={22}/></button></header>
         {renderContent()}
         {showOfficerModal && <Modal title={formOfficer.nome ? "Editar Dados" : "Novo Oficial"} onClose={() => setShowOfficerModal(false)}><form onSubmit={(e)=>{e.preventDefault(); sendData('saveOfficer', { id: formOfficer.id || Date.now(), nome: formOfficer.nome, patente: formOfficer.patente, antiguidade: formOfficer.antiguidade, nascimento: formOfficer.nascimento, ingresso: formOfficer.ingresso, role: formOfficer.role || 'user' });}} className="space-y-5"><div className="grid grid-cols-2 gap-5"><div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nome de Guerra</label><input type="text" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800" value={formOfficer.nome || ''} onChange={e => setFormOfficer({...formOfficer, nome: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Posto/Patente</label><input type="text" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800" value={formOfficer.patente || ''} onChange={e => setFormOfficer({...formOfficer, patente: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Antiguidade</label><input type="number" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800" value={formOfficer.antiguidade || ''} onChange={e => setFormOfficer({...formOfficer, antiguidade: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Data Nasc.</label><input type="date" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800" value={formOfficer.nascimento || ''} onChange={e => setFormOfficer({...formOfficer, nascimento: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Data Praça</label><input type="date" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800" value={formOfficer.ingresso || ''} onChange={e => setFormOfficer({...formOfficer, ingresso: e.target.value})}/></div></div><button type="submit" disabled={isSaving} className="w-full py-5 bg-blue-600 text-white font-black rounded-[1.5rem] uppercase text-[10px] tracking-[0.25em] shadow-xl mt-4 active:scale-95 transition-all">{isSaving ? "Gravando..." : "Salvar no Banco"}</button></form></Modal>}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchOfficers = async () => { 
    setLoading(true); 
    try { 
      const res = await fetch(`${API_URL_GESTAO}?action=getData`); 
      const data = await res.json(); 
      if (Array.isArray(data.officers)) setOfficers(data.officers); 
    } catch(e) { console.error(e); } finally { setLoading(false); } 
  };
  
  useEffect(() => { fetchOfficers(); }, []);

  if (!user) return <LoginScreen onLogin={(u,r) => { setUser(u); setRole(r); }} officersList={officers} isLoading={loading} />;
  if (role === 'admin' || role === 'rt') return <MainSystem user={user} role={role} onLogout={() => setUser(null)} globalOfficers={officers} refreshGlobal={fetchOfficers} />;
  return <UserDashboard user={user} onLogout={() => setUser(null)} />;
}
