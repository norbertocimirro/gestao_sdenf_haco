import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Cake, BookOpen, Plus, Trash2, Edit3, 
  UserPlus, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, Thermometer, TrendingDown, Plane
} from 'lucide-react';

// --- CONFIGURAÇÃO ---
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 
const API_URL_INDICADORES = "https://script.google.com/macros/s/AKfycbxJp8-2qRibag95GfPnazUNWC-EdA8VUFYecZHg9Pp1hl5OlR3kofF-HbElRYCGcdv0/exec"; 

// --- HELPERS ---

const getVal = (obj, searchTerms) => {
  if (!obj) return "";
  const keys = Object.keys(obj);
  const foundKey = keys.find(k => searchTerms.some(term => k.toLowerCase().includes(term.toLowerCase())));
  return foundKey ? obj[foundKey] : "";
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (s.includes('/')) {
    const [d, m, y] = s.split('/');
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  if (s.includes('-')) return new Date(s + 'T12:00:00');
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (dateInput) => {
  const date = parseDate(dateInput);
  return date ? date.toLocaleDateString('pt-BR') : String(dateInput || '-');
};

const calculateDetailedTime = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return { y: 0, m: 0, d: 0 };
  const today = new Date();
  let y = today.getFullYear() - date.getFullYear();
  let m = today.getMonth() - date.getMonth();
  let d = today.getDate() - date.getDate();
  if (d < 0) { m--; const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0); d += lastMonth.getDate(); }
  if (m < 0) { y--; m += 12; }
  return { y, m, d };
};

const safeParseFloat = (value) => {
  if (!value) return 0;
  const num = parseFloat(String(value).replace(',', '.'));
  return isNaN(num) ? 0 : num;
};

// --- COMPONENTES ---

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn border border-slate-200">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><CloseIcon size={22}/></button>
      </div>
      <div className="p-8 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

const BirthdayWidget = ({ staff }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const birthdays = staff.filter(p => {
    const d = parseDate(getVal(p, ['nasc']));
    return d && d.getMonth() === currentMonth;
  }).sort((a, b) => parseDate(getVal(a, ['nasc'])).getDate() - parseDate(getVal(b, ['nasc'])).getDate());

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 bg-gradient-to-br from-pink-500 to-rose-600 text-white flex justify-between items-center">
        <h3 className="font-black flex items-center gap-2 text-xs uppercase tracking-widest"><Cake size={18} /> Aniversários de {today.toLocaleDateString('pt-BR', {month: 'long'})}</h3>
      </div>
      <div className="p-5 flex-1 overflow-y-auto max-h-[350px] space-y-3">
        {birthdays.map((p, i) => (
           <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-sm font-black">{parseDate(getVal(p, ['nasc'])).getDate()}</div>
              <div className="flex-1">
                 <p className="text-sm font-black text-slate-800 tracking-tighter uppercase">{getVal(p, ['patente', 'posto'])} {getVal(p, ['nome'])}</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase">{getVal(p, ['setor'])}</p>
              </div>
           </div>
        ))}
        {birthdays.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase">Nenhum aniversariante hoje</p>}
      </div>
    </div>
  );
};

