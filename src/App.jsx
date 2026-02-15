import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Sun, Palmtree, CalendarRange, Cake, BookOpen, 
  Plus, Trash2, Lock, CheckCircle, Eye, Thermometer, TrendingDown,
  Plane, Stethoscope, RefreshCw, Send, X as CloseIcon, Save
} from 'lucide-react';

// --- CONFIGURAÇÃO ---
// ATENÇÃO: Configure as URLs dos Scripts (Web Apps) aqui
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 
const API_URL_INDICADORES = "https://script.google.com/macros/s/AKfycbxJp8-2qRibag95GfPnazUNWC-EdA8VUFYecZHg9Pp1hl5OlR3kofF-HbElRYCGcdv0/exec"; 

// --- DADOS REAIS (SNAPSHOT) ---

const REAL_OFFICERS = [
  // CHEFIA
  { id: 2, antiguidade: 2, nome: 'Zanini', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'Chefia', cargo: 'Chefe SDENF', role: 'admin', nascimento: '24/03' },
  { id: 6, antiguidade: 6, nome: 'Cimirro', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'Chefia', cargo: 'Adjunto', role: 'admin', nascimento: '03/02' },
  { id: 11, antiguidade: 11, nome: 'Renata', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', cargo: 'RT Enfermagem', role: 'rt', nascimento: '11/07' },
  // TROPA
  { id: 1, antiguidade: 1, nome: 'Gisele', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '18/06' },
  { id: 3, antiguidade: 3, nome: 'Marasca', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '11/04' },
  { id: 4, antiguidade: 4, nome: 'Serafin', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '26/02' },
  { id: 5, antiguidade: 5, nome: 'Sandri', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '11/09' },
  { id: 7, antiguidade: 7, nome: 'Parode', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '12/02' },
  { id: 8, antiguidade: 8, nome: 'Oliveira', patente: '1º Ten Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '20/08' },
  { id: 9, antiguidade: 9, nome: 'Karen Casarin', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '16/02' },
  { id: 10, antiguidade: 10, nome: 'Luiziane', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '20/04' },
  { id: 12, antiguidade: 12, nome: 'Jéssica Cunha', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '23/06' },
  { id: 13, antiguidade: 13, nome: 'Suelen Stiehl', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '13/03' },
  { id: 14, antiguidade: 14, nome: 'Pâmela Maia', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '24/04' },
  { id: 15, antiguidade: 15, nome: 'Favilla', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '10/04' },
  { id: 16, antiguidade: 16, nome: 'Jéssica', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '15/09' },
  { id: 17, antiguidade: 17, nome: 'Zomer', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '20/06' },
  { id: 18, antiguidade: 18, nome: 'Laura Elisa', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '11/06' },
  { id: 19, antiguidade: 19, nome: 'Bárbara Viegas', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '17/04' },
  { id: 20, antiguidade: 20, nome: 'Bárbara Figueiredo', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '26/10' },
  { id: 21, antiguidade: 21, nome: 'Anderson', patente: '2º Ten Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '19/05' },
  { id: 22, antiguidade: 22, nome: 'Cássia Freitas', patente: 'Asp Of Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '09/07' },
  { id: 23, antiguidade: 23, nome: 'Nascimento', patente: 'Asp Of Enf', quadro: 'Oficiais', setor: 'UPI', role: 'user', nascimento: '03/06' },
  { id: 24, antiguidade: 24, nome: 'Jéssica', patente: 'Asp Of Enf', quadro: 'Oficiais', setor: 'UTI', role: 'user', nascimento: '04/07' }
];

const INITIAL_VACATIONS = [
  { id: 1, nome: 'Cimirro', inicio: '2026-03-02', fim: '2026-03-11', tipo: '10 dias', status: 'Confirmado' },
  { id: 2, nome: 'Cimirro', inicio: '2026-06-24', fim: '2026-07-03', tipo: '10 dias', status: 'Confirmado' },
  { id: 3, nome: 'Marasca', inicio: '2026-01-26', fim: '2026-02-09', tipo: '15 dias', status: 'Realizado' },
  { id: 4, nome: 'Serafin', inicio: '2026-01-05', fim: '2026-01-19', tipo: '15 dias', status: 'Realizado' },
  { id: 5, nome: 'Serafin', inicio: '2026-04-06', fim: '2026-04-20', tipo: '15 dias', status: 'Confirmado' },
  { id: 6, nome: 'Karen Casarin', inicio: '2026-04-22', fim: '2026-05-11', tipo: '20 dias', status: 'Confirmado' },
  { id: 7, nome: 'Sandri', inicio: '2026-02-18', fim: '2026-02-27', tipo: '10 dias', status: 'Confirmado' },
  { id: 8, nome: 'Zomer', inicio: '2026-02-10', fim: '2026-02-24', tipo: '15 dias', status: 'Confirmado' },
  { id: 9, nome: 'Luiziane', inicio: '2026-06-01', fim: '2026-06-15', tipo: '15 dias', status: 'Confirmado' },
];

// Dados iniciais zerados para forçar leitura correta da API
const INITIAL_UPI_STATS = {
  leitosOcupados: 8, 
  totalLeitos: 15,
  mediaBraden: 0, // Zerado para indicar que virá da API
  mediaFugulin: 0, // Zerado para indicar que virá da API
  dataReferencia: 'Aguardando...'
};

const INITIAL_ATESTADOS = [
  { id: 101, militar: 'Cb SEF Pereira', tipo: 'Atestado', cid: 'M54', inicio: '2026-02-10', fim: '2026-02-12', status: 'Homologado' },
];
const INITIAL_PERMUTAS = [];

// --- HELPER DATE ---
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR');
};

// --- COMPONENTES ---

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800">{title}</h3>
        <button onClick={onClose}><CloseIcon size={20} className="text-slate-400 hover:text-slate-600" /></button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

const LoginScreen = ({ onLogin }) => {
  const [roleGroup, setRoleGroup] = useState('chefia');
  const [user, setUser] = useState('');
  
  const chefiaList = REAL_OFFICERS.filter(o => o.role === 'admin' || o.role === 'rt');
  const tropaList = REAL_OFFICERS.filter(o => o.role === 'user');
  const filteredOfficers = roleGroup === 'chefia' ? chefiaList : tropaList;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
           <Plane size={48} className="mx-auto text-blue-600 mb-2"/>
           <h1 className="text-2xl font-bold text-slate-800">SGA-Enf HACO</h1>
           <p className="text-slate-500">Sistema de Gestão de Enfermagem</p>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-lg flex mb-4">
           <button onClick={() => setRoleGroup('chefia')} className={`flex-1 py-2 text-sm font-bold rounded ${roleGroup === 'chefia' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Chefia / RT</button>
           <button onClick={() => setRoleGroup('tropa')} className={`flex-1 py-2 text-sm font-bold rounded ${roleGroup === 'tropa' ? 'bg-white shadow text-slate-700' : 'text-slate-400'}`}>Oficiais</button>
        </div>

        <select className="w-full p-3 border rounded-lg mb-4 bg-slate-50 font-medium" value={user} onChange={e => setUser(e.target.value)}>
           <option value="">Selecione seu nome...</option>
           {filteredOfficers.map(o => <option key={o.id} value={o.nome}>{o.patente} {o.nome} {o.role === 'rt' ? '(RT)' : ''}</option>)}
        </select>

        <button 
           onClick={() => {
              const selectedUser = filteredOfficers.find(o => o.nome === user);
              if (selectedUser) onLogin(selectedUser.nome, selectedUser.role);
           }} 
           disabled={!user} 
           className={`w-full py-3 rounded-lg font-bold text-white transition ${user ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
        >
           ACESSAR SISTEMA
        </button>
      </div>
    </div>
  );
};

const AgendaTab = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ date: '', title: '', type: 'work' });

  useEffect(() => {
    const savedAgenda = localStorage.getItem(`agenda_${user}`);
    if (savedAgenda) {
      setEvents(JSON.parse(savedAgenda));
    } else if (user === 'Cimirro') {
      const initialCimirro = [
        { id: 1, date: '2026-03-04', title: 'Aniversário Alice (11 Anos)', type: 'family', details: 'Comprar presente' },
        { id: 2, date: '2026-05-29', title: 'Aniversário Pedro', type: 'family', details: 'Festa na escola?' },
        { id: 3, date: '2026-07-05', title: 'Aniversário Fabiane', type: 'family', details: 'Jantar especial' },
        { id: 4, date: '2026-02-20', title: 'Revisão Renault Symbol', type: 'personal', details: 'Oficina do Beto' }
      ];
      setEvents(initialCimirro);
      localStorage.setItem(`agenda_${user}`, JSON.stringify(initialCimirro));
    }
  }, [user]);

  const addEvent = (e) => {
    e.preventDefault();
    const updatedEvents = [...events, { id: Date.now(), ...newEvent }];
    setEvents(updatedEvents);
    localStorage.setItem(`agenda_${user}`, JSON.stringify(updatedEvents));
    setNewEvent({ date: '', title: '', type: 'work' });
  };

  const deleteEvent = (id) => {
    const updatedEvents = events.filter(e => e.id !== id);
    setEvents(updatedEvents);
    localStorage.setItem(`agenda_${user}`, JSON.stringify(updatedEvents));
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
            <p className="text-xs text-yellow-800">Agenda Pessoal Editável. Salva neste dispositivo.</p>
         </div>
      </div>

      <div className="md:col-span-2 space-y-4">
         <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen className="text-indigo-500"/> Agenda de {user}</h3>
         {events.length === 0 && <p className="text-slate-400 italic">Nenhum evento agendado.</p>}
         {events.sort((a,b) => new Date(a.date) - new Date(b.date)).map(ev => (
            <div key={ev.id} className="bg-white p-4 rounded-xl border-l-4 shadow-sm flex justify-between items-start" style={{borderLeftColor: ev.type === 'family' ? '#ec4899' : ev.type === 'personal' ? '#8b5cf6' : '#3b82f6'}}>
               <div className="flex gap-4">
                  <div className="text-center min-w-[50px]">
                     <div className="text-xs font-bold text-slate-400 uppercase">
                        {new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR', {month:'short'})}
                     </div>
                     <div className="text-xl font-bold text-slate-800">
                        {new Date(ev.date + 'T12:00:00').getDate()}
                     </div>
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-800">{ev.title}</h4>
                     <p className="text-sm text-slate-500">{ev.type.toUpperCase()}</p>
                  </div>
               </div>
               <button onClick={() => deleteEvent(ev.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
         ))}
      </div>
    </div>
  );
};

const TimelineView = ({ vacations, semester, userHighlight }) => {
  const months = semester === 1 
    ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    : ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const startMonthIndex = semester === 1 ? 0 : 6;
  const year = 2026;

  const filteredVacations = vacations.filter(v => {
    const start = new Date(v.inicio);
    return start.getFullYear() === year && start.getMonth() >= startMonthIndex && start.getMonth() < startMonthIndex + 6;
  });

  const officersWithVacation = Array.from(new Set(filteredVacations.map(v => v.nome)));

  const getPosition = (dateStr) => {
    const d = new Date(dateStr);
    const relMonth = d.getMonth() - startMonthIndex;
    if (relMonth < 0) return 0;
    return (relMonth * (100/6)) + (d.getDate() * ((100/6)/30));
  };

  const getWidth = (startStr, endStr) => {
    const days = Math.ceil(Math.abs(new Date(endStr) - new Date(startStr)) / 86400000);
    return days * ((100/6)/30);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-xs">
      <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
        <h3 className="font-bold text-slate-700 flex items-center gap-2"><CalendarRange size={14}/> Cronograma {semester}º Sem/2026</h3>
      </div>
      <div className="p-4 overflow-x-auto">
         <div className="min-w-[900px]">
           <div className="grid grid-cols-6 mb-2 text-slate-400 font-bold text-center border-b pb-2">
             {months.map(m => <div key={m}>{m}</div>)}
           </div>
           <div className="relative space-y-4 pt-2">
             <div className="absolute inset-0 grid grid-cols-6 pointer-events-none border-l border-r border-slate-100">
               {[1,2,3,4,5,6].map(i => <div key={i} className="border-r border-slate-100 h-full"></div>)}
             </div>
             {officersWithVacation.map((name, idx) => {
               const isUser = userHighlight && name.includes(userHighlight);
               return (
                 <div key={idx} className={`relative flex items-center py-2 z-10 ${isUser ? 'bg-yellow-50 rounded-lg' : ''}`}>
                   <div className="w-28 flex-shrink-0 font-bold text-slate-700 truncate pr-2 border-r border-slate-100 text-xs">
                     {name} {isUser && <Star size={10} className="inline text-yellow-500 fill-yellow-500"/>}
                   </div>
                   <div className="flex-1 h-5 relative">
                     {filteredVacations.filter(v => v.nome === name).map((v, vIdx) => (
                       <div key={vIdx} 
                            className={`absolute h-5 rounded-md border border-white shadow-sm flex items-center justify-center text-[9px] text-white font-bold truncate px-1 cursor-help
                              ${isUser ? 'bg-yellow-500' : 'bg-blue-500 opacity-80'}`}
                            style={{ left: `${getPosition(v.inicio)}%`, width: `${Math.max(getWidth(v.inicio, v.fim), 1.5)}%` }} 
                            title={`${v.inicio} a ${v.fim} (${v.tipo})`}>
                            {new Date(v.inicio + 'T12:00').getDate()}-{new Date(v.fim + 'T12:00').getDate()}
                       </div>
                     ))}
                   </div>
                 </div>
               )
             })}
           </div>
         </div>
      </div>
    </div>
  );
};

const BirthdayWidget = ({ staff }) => {
  const today = new Date(2026, 1, 15);
  const currentMonth = today.getMonth();
  const birthdays = staff.filter(p => p.nascimento && parseInt(p.nascimento.split('/')[1]) - 1 === currentMonth)
                         .sort((a,b) => parseInt(a.nascimento) - parseInt(b.nascimento));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2 text-sm"><Cake size={16} /> Aniversários Fev</h3>
      </div>
      <div className="p-3 flex-1 overflow-y-auto max-h-[250px] space-y-2">
        {birthdays.map(p => (
           <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded border-b border-slate-50 last:border-0">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">
                 {p.nascimento.split('/')[0]}
              </div>
              <div className="flex-1">
                 <p className="text-sm font-bold text-slate-700">{p.patente} {p.nome}</p>
                 <p className="text-[10px] text-slate-400">{p.nascimento}</p>
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
  
  // MODALS
  const [showAtestadoModal, setShowAtestadoModal] = useState(false);
  const [showPermutaModal, setShowPermutaModal] = useState(false);
  
  // FORMS
  const [formAtestado, setFormAtestado] = useState({ dias: '', inicio: '', cid: '' });
  const [formPermuta, setFormPermuta] = useState({ dataSai: '', substituto: '', dataEntra: '' });

  // DATA
  const [officers, setOfficers] = useState(REAL_OFFICERS);
  const [atestados, setAtestados] = useState(INITIAL_ATESTADOS);
  const [permutas, setPermutas] = useState(INITIAL_PERMUTAS);
  const [vacations, setVacations] = useState(INITIAL_VACATIONS);
  const [upiStats, setUpiStats] = useState(INITIAL_UPI_STATS);

  const pendingAtestados = atestados.filter(a => a.status === 'Pendente').length;
  const pendingPermutas = permutas.filter(p => p.status === 'Pendente').length;

  const refreshData = async (showFeedback = true) => {
    setLoading(true);
    try {
      if (API_URL_GESTAO) {
        const res1 = await fetch(`${API_URL_GESTAO}?action=getData`);
        const data1 = await res1.json();
        if (data1.atestados) setAtestados(data1.atestados);
        if (data1.permutas) setPermutas(data1.permutas);
        if (data1.vacations) setVacations(data1.vacations);
      }
      if (API_URL_INDICADORES) {
        const res2 = await fetch(`${API_URL_INDICADORES}?action=getData`);
        const data2 = await res2.json();
        if (data2.upiStats) setUpiStats(data2.upiStats);
      }
      
      if (!API_URL_GESTAO && !API_URL_INDICADORES) {
          if (showFeedback) alert("Modo Demonstração: Configure o Apps Script para salvar na planilha real.");
      } else {
          if (showFeedback) alert("Sincronizado!");
      }
    } catch(e) {
      console.error(e);
      if (showFeedback) alert("Erro de conexão. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  // Atualização automática ao entrar no Dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      refreshData(false); // Modo silencioso
    }
  }, [activeTab]);

  const sendData = async (action, payload) => {
    if (!API_URL_GESTAO) {
      console.warn("API URL não configurada. Salvando apenas localmente.");
      return; 
    }
    try {
      await fetch(API_URL_GESTAO, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, payload })
      });
    } catch (e) {
      alert("Erro ao salvar na nuvem.");
    }
  };

  const handleHomologar = (id, type) => {
    if (role !== 'admin') return alert("Apenas Chefe e Adjunto podem homologar.");
    if (type === 'atestado') setAtestados(atestados.map(a => a.id === id ? {...a, status: 'Homologado'} : a));
    if (type === 'permuta') setPermutas(permutas.map(p => p.id === id ? {...p, status: 'Homologado'} : p));
  };

  const handleDelete = (id, type) => {
    if (type === 'atestado') setAtestados(atestados.filter(a => a.id !== id));
    if (type === 'permuta') setPermutas(permutas.filter(p => p.id !== id));
  };

  const submitAtestado = (e) => {
    e.preventDefault();
    const newItem = { 
      id: Date.now(), 
      status: 'Pendente', 
      militar: user, 
      inicio: formAtestado.inicio,
      data: formAtestado.inicio, 
      cid: formAtestado.cid || 'Sigiloso'
    };
    
    setAtestados([newItem, ...atestados]);
    sendData('saveAtestado', newItem);
    setShowAtestadoModal(false);
    setFormAtestado({ dias: '', inicio: '', cid: '' });
    alert("Atestado enviado!");
  };

  const submitPermuta = (e) => {
    e.preventDefault();
    const newItem = {
      id: Date.now(),
      status: 'Pendente',
      solicitante: user,
      substituto: formPermuta.substituto,
      dataSai: formPermuta.dataSai
    };
    setPermutas([newItem, ...permutas]);
    sendData('savePermuta', newItem);
    setShowPermutaModal(false);
    setFormPermuta({ dataSai: '', substituto: '', dataEntra: '' });
    alert("Permuta enviada!");
  };

  const renderContent = () => {
    if (loading) return <div className="p-10 text-center text-slate-500">Sincronizando dados...</div>;

    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
             {role === 'rt' && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 items-center mb-4">
                   <Eye className="text-blue-600" />
                   <div>
                      <h4 className="font-bold text-blue-800">Modo RT</h4>
                      <p className="text-sm text-blue-700">Acesso total para visualização. Homologação restrita à Chefia.</p>
                   </div>
                </div>
             )}

             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Painel de Comando</h2>
                <button onClick={() => refreshData(true)} className="text-blue-600 text-sm flex items-center gap-2 hover:underline"><RefreshCw size={14}/> Sincronizar</button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowAtestadoModal(true)} className="bg-red-50 hover:bg-red-100 border border-red-200 p-4 rounded-xl flex items-center justify-center gap-3 transition-colors group">
                   <div className="bg-red-500 text-white p-2 rounded-lg group-hover:scale-110 transition-transform"><ShieldAlert size={20}/></div>
                   <span className="font-bold text-red-800">Novo Atestado</span>
                </button>
                <button onClick={() => setShowPermutaModal(true)} className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-4 rounded-xl flex items-center justify-center gap-3 transition-colors group">
                   <div className="bg-indigo-500 text-white p-2 rounded-lg group-hover:scale-110 transition-transform"><ArrowRightLeft size={20}/></div>
                   <span className="font-bold text-indigo-800">Nova Permuta</span>
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4 bg-slate-800 rounded-xl p-5 text-white shadow-lg flex flex-col md:flex-row items-center justify-between">
                   <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <div className="bg-blue-600 p-3 rounded-lg"><Activity size={24}/></div>
                      <div>
                         <h3 className="font-bold text-lg">UPI - Tempo Real</h3>
                         <p className="text-slate-400 text-xs">Atualizado em {upiStats.dataReferencia}</p>
                      </div>
                   </div>
                   <div className="flex gap-8 text-center">
                      <div>
                         <p className="text-slate-400 text-xs uppercase font-bold">Ocupação</p>
                         <p className="text-2xl font-bold text-white">{upiStats.leitosOcupados} <span className="text-sm text-slate-500">/ 15</span></p>
                      </div>
                      <div>
                         <p className="text-slate-400 text-xs uppercase font-bold">Média Braden</p>
                         <p className="text-2xl font-bold text-yellow-400 flex items-center gap-1 justify-center">
                            {Number(upiStats.mediaBraden).toFixed(1)} <Thermometer size={14}/>
                         </p>
                      </div>
                      <div>
                         <p className="text-slate-400 text-xs uppercase font-bold">Média Fugulin</p>
                         <p className="text-2xl font-bold text-green-400 flex items-center gap-1 justify-center">
                            {Number(upiStats.mediaFugulin).toFixed(1)} <TrendingDown size={14}/>
                         </p>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                   <p className="text-slate-500 text-xs uppercase font-bold">Pendências</p>
                   <h3 className="text-2xl font-bold text-slate-800">{pendingAtestados + pendingPermutas}</h3>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                   <p className="text-slate-500 text-xs uppercase font-bold">Efetivo</p>
                   <h3 className="text-2xl font-bold text-slate-800">{REAL_OFFICERS.length}</h3>
                </div>
                <div className="md:col-span-2">
                   <BirthdayWidget staff={REAL_OFFICERS} />
                </div>
             </div>
          </div>
        );
      
      case 'agenda': return <AgendaTab user={user} />;
      
      case 'atestados':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fadeIn">
             <div className="flex justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><ShieldAlert className="text-red-500"/> Gestão de Atestados</h3>
                <button onClick={() => setShowAtestadoModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700">Novo Atestado</button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 uppercase text-slate-500"><tr><th className="p-3">Status</th><th className="p-3">Militar</th><th className="p-3">Data</th><th className="p-3">Ação</th></tr></thead>
                 <tbody className="divide-y divide-slate-50">
                   {atestados.map((a, idx) => (
                     <tr key={idx} className={a.status === 'Pendente' ? 'bg-red-50/50' : ''}>
                       <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'Pendente' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{a.status}</span></td>
                       <td className="p-3 font-medium">{a.militar}</td>
                       <td className="p-3 text-slate-500">{formatDate(a.inicio || a.data)}</td>
                       <td className="p-3 flex gap-2">
                          {a.status === 'Pendente' && role === 'admin' && <button onClick={() => handleHomologar(a.id, 'atestado')} className="text-blue-600 font-bold text-xs hover:underline">Homologar</button>}
                          <button onClick={() => handleDelete(a.id, 'atestado')} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );

      case 'permutas':
         return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fadeIn">
               <div className="flex justify-between mb-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><ArrowRightLeft className="text-indigo-500"/> Permutas de Serviço</h3>
                  <button onClick={() => setShowPermutaModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">Solicitar Permuta</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 uppercase text-slate-500"><tr><th className="p-3">Status</th><th className="p-3">Solicitante</th><th className="p-3">Substituto</th><th className="p-3">Datas</th><th className="p-3">Ação</th></tr></thead>
                   <tbody className="divide-y divide-slate-50">
                     {permutas.map((p, idx) => (
                       <tr key={idx} className={p.status === 'Pendente' ? 'bg-indigo-50/50' : ''}>
                         <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Pendente' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>{p.status}</span></td>
                         <td className="p-3 font-medium text-red-700">{p.solicitante}</td>
                         <td className="p-3 font-medium text-green-700">{p.substituto || '---'}</td>
                         <td className="p-3 text-slate-500">{formatDate(p.dataSai)}</td>
                         <td className="p-3 flex gap-2">
                            {p.status === 'Pendente' && role === 'admin' && <button onClick={() => handleHomologar(p.id, 'permuta')} className="text-blue-600 font-bold text-xs hover:underline">Homologar</button>}
                            <button onClick={() => handleDelete(p.id, 'permuta')} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
         );

      case 'ferias':
         return (
            <div className="space-y-6 animate-fadeIn">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Palmtree className="text-orange-500"/> Escala de Férias 2026</h3>
                  <div className="flex gap-2">
                     <span className="text-xs font-bold px-2 py-1 bg-white border rounded">1º Semestre</span>
                  </div>
               </div>
               <TimelineView vacations={vacations} officers={REAL_OFFICERS} semester={1} userHighlight={user} />
            </div>
         );

      case 'efetivo':
         return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fadeIn">
              <h3 className="font-bold text-slate-800 mb-4">Efetivo de Oficiais ({REAL_OFFICERS.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 uppercase text-slate-500"><tr><th className="p-3 text-center">#</th><th className="p-3">Nome</th><th className="p-3">Setor</th><th className="p-3">Nascimento</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {REAL_OFFICERS.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="p-3 text-center font-bold text-slate-400">{o.antiguidade}</td>
                        <td className="p-3 font-medium text-slate-800">{o.patente} {o.nome}</td>
                        <td className="p-3"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${o.setor === 'UTI' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{o.setor}</span></td>
                        <td className="p-3 text-slate-500 font-mono">{o.nascimento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
         );

      default: return <div>Carregando...</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all flex flex-col z-20 shadow-xl`}>
         <div className="p-4 border-b border-slate-800 flex items-center gap-3 h-16">
            {sidebarOpen && <span className="font-bold text-lg">SGA-Enf {role === 'admin' ? 'Chefia' : role === 'rt' ? 'RT' : 'Oficial'}</span>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-slate-400"><Menu size={20}/></button>
         </div>
         
         <div className={`p-4 border-b border-slate-800 bg-slate-800/50 ${!sidebarOpen && 'flex justify-center'}`}>
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-slate-700 ${role === 'admin' ? 'bg-blue-600' : role === 'rt' ? 'bg-purple-600' : 'bg-slate-600'}`}>
                 {user.substring(0,2).toUpperCase()}
               </div>
               {sidebarOpen && (
                 <div>
                   <p className="font-bold text-sm truncate w-32">{user}</p>
                   <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                     {role === 'admin' ? 'Administrador' : role === 'rt' ? 'Resp. Técnico' : 'Usuário'}
                   </p>
                 </div>
               )}
            </div>
         </div>

         <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {[
              { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
              { id: 'agenda', label: 'Minha Agenda', icon: BookOpen },
              { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: (role === 'admin' || role === 'rt') ? pendingAtestados : 0 },
              { id: 'permutas', label: 'Permutas', icon: ArrowRightLeft, badge: (role === 'admin' || role === 'rt') ? pendingPermutas : 0 },
              { id: 'ferias', label: 'Férias', icon: Palmtree },
              { id: 'efetivo', label: 'Efetivo', icon: Users },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all group relative ${activeTab === item.id ? 'bg-blue-600 shadow-md text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
                 <div className="relative">
                    <item.icon size={20}/>
                    {item.badge > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-slate-900">{item.badge}</span>}
                 </div>
                 {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
         </nav>

         <div className="p-4 border-t border-slate-800">
           <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full"><LogOut size={16}/> {sidebarOpen && 'Sair'}</button>
         </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50/50 p-6 md:p-8 relative">
         <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 capitalize">{activeTab === 'dashboard' ? 'Visão Geral' : activeTab}</h2>
              <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('pt-BR', {weekday: 'long', day:'numeric', month:'long'})}</p>
            </div>
         </header>
         {renderContent()}

         {/* MODAL ATESTADO */}
         {showAtestadoModal && (
           <Modal title="Novo Atestado" onClose={() => setShowAtestadoModal(false)}>
              <form onSubmit={submitAtestado} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500">Militar</label>
                    <input type="text" value={user} disabled className="w-full p-2 bg-slate-100 rounded border border-slate-300 text-slate-500" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500">Data de Início</label>
                    <input type="date" required className="w-full p-2 rounded border border-slate-300" value={formAtestado.inicio} onChange={e => setFormAtestado({...formAtestado, inicio: e.target.value})}/>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500">Qtd Dias</label>
                    <input type="number" required className="w-full p-2 rounded border border-slate-300" value={formAtestado.dias} onChange={e => setFormAtestado({...formAtestado, dias: e.target.value})}/>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500">CID (Opcional)</label>
                    <input type="text" className="w-full p-2 rounded border border-slate-300" value={formAtestado.cid} onChange={e => setFormAtestado({...formAtestado, cid: e.target.value})}/>
                 </div>
                 <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 flex justify-center gap-2"><Send size={18}/> Enviar</button>
              </form>
           </Modal>
         )}

         {/* MODAL PERMUTA */}
         {showPermutaModal && (
           <Modal title="Nova Permuta" onClose={() => setShowPermutaModal(false)}>
              <form onSubmit={submitPermuta} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500">Solicitante (Sai)</label>
                    <input type="text" value={user} disabled className="w-full p-2 bg-slate-100 rounded border border-slate-300 text-slate-500" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500">Data da Saída</label>
                    <input type="date" required className="w-full p-2 rounded border border-slate-300" value={formPermuta.dataSai} onChange={e => setFormPermuta({...formPermuta, dataSai: e.target.value})}/>
                 </div>
                 <div className="border-t pt-4 mt-4">
                    <label className="block text-xs font-bold text-slate-500">Substituto (Entra)</label>
                    <select className="w-full p-2 rounded border border-slate-300 bg-white" required value={formPermuta.substituto} onChange={e => setFormPermuta({...formPermuta, substituto: e.target.value})}>
                       <option value="">Selecione...</option>
                       {officers.map(o => <option key={o.id} value={o.nome}>{o.patente} {o.nome}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500">Data da Entrada</label>
                    <input type="date" required className="w-full p-2 rounded border border-slate-300" value={formPermuta.dataEntra} onChange={e => setFormPermuta({...formPermuta, dataEntra: e.target.value})}/>
                 </div>
                 <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 flex justify-center gap-2"><Send size={18}/> Solicitar</button>
              </form>
           </Modal>
         )}
      </main>
    </div>
  );
};

const UserDashboard = ({ user, onLogout }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col">
     <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{user.substring(0,2).toUpperCase()}</div>
           <div>
             <h1 className="font-bold text-slate-800">Ten {user}</h1>
             <p className="text-xs text-slate-500">Área do Oficial</p>
           </div>
        </div>
        <button onClick={onLogout}><LogOut className="text-slate-400 hover:text-red-500" /></button>
     </header>
     <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg shadow-blue-500/30">
           <h2 className="font-bold text-lg mb-1">Bem-vindo, {user}</h2>
           <p className="opacity-90">Acesse o sistema completo via Desktop para gestão.</p>
        </div>
        {/* Adicionado botões de ação rápida para usuário comum */}
        <div className="grid grid-cols-2 gap-4 mt-4">
           <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50">
              <ShieldAlert className="text-red-500" size={24} />
              <span className="font-bold text-sm text-slate-700">Novo Atestado</span>
           </button>
           <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50">
              <ArrowRightLeft className="text-indigo-500" size={24} />
              <span className="font-bold text-sm text-slate-700">Nova Permuta</span>
           </button>
        </div>
     </main>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const handleLogin = (u, r) => { setUser(u); setRole(r); };
  const handleLogout = () => { setUser(null); setRole(null); };

  if (!user) return <LoginScreen onLogin={handleLogin} />;
  if (role === 'admin' || role === 'rt') return <MainSystem user={user} role={role} onLogout={handleLogout} />;
  return <UserDashboard user={user} onLogout={handleLogout} />;
}
