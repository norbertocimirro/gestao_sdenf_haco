import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Sun, Palmtree, CalendarRange, Cake, BookOpen, 
  Plus, Trash2, Lock, CheckCircle, Eye, Thermometer, TrendingDown,
  Plane, Stethoscope, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, ExternalLink, GraduationCap, Clock
} from 'lucide-react';

// --- CONFIGURAÇÃO DE CONEXÃO ---
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 
const API_URL_INDICADORES = "https://script.google.com/macros/s/AKfycbxJp8-2qRibag95GfPnazUNWC-EdA8VUFYecZHg9Pp1hl5OlR3kofF-HbElRYCGcdv0/exec"; 

// --- HELPERS DE DADOS ---

// Busca valores na linha da planilha ignorando maiúsculas/minúsculas e espaços
const getVal = (obj, searchTerms) => {
  if (!obj) return "";
  const keys = Object.keys(obj);
  const foundKey = keys.find(k => 
    searchTerms.some(term => k.toLowerCase().trim() === term.toLowerCase().trim()) ||
    searchTerms.some(term => k.toLowerCase().includes(term.toLowerCase()))
  );
  return foundKey ? obj[foundKey] : "";
};

// Converte string de data para objeto Date (Suporta Brasil e ISO)
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

const calculateYears = (dateInput) => {
  const date = parseDate(dateInput);
  if (!date) return 0;
  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      years--;
  }
  return years < 0 ? 0 : years;
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
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn border border-slate-200">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800">{title}</h3>
        <button onClick={onClose}><CloseIcon size={20} className="text-slate-400 hover:text-slate-600" /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const FileUpload = ({ onFileSelect }) => {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 6 * 1024 * 1024) {
        alert("O arquivo excede o limite de 6MB.");
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
    <div className="mt-2 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
      <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Paperclip size={14}/> Anexo (Foto/PDF máx 6MB)</label>
      <input type="file" accept="image/*,application/pdf" onChange={handleChange} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
    </div>
  );
};

