import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Cake, BookOpen, Plus, Trash2, Edit3, 
  UserPlus, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, Thermometer, TrendingDown, Plane, CheckSquare, Square
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
    searchTerms.some(term => k.toLowerCase().includes(term.toLowerCase()))
  );
  return foundKey ? obj[foundKey] : "";
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s || s === "-" || s.toLowerCase() === "invalid date") return null;

  try {
    // Formato Brasileiro DD/MM/YYYY
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
      if (parts.length === 2) return null; // Apenas dia/mês não permite cálculo de idade
    }
    // Formato ISO YYYY-MM-DD
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
  
  return { 
    y: Math.max(0, y), 
    m: Math.max(0, m), 
    d: Math.max(0, d),
    display: `${y}a ${m}m ${d}d`
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
    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-fadeIn border border-slate-200">
      <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><CloseIcon size={20}/></button>
      </div>
      <div className="p-8 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const BirthdayWidget = ({ staff }) => {
  const currentMonth = new Date().getMonth();
  const birthdays = (Array.isArray(staff) ? staff : []).filter(p => {
    const d = parseDate(getVal(p, ['nasc']));
    return d && d.getMonth() === currentMonth;
  }).sort((a, b) => parseDate(getVal(a, ['nasc'])).getDate() - parseDate(getVal(b, ['nasc'])).getDate());

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full font-sans">
      <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 text-white flex justify-between items-center">
        <h3 className="font-black flex items-center gap-2 text-[10px] uppercase tracking-widest"><Cake size={16} /> Aniversários</h3>
      </div>
      <div className="p-4 flex-1 overflow-y-auto max-h-[300px] space-y-2">
        {birthdays.map((p, i) => (
           <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-sm font-black shadow-sm">
                 {parseDate(getVal(p, ['nasc'])).getDate()}
              </div>
              <div className="flex-1">
                 <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{getVal(p, ['patente', 'posto'])} {getVal(p, ['nome'])}</p>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{getVal(p, ['setor'])}</p>
              </div>
           </div>
        ))}
        {birthdays.length === 0 && <p className="text-center py-10 text-slate-400 text-[10px] font-black uppercase tracking-widest">Nenhum aniversário</p>}
      </div>
    </div>
  );
};