// --- ÁREA DO OFICIAL ---

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
        atestados: (resData.atestados || []).filter(a => getVal(a, ['militar']).includes(user)).reverse(),
        permutas: (resData.permutas || []).filter(p => getVal(p, ['solicitante']).includes(user)).reverse(),
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
    } catch(e) { setIsSaving(false); alert("Erro."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg">HA</div>
          <div><h1 className="font-black text-slate-800 text-lg uppercase tracking-tighter">Ten {user}</h1><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Acesso Oficial</p></div>
        </div>
        <button onClick={onLogout} className="bg-slate-100 p-3 rounded-xl text-slate-400 hover:text-red-500 transition-all"><LogOut size={20}/></button>
      </header>
      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-6">
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"><h2 className="text-2xl font-black uppercase tracking-tighter relative z-10">Serviços</h2><Plane className="absolute -bottom-6 -right-6 text-white/10" size={150}/></div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setModals({...modals, atestado: true})} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 hover:shadow-xl transition-all"><div className="p-3 bg-red-50 text-red-500 rounded-2xl"><ShieldAlert size={28}/></div><span className="font-black text-[10px] uppercase text-slate-600">Atestado</span></button>
          <button onClick={() => setModals({...modals, permuta: true})} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 hover:shadow-xl transition-all"><div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><ArrowRightLeft size={28}/></div><span className="font-black text-[10px] uppercase text-slate-600">Permuta</span></button>
        </div>
        <div className="pt-6"><h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex justify-between">Histórico <button onClick={fetchData}><RefreshCw size={14} className={loading?'animate-spin':''}/></button></h3>
          <div className="space-y-3">
            {[...data.permutas, ...data.atestados].map((item, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                <div className="text-xs">
                  <p className="font-black text-slate-800 uppercase mb-1">{getVal(item,['substituto'])?`Troca: ${getVal(item,['substituto'])}`:`Afastamento: ${getVal(item,['dias'])}d`}</p>
                  <p className="text-slate-400 font-bold text-[9px] uppercase">{formatDate(getVal(item,['inicio','data','sai']))}</p>
                </div>
                <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase ${getVal(item,['status'])==='Homologado'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{getVal(item,['status'])}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      {modals.atestado && <Modal title="Novo Atestado" onClose={()=>setModals({...modals, atestado:false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveAtestado',{id:Date.now(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias,data:form.inicio});}} className="space-y-4"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Início</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Dias</label><input type="number" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,dias:e.target.value})}/></div><button disabled={isSaving} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl">{isSaving?"Enviando...":"Enviar"}</button></form></Modal>}
      {modals.permuta && <Modal title="Pedir Permuta" onClose={()=>setModals({...modals, permuta:false})}><form onSubmit={(e)=>{e.preventDefault(); handleSend('savePermuta',{id:Date.now(),status:'Pendente',solicitante:user,substituto:form.sub,datasai:form.sai,dataentra:form.entra});}} className="space-y-4"><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Saída</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,sai:e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Substituto</label><select required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,sub:e.target.value})}><option value="">Escolha...</option>{data.officers.map((o,i)=><option key={i} value={getVal(o,['nome'])}>{getVal(o,['nome'])}</option>)}</select></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Entrada</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" onChange={e=>setForm({...form,entra:e.target.value})}/></div><button disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">{isSaving?"Enviando...":"Solicitar"}</button></form></Modal>}
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
  const [formOfficer, setFormOfficer] = useState({});
  const [data, setData] = useState({ atestados: [], permutas: [], upi: {leitosOcupados: 0, mediaBraden: 0, mediaFugulin: 0, dataReferencia: '--'} });

  const refreshData = async (showFeedback = true) => {
    setLoading(true);
    try {
      await refreshGlobal(); 
      const r1 = await fetch(`${API_URL_GESTAO}?action=getData`);
      const d1 = await r1.json();
      setData(prev => ({ ...prev, atestados: d1.atestados || [], permutas: d1.permutas || [] }));
      
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
      if (showFeedback) alert("Sincronizado!");
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
    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40}/></div>;
    
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-4 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl flex justify-between items-center border border-slate-800">
                   <div className="flex items-center gap-6"><div className="bg-blue-600 p-5 rounded-3xl"><Activity size={32}/></div><div><h3 className="text-2xl font-black uppercase">Monitoramento UPI</h3><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{data.upi.dataReferencia}</p></div></div>
                   <div className="flex gap-12 text-center">
                      <div><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Ocupação</p><p className="text-4xl font-black">{data.upi.leitosOcupados} <span className="text-sm text-slate-700">/ 15</span></p></div>
                      <div><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Braden</p><p className="text-4xl font-black text-yellow-500">{data.upi.mediaBraden.toFixed(1)}</p></div>
                      <div><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Fugulin</p><p className="text-4xl font-black text-green-500">{data.upi.mediaFugulin.toFixed(1)}</p></div>
                   </div>
                </div>
                <div className="md:col-span-2 row-span-2"><BirthdayWidget staff={globalOfficers}/></div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Pendências</p><h3 className="text-4xl font-black text-red-600">{data.atestados.filter(x=>getVal(x,['status'])==='Pendente').length + data.permutas.filter(x=>getVal(x,['status'])==='Pendente').length}</h3></div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Efetivo</p><h3 className="text-4xl font-black text-slate-800">{globalOfficers.length}</h3></div>
            </div>
          </div>
        );
      case 'atestados':
        return (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 animate-fadeIn">
             <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-5">Militar</th><th className="p-5">Duração</th><th className="p-5">Início</th><th className="p-5">Status</th><th className="p-5 text-right">Ação</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                   {data.atestados.map((a, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 transition-all font-bold">
                       <td className="p-5 text-slate-800 uppercase tracking-tighter">{getVal(a, ['militar'])}</td>
                       <td className="p-5 text-slate-500">{getVal(a, ['dias'])} dias</td>
                       <td className="p-5 text-slate-400 font-mono text-xs">{formatDate(getVal(a, ['inicio', 'data']))}</td>
                       <td className="p-5"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${getVal(a, ['status']) === 'Homologado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{getVal(a, ['status'])}</span></td>
                       <td className="p-5 text-right">{getVal(a, ['status']) === 'Pendente' && <button onClick={() => sendData('updateStatus',{sheet:'Atestados',id:getVal(a,['id']),status:'Homologado'})} className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Homologar</button>}</td>
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
                <button onClick={() => { setFormOfficer({}); setShowOfficerModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-xl shadow-blue-500/20"><UserPlus size={16}/> Adicionar Militar</button>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest"><tr><th className="p-4 text-center">Ant.</th><th className="p-4">Posto/Nome</th><th className="p-4 text-center">Idade</th><th className="p-4 text-center">Data Praça</th><th className="p-4 text-center">Serviço</th><th className="p-4 text-right">Gerir</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {sorted.map((o, i) => {
                      const idade = calculateDetailedTime(getVal(o, ['nasc']));
                      const servico = calculateDetailedTime(getVal(o, ['ingres']));
                      return (
                      <tr key={i} className="hover:bg-slate-50 group font-bold">
                        <td className="p-4 text-center text-slate-300 font-black text-lg">{getVal(o, ['antiguidade'])}</td>
                        <td className="p-4 text-slate-800 uppercase tracking-tighter">{getVal(o,['patente','posto'])} {getVal(o,['nome'])}</td>
                        <td className={`p-4 text-center ${idade.y >= 45 ? 'text-red-600 bg-red-50 rounded-xl' : 'text-slate-600'}`}>{idade.y}a {idade.m}m {idade.d}d</td>
                        <td className="p-4 text-center text-slate-400 font-mono text-xs">{formatDate(getVal(o,['ingres']))}</td>
                        <td className={`p-4 text-center ${servico.y >= 7 ? 'text-red-600 bg-red-50 rounded-xl' : 'text-slate-600'}`}>{servico.y}a {servico.m}m {servico.d}d</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setFormOfficer({ ...o, nome: getVal(o,['nome']), patente: getVal(o,['patente','posto']), antiguidade: getVal(o,['antiguidade']), nascimento: getVal(o,['nasc']), ingresso: getVal(o,['ingres']), setor: getVal(o,['setor']), role: getVal(o,['role']) }); setShowOfficerModal(true); }} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white"><Edit3 size={14}/></button>
                            <button onClick={() => { if(window.confirm(`Excluir ${getVal(o,['nome'])}?`)) sendData('deleteOfficer', { nome: getVal(o,['nome']) }); }} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white"><Trash2 size={14}/></button>
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
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 animate-fadeIn">
               <div className="overflow-x-auto"><table className="w-full text-left"><thead className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b"><tr><th className="p-5">Solicitante</th><th className="p-5">Substituto</th><th className="p-5">Datas (S / E)</th><th className="p-5">Status</th><th className="p-5 text-right">Ação</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                   {data.permutas.map((p, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 transition-all font-bold text-xs uppercase">
                       <td className="p-5 text-slate-800">{getVal(p, ['solicitante'])}</td>
                       <td className="p-5 text-slate-500">{getVal(p, ['substituto'])}</td>
                       <td className="p-5"><div className="flex gap-4 font-mono"><span className="text-red-500">S: {formatDate(getVal(p,['sai','datasai']))}</span><span className="text-green-600">E: {formatDate(getVal(p,['entra','dataentra']))}</span></div></td>
                       <td className="p-5"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${getVal(p, ['status']) === 'Homologado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{getVal(p, ['status'])}</span></td>
                       <td className="p-5 text-right">{getVal(p, ['status']) === 'Pendente' && <button onClick={() => sendData('updateStatus',{sheet:'Permutas',id:getVal(p,['id']),status:'Homologado'})} className="text-blue-600 font-black text-[10px] uppercase hover:underline">Homologar</button>}</td>
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
      <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} bg-slate-950 text-white transition-all duration-500 flex flex-col z-20 shadow-2xl`}>
         <div className="p-6 h-24 flex items-center border-b border-white/5">{sidebarOpen && <span className="font-black text-xl uppercase tracking-tighter">SGA-Enf</span>}<button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-2 hover:bg-white/10 rounded-xl"><Menu size={22}/></button></div>
         <nav className="flex-1 py-8 px-4 space-y-4">
            {[ { id: 'dashboard', label: 'Início', icon: LayoutDashboard }, { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: data.atestados.filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'permutas', label: 'Permutas', icon: ArrowRightLeft, badge: data.permutas.filter(x=>getVal(x,['status'])==='Pendente').length }, { id: 'efetivo', label: 'Efetivo', icon: Users } ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40' : 'text-slate-500 hover:text-white'}`}>
                 <div className="relative"><item.icon size={22}/>{item.badge > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-slate-950 font-black">{item.badge}</span>}</div>{sidebarOpen && <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>}</button>
            ))}
         </nav>
         <div className="p-6 border-t border-white/5"><button onClick={onLogout} className="flex items-center gap-4 text-slate-500 hover:text-red-400 font-black text-xs uppercase w-full p-4"><LogOut size={20}/> {sidebarOpen && 'Sair'}</button></div>
      </aside>
      <main className="flex-1 overflow-auto p-12 bg-slate-50/30">
         <header className="flex justify-between items-end mb-12 border-b border-slate-200 pb-8"><div className="space-y-1"><h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{activeTab}</h2><p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p></div><button onClick={() => refreshData(true)} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-blue-600 hover:bg-slate-50"><RefreshCw size={20}/></button></header>
         {renderContent()}
         {showOfficerModal && <Modal title={formOfficer.nome ? "Editar Militar" : "Adicionar Militar"} onClose={() => setShowOfficerModal(false)}><form onSubmit={handleSaveOfficer} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Guerra</label><input type="text" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" value={formOfficer.nome || ''} onChange={e => setFormOfficer({...formOfficer, nome: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Patente</label><input type="text" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" value={formOfficer.patente || ''} onChange={e => setFormOfficer({...formOfficer, patente: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Antiguidade</label><input type="number" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" value={formOfficer.antiguidade || ''} onChange={e => setFormOfficer({...formOfficer, antiguidade: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nascimento</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" value={formOfficer.nascimento || ''} onChange={e => setFormOfficer({...formOfficer, nascimento: e.target.value})}/></div><div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data Praça</label><input type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border-0 font-bold" value={formOfficer.ingresso || ''} onChange={e => setFormOfficer({...formOfficer, ingresso: e.target.value})}/></div></div><button type="submit" disabled={isSaving} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl">{isSaving ? "Gravando..." : "Salvar no Banco"}</button></form></Modal>}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchOfficers = async () => { setLoading(true); try { const res = await fetch(`${API_URL_GESTAO}?action=getData`); const data = await res.json(); setOfficers(data.officers || []); } catch(e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { fetchOfficers(); }, []);
  if (!user) return <LoginScreen onLogin={(u,r) => { setUser(u); setRole(r); }} officersList={officers} isLoading={loading} />;
  if (role === 'admin' || role === 'rt') return <MainSystem user={user} role={role} onLogout={() => setUser(null)} globalOfficers={officers} refreshGlobal={fetchOfficers} />;
  return <UserDashboard user={user} onLogout={() => setUser(null)} />;
}
