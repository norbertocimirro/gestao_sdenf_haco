import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Sun, Palmtree, CalendarRange, Cake, BookOpen, 
  Plus, Trash2, Lock, CheckCircle, Eye, Thermometer, TrendingDown,
  Plane, Stethoscope, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, ExternalLink, GraduationCap, Clock, Edit3, UserPlus
} from 'lucide-react';

// --- CONFIGURAÇÃO DE CONEXÃO ---
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 
const API_URL_INDICADORES = "https://script.google.com/macros/s/AKfycbxJp8-2qRibag95GfPnazUNWC-EdA8VUFYecZHg9Pp1hl5OlR3kofF-HbElRYCGcdv0/exec"; 

// --- HELPERS DE DADOS ---

const getVal = (obj, searchTerms) => {
  if (!obj) return "";
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
  if (s.includes('/')) {
    const [d, m, y] = s.split('/');
    if (!y) return null; 
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  if (s.includes('-')) {
    return new Date(s + 'T12:00:00');
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return String(dateInput || '-');
  return date.toLocaleDateString('pt-BR');
};

const calculateDetailedTime = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return { y: 0, m: 0, d: 0 };
  
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
  return { y, m, d };
};

const safeParseFloat = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const cleanValue = String(value).replace(',', '.');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
};

// --- COMPONENTES ---

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 font-sans backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn border border-slate-200">
      <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><CloseIcon size={20} className="text-slate-400 hover:text-slate-600" /></button>
      </div>
      <div className="p-8 max-h-[80vh] overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

const FileUpload = ({ onFileSelect }) => {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 6 * 1024 * 1024) {
        alert("O ficheiro excede o limite de 6MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileSelect({ name: file.name, type: file.type, base64: reader.result.split(',')[1] });
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="mt-2 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1 tracking-widest"><Paperclip size={12}/> Anexo (Foto/PDF)</label>
      <input type="file" accept="image/*,application/pdf" onChange={handleChange} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
    </div>
  );
};

const BirthdayWidget = ({ staff }) => {
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
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 bg-gradient-to-br from-pink-500 to-rose-600 text-white flex justify-between items-center">
        <h3 className="font-black flex items-center gap-2 text-xs uppercase tracking-widest"><Cake size={18} /> Aniversários do Mês</h3>
      </div>
      <div className="p-5 flex-1 overflow-y-auto max-h-[300px] space-y-3">
        {birthdays.map((p, i) => {
           const d = parseDate(getVal(p, ['nasc']));
           return (
           <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-sm font-black shadow-sm">
                 {d.getDate()}
              </div>
              <div className="flex-1">
                 <p className="text-sm font-black text-slate-800 tracking-tighter">{getVal(p, ['patente', 'posto'])} {getVal(p, ['nome'])}</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{getVal(p, ['setor'])}</p>
              </div>
           </div>
        )})}
        {birthdays.length === 0 && <p className="text-center py-10 text-slate-400 text-xs font-bold uppercase">Nenhum aniversariante</p>}
      </div>
    </div>
  );
};

// --- LOGIN ---