// --- DASHBOARD USUÁRIO ---

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
        officers: Array.isArray(resData.officers) ? resData.officers : []
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
      <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/30">HA</div>
          <div><h1 className="font-black text-slate-800 text-lg uppercase tracking-tighter">Ten {user}</h1><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Painel Individual</p></div>
        </div>
        <button onClick={onLogout} className="bg-slate-100 p-4 rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-90"><LogOut size={22}/></button>
      </header>
      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-6">
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"><h2 className="text-2xl font-black uppercase tracking-tighter relative z-10">Mural</h2><Plane className="absolute -bottom-10 -right-10 text-white/10" size={150}/></div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setModals({...modals, atestado: true})} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-3 hover:shadow-xl transition-all active:scale-95 group"><div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all"><ShieldAlert size={28}/></div><span className="font-black text-[10px] uppercase text-slate-700 tracking-widest">Atestado</span></button>
          <button onClick={() => setModals({...modals, permuta: true})} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-3 hover:shadow-xl transition-all active:scale-95 group"><div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><ArrowRightLeft size={28}/></div><span className="font-black text-[10px] uppercase text-slate-700 tracking-widest">Permuta</span></button>
        </div>
        <div className="pt-8"><h3 className="font-black text-slate-900 text-lg uppercase tracking-tighter mb-4 flex justify-between">Meus Registros <button onClick={fetchData} className="p-2 bg-white border rounded-xl"><RefreshCw size={14} className={loading?'animate-spin':''}/></button></h3>
          <div className="space-y-3">
            {[...data.permutas, ...data.atestados].map((item, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group">
                <div className="text-xs">
                  <p className="font-black text-slate-800 uppercase text-sm mb-1">{getVal(item,['substituto']) ? `Troca: ${getVal(item,['substituto'])}` : `Afastamento: ${getVal(item,['dias'])}d`}</p>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">{formatDate(getVal(item,['inicio','data','sai']))}</p>
                </div>
                <span className={`text-[9px] px-3.5 py-1.5 rounded-full font-black uppercase tracking-widest ${getVal(item,['status'])==='Homologado'?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700'}`}>{getVal(item,['status'])}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      {modals.atestado && <Modal title="Novo Atestado" onClose={()=>setModals({...modals, atestado:false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveAtestado',{id:Date.now(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias,data:form.inicio});}} className="space-y-4"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Início</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Dias</label><input type="number" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,dias:e.target.value})}/></div><button disabled={isSaving} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px]">{isSaving?"A Processar...":"Confirmar"}</button></form></Modal>}
      {modals.permuta && <Modal title="Pedir Permuta" onClose={()=>setModals({...modals, permuta:false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('savePermuta',{id:Date.now(),status:'Pendente',solicitante:user,substituto:form.sub,datasai:form.sai,dataentra:form.entra});}} className="space-y-4"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data que você sai</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,sai:e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Militar Substituto</label><select required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,sub:e.target.value})}><option value="">Escolha...</option>{data.officers.map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data que você volta</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,entra:e.target.value})}/></div><button disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl text-[10px] uppercase tracking-widest">{isSaving?"A Enviar...":"Protocolar"}</button></form></Modal>}
    </div>
  );
};

// --- PAINEL CHEFIA ---

const MainSystem = ({ user, role, onLogout, globalOfficers, refreshGlobal }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [formOfficer, setFormOfficer] = useState({ expediente: [], servico: '' });
  const [data, setData] = useState({ atestados: [], permutas: [], upi: {leitosOcupados: 0, mediaBraden: 0, mediaFugulin: 0, dataReferencia: '--'} });

  const refreshData = async (showFeedback = true) => {
    setLoading(true);
    try {
      await refreshGlobal(); 
      const r1 = await fetch(`${API_URL_GESTAO}?action=getData`);
      const d1 = await r1.json();
      setData(prev => ({ 
        ...prev, 
        atestados: Array.isArray(d1.atestados) ? d1.atestados : [], 
        permutas: Array.isArray(d1.permutas) ? d1.permutas : [] 
      }));
      
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
      if (showFeedback) alert("Dados Atualizados!");
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };
  
  useEffect(() => { refreshData(false); }, []);

  const sendData = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action, payload }) });
      setTimeout(() => { setIsSaving(false); setShowOfficerModal(false); refreshData(false); }, 2000); 
    } catch (e) { setIsSaving(false); alert("Erro ao gravar."); }
  };

  const handleToggleExpediente = (local) => {
    const current = formOfficer.expediente || [];
    if (current.includes(local)) {
      setFormOfficer({...formOfficer, expediente: current.filter(l => l !== local)});
    } else {
      setFormOfficer({...formOfficer, expediente: [...current, local]});
    }
  };

  const handleSaveOfficer = (e) => {
    e.preventDefault();
    const payload = {
      ...formOfficer,
      id: formOfficer.id || Date.now(),
      expediente: (formOfficer.expediente || []).join(', '),
      servico: formOfficer.servico || ''
    };
    sendData('saveOfficer', payload);
  };

  const renderContent = () => {
    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40}/></div>;
    
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn font-sans">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-4 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex justify-between items-center border border-slate-800 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={200}/></div>
                   <div className="flex items-center gap-6 relative z-10"><div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20"><Activity size={24}/></div><div><h3 className="text-lg font-black uppercase tracking-tighter">Status UPI</h3><p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Ref: {data.upi.dataReferencia}</p></div></div>
                   <div className="flex gap-10 text-center relative z-10 font-black">
                      <div><p className="text-slate-500 text-[9px] uppercase mb-1">Ocupação</p><p className="text-2xl">{data.upi.leitosOcupados}</p></div>
                      <div><p className="text-slate-500 text-[9px] uppercase mb-1">Braden</p><p className="text-2xl text-yellow-500">{data.upi.mediaBraden.toFixed(1)}</p></div>
                      <div><p className="text-slate-500 text-[9px] uppercase mb-1">Fugulin</p><p className="text-2xl text-green-500">{data.upi.mediaFugulin.toFixed(1)}</p></div>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border flex flex-col items-center justify-center group hover:border-red-200 transition-all shadow-sm">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-2 group-hover:text-red-500">Pendências</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{data.atestados.filter(x=>getVal(x,['status'])==='Pendente').length + data.permutas.filter(x=>getVal(x,['status'])==='Pendente').length}</h3>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border flex flex-col items-center justify-center group hover:border-blue-200 transition-all shadow-sm">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-2 group-hover:text-blue-600">Efetivo</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{globalOfficers.length}</h3>
                </div>
                <div className="md:col-span-2 row-span-2 shadow-sm border rounded-[2rem] bg-white overflow-hidden p-6 flex flex-col"><BirthdayWidget staff={globalOfficers}/></div>
            </div>
          </div>
        );
      case 'efetivo':
         const sorted = [...globalOfficers].sort((a,b) => (parseInt(getVal(a,['antiguidade'])) || 999) - (parseInt(getVal(b,['antiguidade'])) || 999));
         return (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 animate-fadeIn">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter">Efetivo de Oficiais</h3>
                <button onClick={() => { setFormOfficer({ expediente: [], servico: '' }); setShowOfficerModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-xl shadow-blue-500/20 transition-all"><UserPlus size={18}/> Novo Militar</button>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm font-sans"><thead className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b"><tr><th className="p-4 text-center">Ant.</th><th className="p-4">Posto/Nome</th><th className="p-4">Expediente</th><th className="p-4">Serviço</th><th className="p-4 text-center">Idade</th><th className="p-4 text-center">Tempo Serviço</th><th className="p-4 text-right">Ação</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {sorted.map((o, i) => {
                      const tIdade = calculateDetailedTime(getVal(o, ['nasc']));
                      const tServico = calculateDetailedTime(getVal(o, ['ingres']));
                      const expedientes = String(getVal(o, ['expediente'])).split(',').filter(x => x.trim() !== "");
                      
                      return (
                      <tr key={i} className="hover:bg-slate-50/50 group transition-all">
                        <td className="p-4 text-center text-slate-300 font-black text-lg">{getVal(o, ['antiguidade'])}</td>
                        <td className="p-4"><div className="flex flex-col"><span className="font-black text-slate-800 uppercase tracking-tighter text-sm">{getVal(o,['patente','posto'])} {getVal(o,['nome'])}</span><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(getVal(o,['nasc']))}</span></div></td>
                        <td className="p-4">
                           <div className="flex flex-wrap gap-1">
                             {expedientes.length > 0 ? expedientes.map((ex, idx) => (
                               <span key={idx} className="bg-blue-50 text-blue-600 text-[7px] font-black uppercase px-2 py-0.5 rounded-md border border-blue-100">{ex.trim()}</span>
                             )) : <span className="text-slate-300">-</span>}
                           </div>
                        </td>
                        <td className="p-4"><span className={`text-[9px] font-black uppercase ${getVal(o,['servico']) === 'UTI' ? 'text-purple-600' : 'text-blue-600'}`}>{getVal(o,['servico']) || '-'}</span></td>
                        <td className={`p-4 text-center text-[10px] font-bold ${tIdade.y >= 45 ? 'text-red-600 bg-red-50 rounded-xl' : 'text-slate-600'}`}>{tIdade.display}</td>
                        <td className={`p-4 text-center text-[10px] font-bold ${tServico.y >= 7 ? 'text-red-600 bg-red-50 rounded-xl' : 'text-slate-600'}`}>{tServico.display}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { 
                               const expArr = String(getVal(o, ['expediente'])).split(',').map(x => x.trim()).filter(x => x !== "");
                               setFormOfficer({ ...o, nome: getVal(o,['nome']), patente: getVal(o,['patente','posto']), antiguidade: getVal(o,['antiguidade']), nascimento: getVal(o,['nasc']), ingresso: getVal(o,['ingres']), role: getVal(o,['role']), expediente: expArr, servico: getVal(o,['servico']) }); 
                               setShowOfficerModal(true); 
                            }} className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14}/></button>
                            <button onClick={() => { if(window.confirm(`Remover ${getVal(o,['nome'])}?`)) sendData('deleteOfficer', { nome: getVal(o,['nome']) }); }} className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table></div>
            </div>
         );
      case 'atestados':
         return (
            <div className="bg-white rounded-[3rem] shadow-sm border p-8 animate-fadeIn">
               <div className="overflow-x-auto"><table className="w-full text-left font-sans font-bold uppercase"><thead className="text-[9px] text-slate-400 tracking-widest border-b uppercase"><tr><th className="p-6">Militar</th><th className="p-6 text-center">Dias</th><th className="p-6">Início</th><th className="p-6">Status</th><th className="p-6 text-right">Ação</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.atestados.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-all">
                        <td className="p-6 text-slate-800 text-sm">{getVal(a,['militar'])}</td>
                        <td className="p-6 text-center text-slate-500 font-black">{getVal(a,['dias'])}d</td>
                        <td className="p-6 text-[10px] font-mono text-slate-400">{formatDate(getVal(a,['inicio', 'data']))}</td>
                        <td className="p-6"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${getVal(a,['status']) === 'Homologado' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{getVal(a,['status'])}</span></td>
                        <td className="p-6 text-right">{getVal(a,['status']) === 'Pendente' && <button onClick={()=>sendData('updateStatus',{sheet:'Atestados',id:getVal(a,['id']),status:'Homologado'})} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest">Homologar</button>}</td>
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
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} bg-slate-950 text-white transition-all duration-500 flex flex-col z-20 shadow-2xl border-r border-white/5`}>
         <div className="p-8 h-24 flex items-center border-b border-white/5">{sidebarOpen && <div className="flex items-center gap-3"><div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20"><Plane size={24}/></div><span className="font-black text-xl uppercase tracking-tighter">SGA-Enf</span></div>}<button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-2.5 hover:bg-white/10 rounded-2xl transition-all"><Menu size={22} className="text-slate-400"/></button></div>
         <nav className="flex-1 py-10 px-4 space-y-4 overflow-y-auto">
            {[ { id: 'dashboard', label: 'Início', icon: LayoutDashboard }, { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: data.atestados.filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'efetivo', label: 'Efetivo Oficiais', icon: Users } ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-5 p-4.5 rounded-[1.5rem] transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                 <div className="relative"><item.icon size={22}/>{item.badge > 0 && <span className="absolute -top-3 -right-3 w-5.5 h-5.5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-slate-950 font-black">{item.badge}</span>}</div>{sidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>}</button>
            ))}
         </nav>
         <div className="p-8 border-t border-white/5"><button onClick={onLogout} className="flex items-center gap-5 text-slate-600 hover:text-red-400 font-black text-[10px] uppercase tracking-widest w-full p-4.5"><LogOut size={20}/> {sidebarOpen && 'Sair'}</button></div>
      </aside>
      <main className="flex-1 overflow-auto p-12 bg-slate-50/50">
         <header className="flex justify-between items-end mb-12 border-b border-slate-200 pb-10"><div className="space-y-2"><h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab}</h2><p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p></div><button onClick={() => refreshData(true)} className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm text-blue-600 hover:scale-110 transition-all active:scale-95"><RefreshCw size={24}/></button></header>
         {renderContent()}

         {showOfficerModal && (
           <Modal title={formOfficer.nome ? "Editar Oficial" : "Incluir Militar"} onClose={() => setShowOfficerModal(false)}>
              <form onSubmit={handleSaveOfficer} className="space-y-6">
                 <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nome de Guerra</label><input type="text" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800 mt-1 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formOfficer.nome || ''} onChange={e => setFormOfficer({...formOfficer, nome: e.target.value})}/></div>
                    <div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Patente</label><input type="text" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800 mt-1 shadow-inner" value={formOfficer.patente || ''} onChange={e => setFormOfficer({...formOfficer, patente: e.target.value})}/></div>
                    <div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Antiguidade</label><input type="number" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800 mt-1 shadow-inner" value={formOfficer.antiguidade || ''} onChange={e => setFormOfficer({...formOfficer, antiguidade: e.target.value})}/></div>
                    <div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Data Nasc.</label><input type="date" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800 mt-1 shadow-inner" value={formOfficer.nascimento || ''} onChange={e => setFormOfficer({...formOfficer, nascimento: e.target.value})}/></div>
                    <div><label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Data Praça</label><input type="date" required className="w-full p-5 rounded-3xl bg-slate-50 border-0 font-black text-slate-800 mt-1 shadow-inner" value={formOfficer.ingresso || ''} onChange={e => setFormOfficer({...formOfficer, ingresso: e.target.value})}/></div>
                    
                    <div className="col-span-2 pt-4 border-t"><label className="text-[9px] font-black uppercase text-blue-500 ml-2 tracking-widest mb-3 block">Alocação Expediente (Múltiplo)</label>
                      <div className="grid grid-cols-4 gap-2">
                        {LOCAIS_EXPEDIENTE.map(local => (
                          <button key={local} type="button" onClick={() => handleToggleExpediente(local)} className={`py-2 px-1 rounded-xl text-[8px] font-black transition-all border ${ (formOfficer.expediente || []).includes(local) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-blue-200' }`}>
                             {local}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 pt-4"><label className="text-[9px] font-black uppercase text-indigo-500 ml-2 tracking-widest mb-3 block">Alocação Serviço (Único)</label>
                      <div className="flex gap-4">
                        {LOCAIS_SERVICO.map(serv => (
                          <button key={serv} type="button" onClick={() => setFormOfficer({...formOfficer, servico: serv})} className={`flex-1 p-4 rounded-3xl text-[10px] font-black transition-all border flex items-center justify-center gap-2 ${ formOfficer.servico === serv ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100' }`}>
                             {formOfficer.servico === serv ? <CheckSquare size={14}/> : <Square size={14}/>} {serv}
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>
                 <button type="submit" disabled={isSaving} className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl uppercase text-[10px] tracking-[0.25em] active:scale-95 transition-all mt-4">{isSaving ? "A Processar..." : "Gravar Dados"}</button>
              </form>
           </Modal>
         )}
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
    } catch(e) { console.error("Falha ao carregar oficiais:", e); } 
    finally { setLoading(false); } 
  };
  
  useEffect(() => { fetchOfficers(); }, []);

  if (!user) return <LoginScreen onLogin={(u,r) => { setUser(u); setRole(r); }} officersList={officers} isLoading={loading} />;
  
  if (role === 'admin' || role === 'rt') {
    return <MainSystem user={user} role={role} onLogout={() => setUser(null)} globalOfficers={officers} refreshGlobal={fetchOfficers} />;
  }
  
  return <UserDashboard user={user} onLogout={() => setUser(null)} />;
}