const LoginScreen = ({ onLogin, officersList, isLoading }) => {
  const [roleGroup, setRoleGroup] = useState('chefia');
  const [user, setUser] = useState('');
  
  const filtered = roleGroup === 'chefia' 
    ? officersList.filter(o => {
        const r = getVal(o, ['role']).toLowerCase();
        const n = getVal(o, ['nome']);
        return r === 'admin' || r === 'rt' || n === 'Cimirro' || n === 'Zanini';
      }) 
    : officersList.filter(o => {
        const r = getVal(o, ['role']).toLowerCase();
        return r !== 'admin' && r !== 'rt';
      });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
           <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Plane size={32} className="text-white"/>
           </div>
           <h1 className="text-2xl font-bold text-slate-800">SGA-Enf HACO</h1>
           <p className="text-slate-500 text-sm">Gestão de Enfermagem</p>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
           <button onClick={() => setRoleGroup('chefia')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${roleGroup === 'chefia' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Chefia / RT</button>
           <button onClick={() => setRoleGroup('tropa')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${roleGroup === 'tropa' ? 'bg-white shadow text-slate-700' : 'text-slate-400'}`}>Oficiais</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Militar</label>
            <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none" value={user} onChange={e => setUser(e.target.value)}>
               <option value="">{isLoading ? "A carregar militares..." : "Selecione..."}</option>
               {filtered.map((o, idx) => (
                 <option key={idx} value={getVal(o, ['nome'])}>
                   {getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}
                 </option>
               ))}
               {!isLoading && filtered.length === 0 && <option value="">Nenhum militar encontrado na planilha.</option>}
            </select>
          </div>

          <button 
             onClick={() => {
                const selectedUser = officersList.find(o => getVal(o, ['nome']) === user);
                if (selectedUser) onLogin(getVal(selectedUser, ['nome']), getVal(selectedUser, ['role']) || 'user');
             }} 
             disabled={!user || isLoading} 
             className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${user ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-slate-300 cursor-not-allowed'}`}
          >
             {isLoading ? "SINCRONIZANDO..." : "ACESSAR SISTEMA"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MainSystem = ({ user, role, onLogout, globalOfficers, refreshGlobal }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showAtestadoModal, setShowAtestadoModal] = useState(false);
  const [showPermutaModal, setShowPermutaModal] = useState(false);
  
  const [formAtestado, setFormAtestado] = useState({ dias: '', inicio: '', cid: '' });
  const [formPermuta, setFormPermuta] = useState({ dataSai: '', substituto: '', dataEntra: '' });
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
      if (showFeedback) alert("Sincronizado!");
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

  const renderContent = () => {
    if (loading) return <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-blue-600" size={40}/>Sincronizando com Banco de Dados...</div>;
    
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
             <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Painel Geral</h2><button onClick={() => refreshData(true)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-blue-600 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"><RefreshCw size={14}/> Sincronizar</button></div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4 bg-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between border border-slate-700">
                   <div className="flex items-center gap-4 mb-4 md:mb-0"><div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20"><Activity size={28}/></div><div><h3 className="font-bold text-xl">Monitoramento UPI</h3><p className="text-slate-400 text-xs">Atualizado em {upiStats.dataReferencia}</p></div></div>
                   <div className="flex gap-10 text-center">
                      <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Ocupação</p><p className="text-3xl font-bold text-white">{upiStats.leitosOcupados} <span className="text-sm text-slate-500 font-normal">/ 15</span></p></div>
                      <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Média Braden</p><p className="text-3xl font-bold text-yellow-400 flex items-center gap-1 justify-center">{upiStats.mediaBraden.toFixed(1)} <Thermometer size={18}/></p></div>
                      <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Média Fugulin</p><p className="text-3xl font-bold text-green-400 flex items-center gap-1 justify-center">{upiStats.mediaFugulin.toFixed(1)} <TrendingDown size={18}/></p></div>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-slate-500 text-xs uppercase font-bold mb-1">Pendências</p><h3 className="text-3xl font-bold text-red-600">{pendingAtestados + pendingPermutas}</h3></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-slate-500 text-xs uppercase font-bold mb-1">Efetivo</p><h3 className="text-3xl font-bold text-slate-800">{globalOfficers.length}</h3></div>
                <div className="md:col-span-2"><div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-full flex items-center justify-center text-slate-400 text-xs uppercase font-bold tracking-widest">Gráfico de Indicadores Mensais</div></div>
             </div>
          </div>
        );
      case 'atestados':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fadeIn">
             <div className="flex justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><ShieldAlert className="text-red-500"/> Atestados</h3>
                <button onClick={() => setShowAtestadoModal(true)} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95">Novo Registro</button>
             </div>
             <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider"><tr><th className="p-4">Status</th><th className="p-4">Militar</th><th className="p-4">Duração</th><th className="p-4">Data</th><th className="p-4 text-center">Anexo</th><th className="p-4">Ação</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                   {atestados.map((a, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 transition-colors">
                       <td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${getVal(a, ['status']) === 'Pendente' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{getVal(a, ['status'])}</span></td>
                       <td className="p-4 font-bold text-slate-700">{getVal(a, ['militar'])}</td>
                       <td className="p-4 font-medium text-slate-600">{getVal(a, ['dias']) || '-'} dias</td>
                       <td className="p-4 text-slate-500 font-mono">{formatDate(getVal(a, ['inicio', 'data']))}</td>
                       <td className="p-4 text-center">{getVal(a, ['anexo']) ? <a href={getVal(a, ['anexo'])} target="_blank" className="text-blue-600 inline-block bg-blue-50 p-2 rounded-lg"><Paperclip size={14}/></a> : '-'}</td>
                       <td className="p-4">{getVal(a, ['status']) === 'Pendente' && role === 'admin' && <button onClick={() => handleHomologar(getVal(a, ['id']), 'atestado')} className="text-blue-600 font-bold hover:underline transition-all">Homologar</button>}</td>
                     </tr>
                   ))}
                 </tbody>
               </table></div>
          </div>
        );
      case 'efetivo':
         return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Users className="text-blue-600"/> Efetivo de Oficiais ({globalOfficers.length})</h3>
                <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 border border-red-100 shadow-sm"><AlertCircle size={14}/> Alertas: Idade $\ge 45$ | Serviço $\ge 7$</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr><th className="p-4">Posto/Nome</th><th className="p-4">Setor</th><th className="p-4 text-center">Nascimento</th><th className="p-4 text-center">Idade</th><th className="p-4 text-center">Ingresso</th><th className="p-4 text-center">Serviço</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {globalOfficers.map((o, idx) => {
                      const nascimento = getVal(o, ['nasc']);
                      const ingresso = getVal(o, ['ingres']);
                      const idade = calculateYears(nascimento);
                      const servico = calculateYears(ingresso);
                      const alertaIdade = idade >= 45;
                      const alertaServico = servico >= 7;

                      return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4"><div className="flex flex-col"><span className="font-bold text-slate-700">{getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}</span></div></td>
                        <td className="p-4"><span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{getVal(o, ['setor'])}</span></td>
                        <td className="p-4 text-center text-slate-500 font-mono text-xs">{formatDate(nascimento)}</td>
                        <td className={`p-4 text-center font-bold text-lg ${alertaIdade ? 'text-red-600 bg-red-50' : 'text-slate-600'}`}>{idade}</td>
                        <td className="p-4 text-center text-slate-500 font-mono text-xs">{formatDate(ingresso)}</td>
                        <td className={`p-4 text-center font-bold text-lg ${alertaServico ? 'text-red-600 bg-red-50' : 'text-slate-600'}`}>{servico}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
         );
      case 'agenda': return <AgendaTab user={user} />;
      default: return <div className="p-10 text-center text-slate-400 uppercase font-black tracking-tighter">Página em construção...</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col z-20 shadow-2xl`}>
         <div className="p-5 border-b border-slate-800 flex items-center gap-3 h-20">{sidebarOpen && <span className="font-bold text-lg tracking-tight">SGA-Enf HACO</span>}<button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-slate-400 hover:text-white transition-colors"><Menu size={20}/></button></div>
         <div className={`p-5 border-b border-slate-800 bg-slate-800/30 ${!sidebarOpen && 'flex justify-center'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-lg bg-blue-600 border border-blue-400/30">{user.substring(0,2).toUpperCase()}</div>{sidebarOpen && (<div><p className="font-bold text-sm truncate w-32">{user}</p><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{role}</p></div>)}</div></div>
         <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
            {[ { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard }, { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: pendingAtestados }, { id: 'permutas', label: 'Permutas', icon: ArrowRightLeft, badge: pendingPermutas }, { id: 'efetivo', label: 'Efetivo', icon: Users }, { id: 'agenda', label: 'Minha Agenda', icon: BookOpen } ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all relative group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <div className="relative"><item.icon size={20}/>{item.badge > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-slate-900 font-bold">{item.badge}</span>}</div>
                 {sidebarOpen && <span className="text-sm font-bold">{item.label}</span>}
              </button>
            ))}
         </nav>
         <div className="p-4 border-t border-slate-800"><button onClick={onLogout} className="flex items-center gap-3 text-slate-500 hover:text-red-400 transition-colors font-bold text-sm w-full p-3"><LogOut size={18}/> {sidebarOpen && 'Sair do Sistema'}</button></div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-10 relative bg-slate-50/50">
         <header className="flex justify-between items-center mb-10 border-b border-slate-200 pb-6"><div><h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{activeTab}</h2><p className="text-slate-500 text-sm font-medium">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p></div></header>
         {renderContent()}
         {showAtestadoModal && (
           <Modal title="Novo Atestado" onClose={() => setShowAtestadoModal(false)}>
              <form onSubmit={(e) => { e.preventDefault(); sendData('saveAtestado', { id: Date.now(), status: 'Pendente', militar: user, inicio: formAtestado.inicio, dias: formAtestado.dias, cid: formAtestado.cid || 'Sigiloso', file: fileData }); setShowAtestadoModal(false); }} className="space-y-4">
                 <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Data Início</label><input type="date" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" onChange={e => setFormAtestado({...formAtestado, inicio: e.target.value})}/></div>
                 <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Dias</label><input type="number" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" onChange={e => setFormAtestado({...formAtestado, dias: e.target.value})}/></div>
                 <FileUpload onFileSelect={setFileData} /><button type="submit" disabled={isSaving} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">{isSaving ? "ENVIANDO..." : "ENVIAR SOLICITAÇÃO"}</button>
              </form>
           </Modal>
         )}
         {showPermutaModal && (
           <Modal title="Nova Permuta" onClose={() => setShowPermutaModal(false)}>
              <form onSubmit={(e) => { e.preventDefault(); sendData('savePermuta', { id: Date.now(), status: 'Pendente', solicitante: user, substituto: formPermuta.substituto, datasai: formPermuta.dataSai, dataentra: formPermuta.dataEntra, file: fileData }); setShowPermutaModal(false); }} className="space-y-4">
                 <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data da Saída</label><input type="date" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" onChange={e => setFormPermuta({...formPermuta, dataSai: e.target.value})}/></div>
                 <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Substituto</label><select className="w-full p-3 rounded-xl border border-slate-200 bg-white" required onChange={e => setFormPermuta({...formPermuta, substituto: e.target.value})}><option value="">Selecione...</option>{globalOfficers.map((o,idx) => <option key={idx} value={getVal(o, ['nome'])}>{getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}</option>)}</select></div>
                 <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data da Entrada</label><input type="date" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" onChange={e => setFormPermuta({...formPermuta, dataEntra: e.target.value})}/></div>
                 <FileUpload onFileSelect={setFileData} /><button type="submit" disabled={isSaving} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">{isSaving ? "ENVIANDO..." : "SOLICITAR PERMUTA"}</button>
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
       <header className="bg-white border-b border-slate-200 p-5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">{user.substring(0,2).toUpperCase()}</div>
             <div><h1 className="font-bold text-slate-800 text-lg">Ten {user}</h1><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Portal do Oficial</p></div>
          </div>
          <button onClick={onLogout} className="bg-slate-100 p-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><LogOut size={20} /></button>
       </header>
       <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-6">
          <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-xl shadow-blue-500/20 relative overflow-hidden"><div className="relative z-10"><h2 className="font-bold text-xl mb-1 tracking-tight">Bem-vindo ao SGA-Enf</h2><p className="opacity-80 text-sm font-medium">Controle as suas solicitações de forma digital.</p></div><div className="absolute -bottom-6 -right-6 opacity-10 transform -rotate-12"><Plane size={120}/></div></div>
          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => setShowAtestadoModal(true)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md active:scale-95"><div className="bg-red-50 p-3 rounded-xl"><ShieldAlert className="text-red-500" size={28} /></div><span className="font-bold text-sm text-slate-700">Novo Atestado</span></button>
             <button onClick={() => setShowPermutaModal(true)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md active:scale-95"><div className="bg-indigo-50 p-3 rounded-xl"><ArrowRightLeft className="text-indigo-500" size={28} /></div><span className="font-bold text-sm text-slate-700">Nova Permuta</span></button>
          </div>
          <div className="mt-10"><h3 className="font-black text-slate-800 text-lg mb-4 flex items-center justify-between uppercase tracking-tighter">Meus Registros <button onClick={fetchHistory} className="text-blue-600 text-xs hover:underline flex items-center gap-1 font-bold"><RefreshCw size={12}/> Atualizar</button></h3>
             <div className="space-y-3">
                {myPermutas.map((p, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm"><div className="text-xs"><p className="font-bold text-slate-800 text-sm mb-1">Troca com {getVal(p, ['substituto'])}</p><div className="flex gap-3 font-mono"><span className="text-red-500">S: {formatDate(getVal(p, ['sai']))}</span> <span className="text-green-600">E: {formatDate(getVal(p, ['entra']))}</span></div></div><span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase ${getVal(p, ['status']) === 'Homologado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{getVal(p, ['status'])}</span></div>
                ))}
                {myAtestados.map((a, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm"><div className="text-xs"><p className="font-bold text-slate-800 text-sm mb-1">{getVal(a, ['dias']) || '-'} Dias de Afastamento</p><p className="text-slate-500 font-mono">Início: {formatDate(getVal(a, ['inicio', 'data']))}</p></div><span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase ${getVal(a, ['status']) === 'Homologado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{getVal(a, ['status'])}</span></div>
                ))}
                {!loading && myAtestados.length === 0 && myPermutas.length === 0 && <div className="text-center py-16 text-slate-400 text-sm border border-dashed border-slate-300 rounded-2xl bg-slate-50 font-medium">Nenhum registro encontrado.</div>}
             </div>
          </div>
       </main>
       {showAtestadoModal && (
         <Modal title="Novo Atestado" onClose={() => setShowAtestadoModal(false)}>
            <form onSubmit={(e) => { e.preventDefault(); sendData('saveAtestado', { id: Date.now(), status: 'Pendente', militar: user, inicio: formAtestado.inicio, dias: formAtestado.dias, cid: formAtestado.cid || 'Sigiloso', file: fileData }); setShowAtestadoModal(false); }} className="space-y-4">
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Data Início</label><input type="date" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" onChange={e => setFormAtestado({...formAtestado, inicio: e.target.value})}/></div>
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Dias</label><input type="number" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" onChange={e => setFormAtestado({...formAtestado, dias: e.target.value})}/></div>
               <FileUpload onFileSelect={setFileData} /><button type="submit" disabled={isSaving} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">{isSaving ? "ENVIANDO..." : "ENVIAR SOLICITAÇÃO"}</button>
            </form>
         </Modal>
       )}
       {showPermutaModal && (
         <Modal title="Nova Permuta" onClose={() => setShowPermutaModal(false)}>
            <form onSubmit={(e) => { e.preventDefault(); sendData('savePermuta', { id: Date.now(), status: 'Pendente', solicitante: user, substituto: formPermuta.substituto, datasai: formPermuta.dataSai, dataentra: formPermuta.dataEntra, file: fileData }); setShowPermutaModal(false); }} className="space-y-4">
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data da Saída</label><input type="date" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" onChange={e => setFormPermuta({...formPermuta, dataSai: e.target.value})}/></div>
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Substituto</label><select className="w-full p-3 rounded-xl border border-slate-200 bg-white" required onChange={e => setFormPermuta({...formPermuta, substituto: e.target.value})}><option value="">Selecione...</option>{officers.map((o,idx) => <option key={idx} value={getVal(o, ['nome'])}>{getVal(o, ['patente', 'posto'])} {getVal(o, ['nome'])}</option>)}</select></div>
               <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Data da Entrada</label><input type="date" required className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50" onChange={e => setFormPermuta({...formPermuta, dataEntra: e.target.value})}/></div>
               <FileUpload onFileSelect={setFileData} /><button type="submit" disabled={isSaving} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">{isSaving ? "ENVIANDO..." : "SOLICITAR PERMUTA"}</button>
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
        // Aqui está a chave: se data.officers vier vazio, o estado 'officers' ficará vazio.
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
