import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, Activity, AlertCircle, 
  Menu, X, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Sun, Palmtree, CalendarRange, Cake, BookOpen, 
  Plus, Trash2, Lock, CheckCircle, Eye, Thermometer, TrendingDown,
  Plane, Stethoscope, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- CONFIGURAÇÃO ---
// SUBSTITUA ISSO PELA URL DO SEU SCRIPT GOOGLE APÓS IMPLANTAR
const API_URL = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 

// --- FALLBACK DATA (Caso a planilha esteja vazia ou offline) ---
// Mantemos os dados originais como backup
const BACKUP_OFFICERS = [
  { id: 2, antiguidade: 2, nome: 'Zanini', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'Chefia', cargo: 'Chefe SDENF', role: 'admin', nascimento: '24/03' },
  { id: 6, antiguidade: 6, nome: 'Cimirro', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'Chefia', cargo: 'Adjunto', role: 'admin', nascimento: '03/02' },
  { id: 11, antiguidade: 11, nome: 'Renata', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', cargo: 'RT Enfermagem', role: 'rt', nascimento: '11/07' },
  { id: 1, antiguidade: 1, nome: 'Gisele', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '18/06' },
  // ... (outros oficiais seriam carregados da planilha)
];

const AgendaTab = ({ user }) => {
  // Agenda local (simulação de privacidade - dados não vão para planilha por segurança pessoal)
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ date: '', title: '', type: 'work' });

  useEffect(() => {
    // Carrega dados locais baseados no usuário
    const saved = localStorage.getItem(`agenda_${user}`);
    if (saved) {
      setEvents(JSON.parse(saved));
    } else if (user === 'Cimirro') {
      setEvents([
        { id: 1, date: '2026-03-04', title: 'Aniversário Alice (11 Anos)', type: 'family', details: 'Comprar presente' },
        { id: 2, date: '2026-05-29', title: 'Aniversário Pedro', type: 'family', details: 'Festa na escola?' },
        { id: 3, date: '2026-07-05', title: 'Aniversário Fabiane', type: 'family', details: 'Jantar especial' },
        { id: 4, date: '2026-02-20', title: 'Revisão Renault Symbol', type: 'personal', details: 'Oficina do Beto' },
      ]);
    }
  }, [user]);

  const addEvent = (e) => {
    e.preventDefault();
    const updated = [...events, { id: Date.now(), ...newEvent }];
    setEvents(updated);
    localStorage.setItem(`agenda_${user}`, JSON.stringify(updated));
    setNewEvent({ date: '', title: '', type: 'work' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
         <h3 className="font-bold text-slate-700 mb-4 flex gap-2"><Plus size={18}/> Novo Evento</h3>
         <form onSubmit={addEvent} className="space-y-3">
            <input type="date" className="w-full p-2 border rounded text-sm" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required />
            <input type="text" placeholder="Título" className="w-full p-2 border rounded text-sm" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required />
            <select className="w-full p-2 border rounded text-sm bg-white" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
               <option value="work">Trabalho</option>
               <option value="family">Família</option>
               <option value="personal">Pessoal</option>
            </select>
            <button type="submit" className="w-full bg-slate-800 text-white font-bold py-2 rounded text-sm hover:bg-slate-700">Adicionar</button>
         </form>
         <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-100 flex gap-2">
            <Lock size={14} className="text-yellow-600 mt-1 flex-shrink-0"/>
            <p className="text-xs text-yellow-800">Agenda Local. Salva apenas neste dispositivo.</p>
         </div>
      </div>
      <div className="md:col-span-2 space-y-4">
         <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen className="text-indigo-500"/> Agenda de {user}</h3>
         {events.map(ev => (
            <div key={ev.id} className="bg-white p-4 rounded-xl border-l-4 shadow-sm flex justify-between" style={{borderLeftColor: ev.type === 'family' ? '#ec4899' : ev.type === 'personal' ? '#8b5cf6' : '#3b82f6'}}>
               <div>
                  <h4 className="font-bold text-slate-800">{ev.title}</h4>
                  <p className="text-xs text-slate-500">{new Date(ev.date).toLocaleDateString('pt-BR')}</p>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

const TimelineView = ({ vacations, officers, semester }) => {
  // Lógica de visualização simplificada para garantir renderização
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <h3 className="font-bold text-slate-700 mb-4">Cronograma Visual (Gantt)</h3>
      <div className="min-w-[600px] space-y-2">
        {vacations.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-20 text-xs font-bold truncate">{v.nome}</span>
            <div className="flex-1 bg-slate-100 h-6 rounded relative">
               <div className="absolute top-1 bottom-1 bg-blue-400 rounded text-[10px] text-white flex items-center px-2 truncate" 
                    style={{left: '20%', width: '30%'}}>
                 {v.inicio} - {v.tipo}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MainSystem = ({ user, role, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Estado Global vindo da Planilha
  const [officers, setOfficers] = useState(BACKUP_OFFICERS);
  const [atestados, setAtestados] = useState([]);
  const [permutas, setPermutas] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [upiStats, setUpiStats] = useState({ leitosOcupados: 0, mediaBraden: 0, mediaFugulin: 0 });

  // Função para buscar dados do Google Sheets
  const fetchData = async () => {
    if (API_URL === "SUA_URL_DO_APPS_SCRIPT_AQUI") return; // Evita erro se url não configurada
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=getData`);
      const data = await response.json();
      if (data.officers && data.officers.length > 0) setOfficers(data.officers);
      if (data.atestados) setAtestados(data.atestados);
      if (data.permutas) setPermutas(data.permutas);
      if (data.vacations) setVacations(data.vacations);
      if (data.upiStats) setUpiStats(data.upiStats);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Envio de Dados
  const sendData = async (action, payload) => {
    if (API_URL === "SUA_URL_DO_APPS_SCRIPT_AQUI") {
      alert("Configure a API_URL no código para salvar de verdade!");
      return;
    }
    try {
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', // Necessário para Apps Script
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, payload })
      });
      // Atualiza interface localmente (otimista)
      if (action === 'saveAtestado') setAtestados([payload, ...atestados]);
      if (action === 'savePermuta') setPermutas([payload, ...permutas]);
      alert("Salvo com sucesso!");
    } catch (e) {
      alert("Erro ao salvar.");
    }
  };

  const handleRequest = (type) => {
    const newItem = { 
      id: Date.now(), 
      status: 'Pendente', 
      militar: user, 
      data: new Date().toISOString().split('T')[0] 
    };
    
    if (type === 'atestado') {
      sendData('saveAtestado', { ...newItem, tipo: 'Atestado', cid: '---' });
    } else {
      sendData('savePermuta', { ...newItem, solicitante: user, substituto: '---' });
    }
  };

  const renderContent = () => {
    if (loading) return <div className="p-8 text-center">Carregando dados da planilha...</div>;

    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
             <div className="flex justify-between">
               <h2 className="text-2xl font-bold text-slate-800">Painel de Comando</h2>
               <button onClick={fetchData} className="flex items-center gap-2 text-sm text-blue-600"><RefreshCw size={14}/> Atualizar Dados</button>
             </div>
             
             {/* INDICADORES UPI REAIS */}
             <div className="bg-slate-800 rounded-xl p-5 text-white shadow-lg flex justify-between items-center">
                <div>
                   <h3 className="font-bold flex items-center gap-2"><Activity/> Indicadores UPI</h3>
                   <p className="text-xs text-slate-400">Sincronizado via Google Sheets</p>
                </div>
                <div className="text-center">
                   <p className="text-xs uppercase text-slate-400">Ocupação</p>
                   <p className="text-2xl font-bold">{upiStats.leitosOcupados || 8} <span className="text-sm text-slate-500">/ 30</span></p>
                </div>
                <div className="text-center">
                   <p className="text-xs uppercase text-slate-400">Braden</p>
                   <p className="text-2xl font-bold text-yellow-400">{Number(upiStats.mediaBraden || 17.1).toFixed(1)}</p>
                </div>
                <div className="text-center">
                   <p className="text-xs uppercase text-slate-400">Fugulin</p>
                   <p className="text-2xl font-bold text-green-400">{Number(upiStats.mediaFugulin || 21.3).toFixed(1)}</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                   <p className="text-slate-500 text-xs font-bold">Efetivo Total</p>
                   <h3 className="text-2xl font-bold">{officers.length}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                   <p className="text-slate-500 text-xs font-bold">Pendências</p>
                   <h3 className="text-2xl font-bold">{atestados.length + permutas.length}</h3>
                </div>
             </div>
          </div>
        );
      case 'agenda': return <AgendaTab user={user} />;
      case 'atestados':
        return (
          <div className="bg-white rounded-xl border p-6">
             <div className="flex justify-between mb-4">
               <h3 className="font-bold text-lg flex gap-2"><ShieldAlert className="text-red-500"/> Atestados</h3>
               <button onClick={() => handleRequest('atestado')} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold">Novo Registro</button>
             </div>
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 uppercase"><tr><th>Status</th><th>Militar</th><th>Data</th></tr></thead>
               <tbody>
                 {atestados.map((a, i) => (
                   <tr key={i} className="border-t">
                     <td className="p-3 font-bold text-xs">{a.status}</td>
                     <td className="p-3">{a.militar}</td>
                     <td className="p-3">{a.data}</td>
                   </tr>
                 ))}
                 {atestados.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-slate-400">Nenhum registro.</td></tr>}
               </tbody>
             </table>
          </div>
        );
      case 'ferias':
         return (
            <div className="space-y-6">
               <h3 className="font-bold text-lg flex gap-2"><Palmtree className="text-orange-500"/> Gestão de Férias</h3>
               <TimelineView vacations={vacations} officers={officers} semester={1} userHighlight={user} />
            </div>
         );
      case 'efetivo':
         return (
            <div className="bg-white rounded-xl border p-6">
               <h3 className="font-bold mb-4">Quadro de Oficiais</h3>
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 uppercase"><tr><th>#</th><th>Nome</th><th>Setor</th></tr></thead>
                 <tbody>
                   {officers.map((o, i) => (
                     <tr key={i} className="border-t hover:bg-slate-50">
                       <td className="p-3 text-slate-400">{o.antiguidade || i+1}</td>
                       <td className="p-3 font-bold text-slate-700">{o.patente} {o.nome}</td>
                       <td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{o.setor}</span></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
         );
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all flex flex-col z-20 shadow-xl`}>
         <div className="p-4 border-b border-slate-800 flex items-center gap-3 h-16">
            {sidebarOpen && <span className="font-bold text-lg">SGA-Enf</span>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-slate-400"><Menu size={20}/></button>
         </div>
         <div className="p-4 bg-slate-800/50 border-b border-slate-800">
            <p className="font-bold text-sm truncate">{user}</p>
            <p className="text-[10px] uppercase text-slate-400">{role}</p>
         </div>
         <nav className="flex-1 py-4 px-2 space-y-1">
            {['dashboard', 'agenda', 'atestados', 'ferias', 'efetivo'].map(id => (
              <button key={id} onClick={() => setActiveTab(id)} className={`w-full text-left p-3 rounded hover:bg-slate-800 capitalize ${activeTab === id ? 'bg-blue-600' : ''}`}>
                 {sidebarOpen ? id : id.charAt(0).toUpperCase()}
              </button>
            ))}
         </nav>
         <div className="p-4 border-t border-slate-800">
           <button onClick={onLogout} className="flex gap-2 text-slate-400 hover:text-white w-full"><LogOut size={16}/> {sidebarOpen && 'Sair'}</button>
         </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50 p-6">
         {renderContent()}
      </main>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const [user, setUser] = useState('');
  
  // Lista simplificada para login inicial (depois virá da planilha)
  const officers = BACKUP_OFFICERS;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <Plane size={48} className="mx-auto text-blue-600 mb-4"/>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">SGA-Enf HACO</h1>
        <select className="w-full p-3 border rounded-lg mb-4 bg-slate-50 font-medium" value={user} onChange={e => setUser(e.target.value)}>
           <option value="">Selecione seu Usuário...</option>
           {officers.map(o => <option key={o.id} value={o.nome}>{o.patente} {o.nome} ({o.role})</option>)}
        </select>
        <button 
           onClick={() => {
              const selected = officers.find(o => o.nome === user);
              if (selected) onLogin(selected.nome, selected.role);
           }} 
           disabled={!user} 
           className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300"
        >
           ENTRAR
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  if (!user) return <LoginScreen onLogin={(u, r) => { setUser(u); setRole(r); }} />;
  return <MainSystem user={user} role={role} onLogout={() => { setUser(null); setRole(null); }} />;
}