const LoginScreen = ({ onLogin, officersList, isLoading }) => {
  const [roleGroup, setRoleGroup] = useState('chefia');
  const [user, setUser] = useState('');
  
  const filtered = roleGroup === 'chefia' 
    ? officersList.filter(o => {
        const r = String(getVal(o, ['role'])).toLowerCase();
        const n = String(getVal(o, ['nome']));
        return r === 'admin' || r === 'rt' || n.includes('Cimirro') || n.includes('Zanini');
      }) 
    : officersList.filter(o => {
        const r = String(getVal(o, ['role'])).toLowerCase();
        const n = String(getVal(o, ['nome']));
        return r !== 'admin' && r !== 'rt' && !n.includes('Cimirro') && !n.includes('Zanini');
      });

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-10">
           <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/40">
              <Plane size={40} className="text-white transform -rotate-12"/>
           </div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">SGA-Enf HACO</h1>
           <p className="text-slate-400 text-sm mt-1 font-medium">Gestão Estratégica de Enfermagem</p>
        </div>
        
        <div className="bg-slate-100 p-1.5 rounded-2xl flex mb-8">
           <button onClick={() => setRoleGroup('chefia')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${roleGroup === 'chefia' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Chefia / RT</button>
           <button onClick={() => setRoleGroup('tropa')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${roleGroup === 'tropa' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}>Oficiais</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Identificação do Militar</label>
            <select className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all appearance-none" value={user} onChange={e => setUser(e.target.value)}>
               <option value="">{isLoading ? "A carregar dados..." : "Escolha na lista..."}</option>
               {filtered.map((o, idx) => (
                 <option key={idx} value={getVal(o, ['nome'])}>
                   {getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}
                 </option>
               ))}
            </select>
          </div>

          <button 
             onClick={() => {
                const selectedUser = officersList.find(o => getVal(o, ['nome']) === user);
                if (selectedUser) {
                   const nome = getVal(selectedUser, ['nome']);
                   let role = getVal(selectedUser, ['role']) || 'user';
                   if (nome.includes('Cimirro') || nome.includes('Zanini')) role = 'admin';
                   onLogin(nome, role);
                }
             }} 
             disabled={!user || isLoading} 
             className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 ${user ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/40' : 'bg-slate-300 cursor-not-allowed'}`}
          >
             {isLoading ? "Sincronizando..." : "Aceder ao Sistema"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SISTEMA PRINCIPAL ---

const MainSystem = ({ user, role, onLogout, globalOfficers, refreshGlobal }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showAtestadoModal, setShowAtestadoModal] = useState(false);
  const [showPermutaModal, setShowPermutaModal] = useState(false);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  
  const [formAtestado, setFormAtestado] = useState({ dias: '', inicio: '', cid: '' });
  const [formPermuta, setFormPermuta] = useState({ dataSai: '', substituto: '', dataEntra: '' });
  const [formOfficer, setFormOfficer] = useState({ id: '', nome: '', patente: '', setor: '', nascimento: '', ingresso: '', antiguidade: '', role: 'user' });
  const [fileData, setFileData] = useState(null);

  const [atestados, setAtestados] = useState([]);
  const [permutas, setPermutas] = useState([]);
  const [upiStats, setUpiStats] = useState({ leitosOcupados: 0, totalLeitos: 15, mediaBraden: 0, mediaFugulin: 0, dataReferencia: 'Carregando...' });

  const pendingAtestados = atestados.filter(a => getVal(a, ['status']) === 'Pendente').length;
  const pendingPermutas = permutas.filter(p => getVal(p, ['status']) === 'Pendente').length;

  const refreshData = async (showFeedback = true) => {
    setLoading(true);
    try {
      await refreshGlobal(); 
      const res1 = await fetch(`${API_URL_GESTAO}?action=getData`);
      if (res1.ok) {
          const data1 = await res1.json();
          if (data1.atestados) setAtestados(data1.atestados);
          if (data1.permutas) setPermutas(data1.permutas);
      }
      const res2 = await fetch(`${API_URL_INDICADORES}?action=getData`);
      if (res2.ok) {
          const data2 = await res2.json();
          if (data2.upiStats) {
             const findStat = (obj, search) => {
                const key = Object.keys(obj).find(k => k.toLowerCase().includes(search.toLowerCase()));
                return key ? obj[key] : 0;
             };
             setUpiStats({
               leitosOcupados: data2.upiStats.leitosOcupados || data2.upiStats.Ocupacao || 0,
               totalLeitos: 15,
               mediaBraden: safeParseFloat(findStat(data2.upiStats, 'braden')),
               mediaFugulin: safeParseFloat(findStat(data2.upiStats, 'fugulin')),
               dataReferencia: data2.upiStats.dataReferencia || '---'
             });
          }
      }
      if (showFeedback) alert("Banco de Dados Sincronizado!");
    } catch(e) {
      if (showFeedback) alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { refreshData(false); }, []);

  const sendData = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload })
      });
      setTimeout(() => { setIsSaving(false); refreshData(false); }, 2500); 
    } catch (e) {
      alert("Erro ao salvar.");
      setIsSaving(false);
    }
  };

  const handleHomologar = (id, type) => {
    if (role !== 'admin') return alert("Ação restrita.");
    sendData('updateStatus', { sheet: type === 'atestado' ? 'Atestados' : 'Permutas', id: id, status: 'Homologado' });
  };

  const handleSaveOfficer = (e) => {
    e.preventDefault();
    const officerToSave = {
       id: formOfficer.id || Date.now(),
       nome: formOfficer.nome,
       patente: formOfficer.patente,
       setor: formOfficer.setor,
       nascimento: formOfficer.nascimento,
       ingresso: formOfficer.ingresso,
       antiguidade: formOfficer.antiguidade,
       role: formOfficer.role
    };
    sendData('saveOfficer', officerToSave);
    setShowOfficerModal(false);
  };

  const handleDeleteOfficer = (officerName) => {
    if (window.confirm(`Tem certeza que deseja excluir ${officerName} do efetivo?`)) {
       sendData('deleteOfficer', { nome: officerName });
    }
  };

  const renderContent = () => {
    if (loading) return <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-blue-600" size={40}/>Acedendo à Nuvem...</div>;
    
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
             <div className="flex justify-between items-center"><h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Painel Estratégico</h2><button onClick={() => refreshData(true)} className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl text-blue-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all"><RefreshCw size={14}/> Sincronizar</button></div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4 bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between border border-slate-800 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={200}/></div>
                   <div className="flex items-center gap-6 mb-4 md:mb-0 relative z-10"><div className="bg-blue-600 p-5 rounded-3xl shadow-xl shadow-blue-500/20"><Activity size={32}/></div><div><h3 className="font-black text-2xl tracking-tighter uppercase">Status UPI</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Atualizado em {upiStats.dataReferencia}</p></div></div>
                   <div className="flex gap-12 text-center relative z-10">
                      <div><p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Ocupação</p><p className="text-4xl font-black text-white">{upiStats.leitosOcupados} <span className="text-lg text-slate-600 font-bold tracking-normal">/ 15</span></p></div>
                      <div><p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Média Braden</p><p className="text-4xl font-black text-yellow-400 flex items-center gap-2 justify-center">{upiStats.mediaBraden.toFixed(1)} <Thermometer size={20}/></p></div>
                      <div><p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Média Fugulin</p><p className="text-4xl font-black text-green-400 flex items-center gap-2 justify-center">{upiStats.mediaFugulin.toFixed(1)} <TrendingDown size={20}/></p></div>
                   </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 group hover:border-red-200 transition-all"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-red-500">Atestados Pendentes</p><h3 className="text-4xl font-black text-red-600">{pendingAtestados}</h3></div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 group hover:border-indigo-200 transition-all"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-indigo-500">Permutas Pendentes</p><h3 className="text-4xl font-black text-indigo-600">{pendingPermutas}</h3></div>
                <div className="md:col-span-2 row-span-2">
                   <BirthdayWidget staff={globalOfficers} />
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 md:col-span-2 flex items-center justify-between group hover:border-blue-200 transition-all"><div className="flex flex-col"><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-blue-500">Efetivo Cadastrado</p><h3 className="text-4xl font-black text-slate-800">{globalOfficers.length}</h3></div><div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all"><Users size={32}/></div></div>
             </div>
          </div>
        );
      case 'atestados':
        return (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 animate-fadeIn">
             <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 text-xl flex items-center gap-3 uppercase tracking-tighter"><ShieldAlert className="text-red-500" size={24}/> Atestados Médicos</h3>
                <button onClick={() => setShowAtestadoModal(true)} className="bg-red-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95">Novo Registro</button>
             </div>
             <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest"><tr><th className="p-5">Status</th><th className="p-5">Militar</th><th className="p-5 text-center">Duração</th><th className="p-5">Início</th><th className="p-5 text-center">Anexo</th><th className="p-5 text-right">Ação</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                   {atestados.map((a, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                       <td className="p-5"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getVal(a, ['status']) === 'Pendente' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{getVal(a, ['status'])}</span></td>
                       <td className="p-5 font-bold text-slate-800">{getVal(a, ['militar'])}</td>
                       <td className="p-5 text-center font-black text-slate-600 bg-slate-50/30">{getVal(a, ['dias']) || '-'} d</td>
                       <td className="p-5 text-slate-500 font-mono text-xs font-bold">{formatDate(getVal(a, ['inicio', 'data']))}</td>
                       <td className="p-5 text-center">{getVal(a, ['anexo']) ? <a href={getVal(a, ['anexo'])} target="_blank" className="text-blue-600 inline-block bg-blue-50 p-2.5 rounded-xl hover:bg-blue-100 transition-all"><Paperclip size={16}/></a> : '-'}</td>
                       <td className="p-5 text-right">{getVal(a, ['status']) === 'Pendente' && role === 'admin' && <button onClick={() => handleHomologar(getVal(a, ['id']), 'atestado')} className="text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Homologar</button>}</td>
                     </tr>
                   ))}
                 </tbody>
               </table></div>
          </div>
        );
      case 'efetivo':
         const sortedOfficers = [...globalOfficers].sort((a,b) => {
            const antA = parseInt(getVal(a, ['antiguidade'])) || 999;
            const antB = parseInt(getVal(b, ['antiguidade'])) || 999;
            return antA - antB;
         });

         return (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 animate-fadeIn">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 text-xl flex items-center gap-3 uppercase tracking-tighter"><Users className="text-blue-600" size={24}/> Quadro de Oficiais ({globalOfficers.length})</h3>
                <div className="flex gap-3">
                   <button onClick={() => { setFormOfficer({ id: '', nome: '', patente: '', setor: '', nascimento: '', ingresso: '', antiguidade: '', role: 'user' }); setShowOfficerModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 active:scale-95 transition-all"><UserPlus size={16}/> Incluir Militar</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-[0.15em]">
                    <tr><th className="p-5 text-center w-16">Ant.</th><th className="p-5">Posto/Nome</th><th className="p-5">Setor</th><th className="p-5 text-center">Nascimento</th><th className="p-5 text-center">Idade Detalhada</th><th className="p-5 text-center">Data de Praça</th><th className="p-5 text-center">Tempo de Serviço</th><th className="p-5 text-right">Gerir</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedOfficers.map((o, idx) => {
                      const nascimento = getVal(o, ['nasc']);
                      const ingresso = getVal(o, ['ingres']);
                      const idade = calculateDetailedTime(nascimento);
                      const servico = calculateDetailedTime(ingresso);
                      const alertaIdade = idade.y >= 45;
                      const alertaServico = servico.y >= 7;

                      return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-5 text-center font-black text-slate-400 text-lg">{getVal(o, ['antiguidade'])}</td>
                        <td className="p-5"><div className="flex flex-col"><span className="font-black text-slate-800 text-base tracking-tighter">{getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getVal(o, ['role']) || 'Oficial'}</span></div></td>
                        <td className="p-5"><span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">{getVal(o, ['setor'])}</span></td>
                        <td className="p-5 text-center text-slate-400 font-mono text-xs font-bold">{formatDate(nascimento)}</td>
                        <td className={`p-5 text-center font-bold text-xs ${alertaIdade ? 'text-red-600 bg-red-50' : 'text-slate-600'}`}>
                           <div className="flex flex-col">
                             <span className="text-base font-black">{idade.y}a</span>
                             <span className="text-[9px] uppercase">{idade.m}m {idade.d}d</span>
                           </div>
                        </td>
                        <td className="p-5 text-center text-slate-400 font-mono text-xs font-bold">{formatDate(ingresso)}</td>
                        <td className={`p-5 text-center font-bold text-xs ${alertaServico ? 'text-red-600 bg-red-50' : 'text-slate-600'}`}>
                           <div className="flex flex-col">
                             <span className="text-base font-black">{servico.y}a</span>
                             <span className="text-[9px] uppercase">{servico.m}m {servico.d}d</span>
                           </div>
                        </td>
                        <td className="p-5 text-right">
                           <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setFormOfficer({...o, nome: getVal(o, ['nome']), patente: getVal(o, ['patente','posto']), setor: getVal(o, ['setor']), nascimento: getVal(o, ['nasc']), ingresso: getVal(o, ['ingres']), antiguidade: getVal(o, ['antiguidade']), role: getVal(o, ['role']) }); setShowOfficerModal(true); }} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={16}/></button>
                              <button onClick={() => handleDeleteOfficer(getVal(o, ['nome']))} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                           </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
         );
      case 'permutas':
         return (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 animate-fadeIn">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-slate-800 text-xl flex items-center gap-3 uppercase tracking-tighter"><ArrowRightLeft className="text-indigo-500" size={24}/> Permutas de Serviço</h3>
                  <button onClick={() => setShowPermutaModal(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95">Nova Solicitação</button>
               </div>
               <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest"><tr><th className="p-5">Status</th><th className="p-5">Solicitante</th><th className="p-5">Substituto</th><th className="p-5">Saída</th><th className="p-5">Entrada</th><th className="p-5 text-center">Anexo</th><th className="p-5 text-right">Ação</th></tr></thead>
                   <tbody className="divide-y divide-slate-100">
                     {permutas.map((p, idx) => (
                       <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                         <td className="p-5"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getVal(p, ['status']) === 'Pendente' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>{getVal(p, ['status'])}</span></td>
                         <td className="p-5 font-bold text-slate-800">{getVal(p, ['solicitante'])}</td>
                         <td className="p-5 font-bold text-slate-600">{getVal(p, ['substituto'])}</td>
                         <td className="p-5 text-red-500 font-mono text-xs font-bold">{formatDate(getVal(p, ['datasai', 'sai']))}</td>
                         <td className="p-5 text-green-600 font-mono text-xs font-bold">{formatDate(getVal(p, ['dataentra', 'entra']))}</td>
                         <td className="p-5 text-center">{getVal(p, ['anexo']) ? <a href={getVal(p, ['anexo'])} target="_blank" className="text-blue-600 inline-block bg-blue-50 p-2.5 rounded-xl hover:bg-blue-100 transition-all"><Paperclip size={16}/></a> : '-'}</td>
                         <td className="p-5 text-right">{getVal(p, ['status']) === 'Pendente' && role === 'admin' && <button onClick={() => handleHomologar(getVal(p, ['id']), 'permuta')} className="text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Homologar</button>}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table></div>
            </div>
         );
      case 'agenda': return <AgendaTab user={user} />;
      default: return <div className="p-10 text-center text-slate-400 font-black">PÁGINA EM CONSTRUÇÃO...</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-24'} bg-slate-950 text-white transition-all duration-500 flex flex-col z-20 shadow-2xl`}>
         <div className="p-6 border-b border-white/5 flex items-center gap-4 h-24">{sidebarOpen && <div className="flex items-center gap-3"><div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20"><Plane size={24}/></div><span className="font-black text-xl tracking-tighter uppercase">SGA-Enf</span></div>}<button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-2 hover:bg-white/5 rounded-xl transition-colors"><Menu size={22} className="text-slate-400"/></button></div>
         <div className={`p-6 border-b border-white/5 bg-white/5 ${!sidebarOpen && 'flex justify-center'}`}><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-xl bg-blue-600 text-white text-lg border-2 border-blue-400/20">{user.substring(0,2).toUpperCase()}</div>{sidebarOpen && (<div><p className="font-black text-sm tracking-tight truncate w-40 uppercase">{user}</p><p className="text-[10px] text-blue-400 uppercase font-black tracking-widest">{role}</p></div>)}</div></div>
         <nav className="flex-1 py-8 px-4 space-y-3 overflow-y-auto">
            {[ { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard }, { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: pendingAtestados }, { id: 'permutas', label: 'Permutas Service', icon: ArrowRightLeft, badge: pendingPermutas }, { id: 'efetivo', label: 'Efetivo Oficiais', icon: Users }, { id: 'agenda', label: 'Minha Agenda', icon: BookOpen } ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
                 <div className="relative">
                    <item.icon size={22} className={activeTab === item.id ? 'scale-110' : ''}/>
                    {item.badge > 0 && <span className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-slate-950 font-black shadow-lg">{item.badge}</span>}
                 </div>
                 {sidebarOpen && <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>}
              </button>
            ))}
         </nav>
         <div className="p-6 border-t border-white/5"><button onClick={onLogout} className="flex items-center gap-4 text-slate-500 hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest w-full p-4"><LogOut size={20}/> {sidebarOpen && 'Sair do Sistema'}</button></div>
      </aside>
      
      <main className="flex-1 overflow-auto p-8 md:p-12 relative bg-slate-50/30">
         <header className="flex justify-between items-end mb-12 border-b border-slate-200 pb-8"><div className="space-y-1"><h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeTab}</h2><p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p></div></header>
         {renderContent()}

         {/* MODAL GESTÃO OFICIAL (CRUD) */}
         {showOfficerModal && (
           <Modal title={formOfficer.nome ? "Editar Militar" : "Incluir Militar"} onClose={() => setShowOfficerModal(false)}>
              <form onSubmit={handleSaveOfficer} className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Nome de Guerra</label><input type="text" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" value={formOfficer.nome} onChange={e => setFormOfficer({...formOfficer, nome: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Patente</label><input type="text" placeholder="Ex: 1º Ten Enf" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" value={formOfficer.patente} onChange={e => setFormOfficer({...formOfficer, patente: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Antiguidade</label><input type="number" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" value={formOfficer.antiguidade} onChange={e => setFormOfficer({...formOfficer, antiguidade: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Nascimento</label><input type="date" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" value={formOfficer.nascimento} onChange={e => setFormOfficer({...formOfficer, nascimento: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Ingresso (Praça)</label><input type="date" className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" value={formOfficer.ingresso} onChange={e => setFormOfficer({...formOfficer, ingresso: e.target.value})}/></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Setor</label><select className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" value={formOfficer.setor} onChange={e => setFormOfficer({...formOfficer, setor: e.target.value})}><option value="UPI">UPI</option><option value="UTI">UTI</option><option value="Chefia">Chefia</option></select></div>
                    <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Acesso</label><select className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" value={formOfficer.role} onChange={e => setFormOfficer({...formOfficer, role: e.target.value})}><option value="user">Usuário</option><option value="rt">Resp. Técnico</option><option value="admin">Administrador</option></select></div>
                 </div>
                 <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-500/20 uppercase text-xs tracking-widest mt-4 flex justify-center gap-2 transition-all active:scale-95">{isSaving ? <Loader2 className="animate-spin" /> : <Save size={18}/>} {isSaving ? "GRAVANDO..." : "SALVAR NO BANCO"}</button>
              </form>
           </Modal>
         )}

         {/* MODAIS ATESTADO / PERMUTA */}
         {showAtestadoModal && (
           <Modal title="Novo Atestado" onClose={() => setShowAtestadoModal(false)}>
              <form onSubmit={(e) => { e.preventDefault(); sendData('saveAtestado', { id: Date.now(), status: 'Pendente', militar: user, inicio: formAtestado.inicio, dias: formAtestado.dias, cid: formAtestado.cid || 'Sigiloso', file: fileData }); setShowAtestadoModal(false); }} className="space-y-4">
                 <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Data Início</label><input type="date" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" onChange={e => setFormAtestado({...formAtestado, inicio: e.target.value})}/></div>
                 <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Duração (Dias)</label><input type="number" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" onChange={e => setFormAtestado({...formAtestado, dias: e.target.value})}/></div>
                 <FileUpload onFileSelect={setFileData} /><button type="submit" disabled={isSaving} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xs tracking-widest uppercase">{isSaving ? "ENVIANDO..." : "ENVIAR PARA CHEFIA"}</button>
              </form>
           </Modal>
         )}
         {showPermutaModal && (
           <Modal title="Solicitar Permuta" onClose={() => setShowPermutaModal(false)}>
              <form onSubmit={(e) => { e.preventDefault(); sendData('savePermuta', { id: Date.now(), status: 'Pendente', solicitante: user, substituto: formPermuta.substituto, datasai: formPermuta.dataSai, dataentra: formPermuta.dataEntra, file: fileData }); setShowPermutaModal(false); }} className="space-y-4">
                 <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Data da Sua Saída</label><input type="date" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" onChange={e => setFormPermuta({...formPermuta, dataSai: e.target.value})}/></div>
                 <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Quem irá lhe substituir?</label><select className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" required onChange={e => setFormPermuta({...formPermuta, substituto: e.target.value})}><option value="">Selecione o militar...</option>{globalOfficers.map((o,idx) => <option key={idx} value={getVal(o, ['nome'])}>{getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}</option>)}</select></div>
                 <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Data que você irá entrar (Troca)</label><input type="date" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" onChange={e => setFormPermuta({...formPermuta, dataEntra: e.target.value})}/></div>
                 <FileUpload onFileSelect={setFileData} /><button type="submit" disabled={isSaving} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xs tracking-widest uppercase">{isSaving ? "ENVIANDO..." : "SOLICITAR TROCA"}</button>
              </form>
           </Modal>
         )}
      </main>
    </div>
  );
};

const UserDashboard = ({ user, onLogout }) => {
  const [showAtestadoModal, setShowAtestadoModal] = useState(false);
  const [showPermutaModal, setShowPermutaModal] = useState(false);
  const [myAtestados, setMyAtestados] = useState([]);
  const [myPermutas, setMyPermutas] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [formAtestado, setFormAtestado] = useState({ dias: '', inicio: '', cid: '' });
  const [formPermuta, setFormPermuta] = useState({ dataSai: '', substituto: '', dataEntra: '' });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL_GESTAO}?action=getData`);
      if (res.ok) {
        const data = await res.json();
        if (data.atestados) setMyAtestados(data.atestados.filter(a => getVal(a, ['militar']) && getVal(a, ['militar']).includes(user)).reverse());
        if (data.permutas) setMyPermutas(data.permutas.filter(p => getVal(p, ['solicitante']) && getVal(p, ['solicitante']).includes(user)).reverse());
        if (data.officers) setOfficers(data.officers);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const sendData = async (action, payload) => {
    setIsSaving(true);
    try {
      await fetch(API_URL_GESTAO, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload }) });
      setTimeout(() => { setIsSaving(false); fetchHistory(); }, 2500);
    } catch (e) { alert("Falha ao salvar."); setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
       <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-3xl bg-blue-600 flex items-center justify-center font-black text-white shadow-xl shadow-blue-500/30 text-xl">{user.substring(0,2).toUpperCase()}</div>
             <div><h1 className="font-black text-slate-900 text-xl tracking-tighter">Ten {user}</h1><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Acesso do Oficial</p></div>
          </div>
          <button onClick={onLogout} className="bg-slate-100 p-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"><LogOut size={22} /></button>
       </header>
       <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/30 relative overflow-hidden">
             <div className="relative z-10"><h2 className="font-black text-2xl mb-1 tracking-tighter uppercase">Bem-vindo</h2><p className="opacity-80 text-sm font-bold uppercase tracking-widest">HACO - Unidade de Gestão</p></div>
             <div className="absolute -bottom-10 -right-10 opacity-10 transform -rotate-12"><Plane size={180}/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => setShowAtestadoModal(true)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-xl active:scale-95 group"><div className="bg-red-50 p-4 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all"><ShieldAlert size={32} /></div><span className="font-black text-[10px] uppercase tracking-widest text-slate-700">Novo Atestado</span></button>
             <button onClick={() => setShowPermutaModal(true)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-xl active:scale-95 group"><div className="bg-indigo-50 p-4 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><ArrowRightLeft size={32} /></div><span className="font-black text-[10px] uppercase tracking-widest text-slate-700">Nova Permuta</span></button>
          </div>
          <div className="mt-12"><h3 className="font-black text-slate-900 text-lg mb-6 flex items-center justify-between uppercase tracking-tighter">Histórico de Pedidos <button onClick={fetchHistory} className="text-blue-600 text-[10px] hover:underline flex items-center gap-2 font-black uppercase tracking-widest"><RefreshCw size={14}/> Atualizar</button></h3>
             <div className="space-y-4">
                {myPermutas.map((p, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm"><div className="text-xs"><p className="font-black text-slate-800 text-sm mb-2 uppercase tracking-tighter">Troca com {getVal(p, ['substituto'])}</p><div className="flex gap-4 font-bold"><span className="text-red-500 bg-red-50 px-2 py-0.5 rounded text-[10px]">SAI: {formatDate(getVal(p, ['sai']))}</span><span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px]">ENTRA: {formatDate(getVal(p, ['entra']))}</span></div></div><span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest ${getVal(p, ['status']) === 'Homologado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{getVal(p, ['status'])}</span></div>
                ))}
                {myAtestados.map((a, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm"><div className="text-xs"><p className="font-black text-slate-800 text-sm mb-2 uppercase tracking-tighter">{getVal(a, ['dias']) || '-'} Dias de Afastamento</p><p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Início: {formatDate(getVal(a, ['inicio', 'data']))}</p></div><span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest ${getVal(a, ['status']) === 'Homologado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{getVal(a, ['status'])}</span></div>
                ))}
                {!loading && myAtestados.length === 0 && myPermutas.length === 0 && <div className="text-center py-20 text-slate-400 text-xs font-black uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">Nenhum registro encontrado.</div>}
             </div>
          </div>
       </main>
       {showAtestadoModal && (
         <Modal title="Novo Atestado" onClose={() => setShowAtestadoModal(false)}>
            <form onSubmit={(e) => { e.preventDefault(); sendData('saveAtestado', { id: Date.now(), status: 'Pendente', militar: user, inicio: formAtestado.inicio, dias: formAtestado.dias, cid: formAtestado.cid || 'Sigiloso', file: fileData }); setShowAtestadoModal(false); }} className="space-y-6">
               <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Data Início</label><input type="date" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" onChange={e => setFormAtestado({...formAtestado, inicio: e.target.value})}/></div>
               <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Dias</label><input type="number" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" onChange={e => setFormAtestado({...formAtestado, dias: e.target.value})}/></div>
               <FileUpload onFileSelect={setFileData} /><button type="submit" disabled={isSaving} className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-2xl active:scale-95 transition-all text-xs tracking-widest uppercase">{isSaving ? "ENVIANDO..." : "ENVIAR SOLICITAÇÃO"}</button>
            </form>
         </Modal>
       )}
       {showPermutaModal && (
         <Modal title="Nova Permuta" onClose={() => setShowPermutaModal(false)}>
            <form onSubmit={(e) => { e.preventDefault(); sendData('savePermuta', { id: Date.now(), status: 'Pendente', solicitante: user, substituto: formPermuta.substituto, datasai: formPermuta.dataSai, dataentra: formPermuta.dataEntra, file: fileData }); setShowPermutaModal(false); }} className="space-y-6">
               <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Data da Sua Saída</label><input type="date" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" onChange={e => setFormPermuta({...formPermuta, dataSai: e.target.value})}/></div>
               <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Militar Substituto</label><select className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-bold" required onChange={e => setFormPermuta({...formPermuta, substituto: e.target.value})}><option value="">Selecione...</option>{officers.map((o,idx) => <option key={idx} value={getVal(o, ['nome'])}>{getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}</option>)}</select></div>
               <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Data da Sua Volta (Troca)</label><input type="date" required className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold" onChange={e => setFormPermuta({...formPermuta, dataEntra: e.target.value})}/></div>
               <FileUpload onFileSelect={setFileData} /><button type="submit" disabled={isSaving} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-2xl active:scale-95 transition-all text-xs tracking-widest uppercase">{isSaving ? "ENVIANDO..." : "SOLICITAR TROCA"}</button>
            </form>
         </Modal>
       )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOfficers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL_GESTAO}?action=getData`);
      if (res.ok) {
        const data = await res.json();
        setOfficers(data.officers || []);
      }
    } catch (e) { console.error("Erro carga militares", e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchOfficers(); }, []);

  const handleLogin = (u, r) => { setUser(u); setRole(r); };
  const handleLogout = () => { setUser(null); setRole(null); };

  if (!user) return <LoginScreen onLogin={handleLogin} officersList={officers} isLoading={isLoading} />;
  
  if (role === 'admin' || role === 'rt') {
    return <MainSystem user={user} role={role} onLogout={handleLogout} globalOfficers={officers} refreshGlobal={fetchOfficers} />;
  }
  
  return <UserDashboard user={user} onLogout={handleLogout} />;
}
