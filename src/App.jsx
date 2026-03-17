import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Activity, AlertCircle, 
  Menu, LogOut, ShieldAlert, ArrowRightLeft, 
  Star, Cake, BookOpen, Plus, Trash2, Edit3, 
  UserPlus, RefreshCw, Send, X as CloseIcon, Save, Loader2,
  Paperclip, Thermometer, TrendingDown, Plane, CheckSquare, Square,
  ChevronUp, ChevronDown, ChevronsUpDown, CalendarClock, PieChart,
  ChevronLeft, ChevronRight, Key, Lock, Sun, CalendarDays, History, UserCircle, Shield,
  Bed, Baby, MapPin, Cloud, CloudRain, Droplets, Wind, Calendar, RefreshCcw, Wand2, Printer, CheckCircle,
  Stethoscope
} from 'lucide-react';

// =========================================================================
// --- CONFIGURAÇÕES DE CONEXÃO (DUAS BASES DE DADOS DISTINTAS) ---
// =========================================================================
const API_URL_GESTAO = "https://script.google.com/macros/s/AKfycbyrPu0E3wCU4_rNEEium7GGvG9k9FtzFswLiTy9iwZgeL345WiTyu7CUToZaCy2cxk/exec"; 
const API_URL_PASSAGEM = "https://script.google.com/macros/s/AKfycbyHw6wCJGdI1I1NX7kIwqdyW3BLRcIwBVX28HsimrdElZ2EOY82c4p3Kt73XY0n1vsbww/exec";

const LOCAIS_EXPEDIENTE = ["SDENF", "FUNSA", "CAIS", "UCC", "UPA", "UTI", "UPI", "SAD", "SSOP", "SIL", "FERISTA"];
const LOCAIS_SERVICO = ["UTI", "UPI"];

// =========================================================================
// --- NOVO MÓDULO: PASSAGEM DE TURNO (CÓDIGO ORIGINAL INTACTO) ---
// =========================================================================
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
                setReports(data.filter(item => item && typeof item === 'object').sort((a, b) => b.timestamp - a.timestamp));
            }
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
        const payload = { 
            ...formData, 
            sectorName: sector?.name || '', 
            sectorType: sector?.type || '', 
            timestamp: Date.now(), 
            authorName: currentUser || 'Desconhecido' 
        };

        try {
            await fetch(API_URL_PASSAGEM, { 
                method: 'POST', 
                mode: 'no-cors', 
                body: JSON.stringify(payload) 
            });
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
            if (!r || !r.timestamp) return false;
            const d = new Date(r.timestamp);
            const dayMatch = !filterDay || d.getDate() === parseInt(filterDay);
            const monthMatch = !filterMonth || (d.getMonth() + 1) === parseInt(filterMonth);
            const yearMatch = !filterYear || d.getFullYear() === parseInt(filterYear);
            return dayMatch && monthMatch && yearMatch;
        });
        const groups = {};
        filtered.forEach(r => {
            const ds = new Date(r.timestamp).toLocaleDateString('pt-BR');
            if (!groups[ds]) groups[ds] = [];
            groups[ds].push(r);
        });
        return groups;
    }, [reports, filterDay, filterMonth, filterYear]);

    const availableYears = useMemo(() => {
        const years = [...new Set(reports.map(r => r && r.timestamp ? new Date(r.timestamp).getFullYear() : null))].filter(y => y !== null);
        return years.sort((a,b) => b-a);
    }, [reports]);

    return (
        <div className="relative w-full h-[85vh] bg-slate-50 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200 flex flex-col font-sans">
            <style dangerouslySetInnerHTML={{__html: `
                .passagem-select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em; }
            `}} />
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
                            const latest = reports.find(r => r && r.sectorId === s.id);
                            const shift = latest ? SHIFTS_PASS.find(sh => sh.id === latest.shift) : null;
                            const IconRender = s.id === 'UPI' ? Stethoscope : s.id === 'UTI' ? Activity : s.id === 'UCC' ? Users : AlertCircle;
                            
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
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-xl shadow-sm ${shift?.color || 'bg-slate-100 text-slate-500'}`}>{latest.shift}</span>
                                                <span className="text-[10px] text-slate-300 italic font-bold">{new Date(latest.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {s.type === 'ward' ? (
                                                    ['Pac', 'Alt', 'Baix', 'Trn'].map((l, i) => (
                                                        <div key={l} className="bg-slate-50 p-2.5 rounded-2xl text-center border border-slate-100/50">
                                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mb-1">{l}</p>
                                                            <p className="text-sm font-black text-slate-800 leading-none">{latest[['patients', 'discharges', 'admissions', 'transfers'][i]] || 0}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-4 bg-slate-50 p-4 rounded-2xl flex justify-between items-center px-6 border border-slate-100/50">
                                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Produção Turno</span>
                                                        <span className="font-black text-emerald-700 text-lg leading-none">{latest.procedures || latest.consultations || 0}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pt-4 border-t border-slate-50">
                                                <p className="text-[10px] text-slate-400 font-bold truncate">Resp: <span className="text-slate-600">{latest.nurseName}</span></p>
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
                                                <input type="number" required value={formData[f]} onChange={e => setFormData({...formData, [f]: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center font-black text-xl outline-none" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-4 space-y-2">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total de Atendimentos / Procedimentos</label>
                                            <input type="number" required value={formData.procedures || formData.consultations} onChange={e => setFormData({...formData, procedures: e.target.value, consultations: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center font-black text-2xl outline-none" />
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
                            <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="passagem-select bg-slate-50 p-4 rounded-2xl text-xs font-black outline-none border border-slate-100"><option value="">Dia</option>{Array.from({length:31}, (_,i)=><option key={i+1}>{i+1}</option>)}</select>
                            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="passagem-select bg-slate-50 p-4 rounded-2xl text-xs font-black outline-none border border-slate-100"><option value="">Mês</option>{MONTHS_PASS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
                            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="passagem-select bg-slate-50 p-4 rounded-2xl text-xs font-black outline-none border border-slate-100"><option value="">Ano</option>{availableYears.map(y=><option key={y} value={y}>{y}</option>)}</select>
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
                                    const shift = SHIFTS_PASS.find(s => s.id === r.shift);
                                    return (
                                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-lg">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex gap-3">
                                                    <span className="text-[11px] font-black bg-slate-900 text-white px-4 py-1.5 rounded-xl uppercase tracking-tighter">{r.sectorId}</span>
                                                    <span className={`text-[11px] font-black px-4 py-1.5 rounded-xl ${shift?.color || 'bg-slate-100 text-slate-500'}`}>{r.shift}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-300 font-bold">{new Date(r.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <p className="text-[11px] text-slate-500 font-bold uppercase"><span className="text-slate-300 mr-2">ENF:</span> {r.nurseName}</p>
                                                <p className="text-[11px] text-slate-500 font-bold uppercase"><span className="text-slate-300 mr-2">SGT:</span> {r.sgtsNames}</p>
                                            </div>
                                            {r.intercurrences && (
                                                <div className="bg-slate-50 p-6 rounded-[1.5rem] italic text-xs font-bold text-slate-700 border border-slate-100/50">"{r.intercurrences}"</div>
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
// --- COMPONENTES BASE DO SISTEMA (GESTAO) ---
// =========================================================================

const getValGestao = getVal; // Re-utilizando helpers

const LoginScreen = ({ onLogin, appData, isSyncing, syncError, onForceSync }) => {
  const [roleGroup, setRoleGroup] = useState('chefia');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const list = Array.isArray(appData?.officers) ? appData.officers : [];

  const filtered = roleGroup === 'chefia' 
    ? list.filter(o => {
        const r = String(getValGestao(o, ['role'])).toLowerCase();
        const n = String(getValGestao(o, ['nome']));
        return r === 'admin' || r === 'rt' || n.includes('Cimirro') || n.includes('Zanini') || n.includes('Renata');
      }) 
    : list.filter(o => {
        const r = String(getValGestao(o, ['role'])).toLowerCase();
        const n = String(getValGestao(o, ['nome']));
        return r !== 'admin' && r !== 'rt' && !n.includes('Cimirro') && !n.includes('Zanini') && !n.includes('Renata');
      });

  const handleAuth = () => {
    setLoginError('');
    const selectedUser = list.find(o => getValGestao(o, ['nome']) === user);
    if (selectedUser) {
       const correctPasswordRaw = getValGestao(selectedUser, ['senha', 'password', 'pwd']) || '123456';
       const correctPassword = String(correctPasswordRaw).trim();
       const inputPassword = String(password).trim();
       
       if (inputPassword === correctPassword) {
           const nome = getValGestao(selectedUser, ['nome']);
           let role = getValGestao(selectedUser, ['role']) || 'user';
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
               {filtered.map((o, idx) => (<option key={idx} value={getValGestao(o, ['nome'])}>{getValGestao(o, ['patente', 'posto'])} {getValGestao(o, ['nome'])}</option>))}
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
const UserDashboard = ({ user, onLogout, appData, syncData, isSyncing, isAdmin, onToggleAdmin }) => {
  const [activeTab, setActiveTab] = useState('dashboard'); // NOVO CONTROLE DE TELA (Para o Fullscreen Passagem de Turno)
  const [isSaving, setIsSaving] = useState(false);
  const [modals, setModals] = useState({ atestado: false, permuta: false, ferias: false, licenca: false, gantt: false, password: false });
  const [form, setForm] = useState({ dias: '', inicio: '', sub: '', sai: '', entra: '' });
  const [passForm, setPassForm] = useState({ new: '', confirm: '' });
  const [fileData, setFileData] = useState(null);

  const [mesFiltro, setMesFiltro] = useState(() => {
     const d = new Date();
     return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  if (activeTab === 'passagem') {
     return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans p-2 md:p-6 pb-0">
           <PassagemTurno currentUser={user} onBack={() => setActiveTab('dashboard')} />
        </div>
     );
  }

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
     const nomeA = String(getValGestao(a, ['militar', 'nome', 'oficial'])).toLowerCase();
     if (!nomeA.includes(userSafeName) && !userSafeName.includes(nomeA)) return false;
     if (!mesFiltro) return true;
     const d = parseDate(getValGestao(a,['inicio', 'data']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(a => ({...a, _tipo: 'Atestado'})).reverse();

  const permutasFiltradas = (appData.permutas || []).filter(p => {
     const nomeSolicitante = String(getValGestao(p, ['solicitante', 'nome', 'militar'])).toLowerCase();
     const nomeSubstituto = String(getValGestao(p, ['substituto'])).toLowerCase();
     if (!nomeSolicitante.includes(userSafeName) && !userSafeName.includes(nomeSolicitante) &&
         !nomeSubstituto.includes(userSafeName) && !userSafeName.includes(nomeSubstituto)) return false;
     
     if (!mesFiltro) return true;
     const d = parseDate(getValGestao(p,['sai', 'datasai']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(p => ({...p, _tipo: 'Permuta'})).reverse();

  const feriasFiltradas = (appData.ferias || []).filter(f => {
     const nomeF = String(getValGestao(f, ['militar', 'nome', 'oficial'])).toLowerCase();
     if (!nomeF.includes(userSafeName) && !userSafeName.includes(nomeF)) return false;
     if (!mesFiltro) return true;
     const d = parseDate(getValGestao(f,['inicio', 'data', 'saida']));
     return d && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === mesFiltro;
  }).map(f => ({...f, _tipo: 'Férias'})).reverse();

  const licencasFiltradas = (appData.licencas || []).filter(l => {
     const nomeL = String(getValGestao(l, ['militar', 'nome', 'oficial'])).toLowerCase();
     if (!nomeL.includes(userSafeName) && !userSafeName.includes(nomeL)) return false;
     if (!mesFiltro) return true;
     const d = parseDate(getValGestao(l,['inicio', 'data']));
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
     const myOfficerData = appData.officers.find(o => getValGestao(o, ['nome']) === user);
     if(!myOfficerData) return alert("Erro ao localizar perfil.");
     handleSend('saveOfficer', { ...myOfficerData, senha: passForm.new });
  };

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
        
        {/* MODIFICADO: ADICIONADO O BOTÃO DE PASSAGEM DE TURNO NO GRID */}
        <div className="grid grid-cols-5 gap-2">
          <button onClick={() => setActiveTab('passagem')} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all"><BookOpen size={16}/></div><span className="font-black text-[7px] uppercase text-slate-700 tracking-widest text-center">Turno</span></button>
          <button onClick={() => setModals({...modals, atestado: true})} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all"><ShieldAlert size={16}/></div><span className="font-black text-[7px] uppercase text-slate-700 tracking-widest text-center">Atestado</span></button>
          <button onClick={() => setModals({...modals, permuta: true})} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><ArrowRightLeft size={16}/></div><span className="font-black text-[7px] uppercase text-slate-700 tracking-widest text-center">Permuta</span></button>
          <button onClick={() => setModals({...modals, ferias: true})} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all"><Sun size={16}/></div><span className="font-black text-[7px] uppercase text-slate-700 tracking-widest text-center">Férias</span></button>
          <button onClick={() => setModals({...modals, licenca: true})} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95 group"><div className="p-2 bg-pink-50 text-pink-500 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-all"><Baby size={16}/></div><span className="font-black text-[7px] uppercase text-slate-700 tracking-widest text-center">Licença</span></button>
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
                const dateA = parseDate(getValGestao(a,['inicio', 'data', 'sai', 'datasai']))?.getTime() || 0;
                const dateB = parseDate(getValGestao(b,['inicio', 'data', 'sai', 'datasai']))?.getTime() || 0;
                return dateB - dateA;
            }).map((item, i) => {
              const anexoUrl = getValGestao(item, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
              let titulo = ""; let icon = null;
              if (item._tipo === 'Atestado') { titulo = `Afastamento: ${getValGestao(item,['dias'])}d`; icon = <ShieldAlert size={12} className="text-red-500 inline mr-1"/>; }
              if (item._tipo === 'Permuta') { 
                  const eSub = String(getValGestao(item,['substituto'])).toLowerCase().includes(userSafeName);
                  titulo = eSub ? `Cobriu: ${getValGestao(item,['solicitante'])}` : `Pediu Troca: ${getValGestao(item,['substituto'])}`; 
                  icon = <ArrowRightLeft size={12} className={eSub ? "text-green-500 inline mr-1" : "text-indigo-500 inline mr-1"}/>; 
              }
              if (item._tipo === 'Férias') { titulo = `Férias: ${getValGestao(item,['dias', 'quantidade'])}d`; icon = <Sun size={12} className="text-amber-500 inline mr-1"/>; }
              if (item._tipo === 'Licença') { titulo = `Licença: ${getValGestao(item,['dias', 'quantidade'])}d`; icon = <Baby size={12} className="text-pink-500 inline mr-1"/>; }

              const statusAtual = getValGestao(item,['status']) || 'Homologado'; 
              const isRejected = statusAtual.toLowerCase().includes('rejeitado');

              return (
              <div key={i} className={`bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center ${isRejected ? 'border-red-200' : 'border-slate-100'}`}>
                <div className="text-xs">
                  <p className="font-black text-slate-800 uppercase text-[10px] mb-1 flex items-center">{icon} {titulo}</p>
                  <div className="flex gap-2 font-bold text-slate-400 text-[8px] uppercase tracking-widest items-center">
                    <span className="bg-slate-50 px-2 py-1 rounded">{formatDate(getValGestao(item,['inicio', 'data', 'sai', 'datasai']))}</span>
                    {getValGestao(item,['substituto']) && <span className="bg-slate-50 px-2 py-1 rounded flex items-center gap-1"><ArrowRightLeft size={8}/>{formatDate(getValGestao(item,['entra', 'dataentra']))}</span>}
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
      {modals.permuta && <Modal title="Pedir Permuta" onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('savePermuta',{id:Date.now().toString(),status:'Pendente',solicitante:user,substituto:form.sub,datasai:form.sai,dataentra:form.entra});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data de Saída</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,sai:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Militar Substituto</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,sub:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getValGestao(o,['nome'])}>{getValGestao(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Data de Substituição</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,entra:e.target.value})}/></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Solicitar Troca"}</button></form></Modal>}
      {modals.ferias && <Modal title={<><Sun size={18}/> Solicitar Férias</>} onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveFerias',{id:Date.now().toString(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Quantidade de Dias (Parcelamento)</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 cursor-pointer" onChange={e=>setForm({...form,dias:e.target.value})}><option value="">Selecione o parcelamento...</option><option value="10">10 dias (Para parcelamento 10/10/10 ou 20/10)</option><option value="15">15 dias (Para parcelamento 15/15)</option><option value="20">20 dias (Para parcelamento 20/10)</option><option value="30">30 dias (Mês Integral)</option></select></div><div className="bg-amber-50 p-3 rounded-xl flex items-start gap-2 border border-amber-100"><AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0"/><p className="text-[9px] font-bold text-amber-800">O pedido ficará <span className="font-black uppercase">Pendente</span> até homologação da Chefia. Recomenda-se olhar o Gantt Geral antes de solicitar.</p></div><button disabled={isSaving} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Protocolar Férias"}</button></form></Modal>}
      {modals.licenca && <Modal title={<><Baby size={18}/> Solicitar Licença-Maternidade</>} onClose={closeModals}><form onSubmit={(e)=>{e.preventDefault(); handleSend('saveLicenca',{id:Date.now().toString(),status:'Pendente',militar:user,inicio:form.inicio,dias:form.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setForm({...form,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Duração da Licença</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 cursor-pointer" onChange={e=>setForm({...form,dias:e.target.value})}><option value="">Selecione...</option><option value="120">120 dias</option><option value="180">180 dias</option></select></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isSaving?"A Enviar...":"Protocolar Licença"}</button></form></Modal>}
    </div>
  );
};

// --- PAINEL CHEFIA (ADMIN) ---

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
    const myOfficerData = appData.officers.find(o => getValGestao(o, ['nome']) === user);
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
        const contagemFUNSA = (appData.officers||[]).filter(o => String(getValGestao(o,['expediente'])).toUpperCase().includes('FUNSA')).length;
        const contagemEfetivoBase = (appData.officers||[]).length;
        const contagemAssistencial = contagemEfetivoBase - contagemFUNSA;
        const pendentesCount = (appData.atestados||[]).filter(x=>getValGestao(x,['status'])==='Pendente').length + (appData.permutas||[]).filter(x=>getValGestao(x,['status'])==='Pendente').length + (appData.ferias||[]).filter(x=>getValGestao(x,['status'])==='Pendente').length + (appData.licencas||[]).filter(x=>getValGestao(x,['status'])==='Pendente').length;

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
                valA = parseInt(getValGestao(a, ['antiguidade'])) || 9999; valB = parseInt(getValGestao(b, ['antiguidade'])) || 9999;
                return direction === 'asc' ? valA - valB : valB - valA;
            } else if (key === 'nome') { valA = String(getValGestao(a, ['nome'])).toLowerCase(); valB = String(getValGestao(b, ['nome'])).toLowerCase();
            } else if (key === 'expediente') { valA = String(getValGestao(a, ['expediente'])).toLowerCase(); valB = String(getValGestao(b, ['expediente'])).toLowerCase();
            } else if (key === 'idade') { valA = parseDate(getValGestao(a, ['nasc']))?.getTime() || 9999999999999; valB = parseDate(getValGestao(b, ['nasc']))?.getTime() || 9999999999999;
            } else if (key === 'ingresso') { valA = parseDate(getValGestao(a, ['ingres']))?.getTime() || 9999999999999; valB = parseDate(getValGestao(b, ['ingres']))?.getTime() || 9999999999999; }
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
                      const tIdade = calculateDetailedTime(getValGestao(o, ['nasc']));
                      const tServico = calculateDetailedTime(getValGestao(o, ['ingres']));
                      const expedientes = String(getValGestao(o, ['expediente']) || "").split(',').map(x => x.trim()).filter(x => x !== "");
                      const isRT = String(getValGestao(o, ['role'])).toLowerCase() === 'rt'; 
                      const isGestante = String(getValGestao(o, ['gestante'])).toLowerCase() === 'sim' || String(getValGestao(o, ['gestante'])).toLowerCase() === 'true';

                      return (
                      <tr key={i} className="hover:bg-slate-50/80 group transition-colors">
                        <td className="p-3 md:p-4 text-center text-slate-300 font-black text-base">{getValGestao(o, ['antiguidade'])}</td>
                        <td className="p-3 md:p-4"><div className="flex flex-col items-start gap-1"><div className="flex items-center gap-2"><span onClick={() => setHistoryOfficer(o)} className="font-black text-blue-600 hover:text-blue-800 uppercase tracking-tighter text-xs md:text-sm cursor-pointer hover:underline transition-all" title="Ver Dossiê">{getValGestao(o,['patente','posto'])} {getValGestao(o, ['nome'])}</span>{isRT && <span className="bg-amber-400 text-slate-900 text-[6px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded shadow-sm">RT Enfermagem</span>}{isGestante && <span className="bg-pink-400 text-white text-[6px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5"><Baby size={8}/> Gestante</span>}</div><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(getValGestao(o,['nasc']))}</span></div></td>
                        <td className="p-3 md:p-4"><div className="flex flex-col gap-1"><div className="flex flex-wrap gap-1">{expedientes.map((ex, idx) => (<span key={idx} className="bg-blue-50 text-blue-600 text-[7px] font-black uppercase px-1.5 py-0.5 rounded border border-blue-100">{ex}</span>))}</div><span className={`text-[8px] font-black uppercase inline-block ${getValGestao(o,['servico']) === 'UTI' ? 'text-purple-600' : 'text-blue-600'}`}>SV: {getValGestao(o,['servico']) || '-'}</span></div></td>
                        <td className={`p-3 md:p-4 text-center text-[10px] font-bold ${tIdade.y >= 45 ? 'text-red-600 bg-red-50 rounded-lg' : 'text-slate-600'}`}>{tIdade.display}</td>
                        <td className={`p-3 md:p-4 text-center text-[10px] font-bold ${tServico.y >= 7 ? 'text-red-600 bg-red-50 rounded-lg' : 'text-slate-600'}`}><div className="flex flex-col items-center"><span className="text-[8px] text-slate-400 font-mono">{formatDate(getValGestao(o,['ingres']))}</span><span>{tServico.display}</span></div></td>
                        {!isApenasRT && <td className="p-3 md:p-4 text-right"><div className="flex gap-2 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { const expArr = String(getValGestao(o, ['expediente']) || "").split(',').map(x => x.trim()).filter(x => x !== ""); setFormOfficer({ ...o, nome: getValGestao(o,['nome']), patente: getValGestao(o,['patente','posto']), antiguidade: getValGestao(o,['antiguidade']), nascimento: formatDateForInput(getValGestao(o,['nasc'])), ingresso: formatDateForInput(getValGestao(o,['ingres'])), role: getValGestao(o,['role']), expediente: expArr, servico: getValGestao(o,['servico']), gestante: isGestante ? 'Sim' : '' }); setShowOfficerModal(true); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14}/></button><button onClick={() => { if(window.confirm(`Remover ${getValGestao(o,['nome'])}?`)) sendData('deleteOfficer', { nome: getValGestao(o,['nome']) }); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14}/></button></div></td>}
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
            const d = parseDate(getValGestao(a,['inicio', 'data']));
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
                      const anexoUrl = getValGestao(a, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                      const idRegisto = getValGestao(a, ['id', 'identificador']);
                      const isVigor = atestadosAtivos.includes(a);
                      const isPendente = getValGestao(a,['status']) === 'Pendente';
                      const isRejeitado = String(getValGestao(a,['status'])).includes('Rejeitado');
                      return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-800 text-xs md:text-sm font-black tracking-tighter uppercase flex items-center gap-2">{getValGestao(a,['militar'])} {isVigor && <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest">Em Vigor</span>}</td>
                        <td className="p-4 text-center text-slate-500 font-bold text-xs">{getValGestao(a,['dias'])}d</td>
                        <td className="p-4 text-[10px] font-mono font-bold text-slate-400">{formatDate(getValGestao(a,['inicio', 'data']))}</td>
                        <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors" title="Ver Anexo"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-right leading-tight block w-max ${isRejeitado ? 'bg-red-100 text-red-700' : isPendente ? 'bg-amber-100 text-amber-700' : 'bg-green-50 text-green-700'}`}>{getValGestao(a,['status'])}</span></td>
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
            const d = parseDate(getValGestao(p,['sai', 'datasai']));
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
                     const anexoUrl = getValGestao(p, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                     const idRegisto = getValGestao(p, ['id', 'identificador']);
                     const isPendente = getValGestao(p,['status']) === 'Pendente';
                     const isRejeitado = String(getValGestao(p,['status'])).includes('Rejeitado');
                     return (
                     <tr key={idx} className="hover:bg-slate-50 transition-colors">
                       <td className="p-4 text-slate-800 text-xs font-black uppercase tracking-tighter">{getValGestao(p, ['solicitante'])}</td>
                       <td className="p-4 text-slate-600 text-xs font-bold uppercase tracking-tighter">{getValGestao(p, ['substituto'])}</td>
                       <td className="p-4"><div className="flex gap-4 font-mono font-bold text-[9px]"><span className="text-red-500">S: {formatDate(getValGestao(p,['sai','datasai']))}</span><span className="text-green-600">E: {formatDate(getValGestao(p,['entra','dataentra']))}</span></div></td>
                       <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                       <td className="p-4"><span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-right leading-tight block w-max ${isRejeitado ? 'bg-red-100 text-red-700' : isPendente ? 'bg-amber-100 text-amber-700' : 'bg-green-50 text-green-700'}`}>{getValGestao(p, ['status'])}</span></td>
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
         const feriasPendentes = (appData.ferias || []).filter(f => getValGestao(f, ['status']) === 'Pendente');
         return (
            <div className="space-y-6">
               {!isApenasRT && feriasPendentes.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-amber-200 p-6 md:p-8 animate-fadeIn relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                     <h3 className="font-black text-amber-600 text-lg uppercase tracking-tighter mb-4 flex items-center gap-2"><Sun size={20}/> Aprovação de Férias</h3>
                     <div className="overflow-x-auto"><table className="w-full text-left font-sans min-w-[600px]"><thead className="text-[9px] text-slate-400 tracking-widest border-b border-slate-100 uppercase"><tr><th className="p-4">Militar</th><th className="p-4 text-center">Dias (Parcela)</th><th className="p-4">Início</th><th className="p-4 text-right">Ações</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {feriasPendentes.map((f, i) => {
                             const idRegisto = getValGestao(f, ['id', 'identificador']);
                             return (
                             <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                               <td className="p-4 text-slate-800 text-xs font-black uppercase tracking-tighter">{getValGestao(f, ['militar'])}</td>
                               <td className="p-4 text-center text-slate-600 font-bold text-xs">{getValGestao(f, ['dias', 'quantidade'])}d</td>
                               <td className="p-4 font-mono font-bold text-slate-500 text-[10px]">{formatDate(getValGestao(f,['inicio', 'data']))}</td>
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
         const licencasPendentes = (appData.licencas || []).filter(l => getValGestao(l, ['status']) === 'Pendente');
         const licencasFiltradas = (appData.licencas||[]).filter(l => {
            if (!mesFiltro) return true;
            const d = parseDate(getValGestao(l,['inicio', 'data']));
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
                             const anexoUrl = getValGestao(l, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                             const idRegisto = getValGestao(l, ['id', 'identificador']);
                             return (
                             <tr key={i} className="hover:bg-pink-50/50 transition-colors">
                               <td className="p-4 text-slate-800 text-xs font-black uppercase tracking-tighter">{getValGestao(l, ['militar'])}</td>
                               <td className="p-4 text-center text-slate-600 font-bold text-xs">{getValGestao(l, ['dias', 'quantidade'])}d</td>
                               <td className="p-4 font-mono font-bold text-slate-500 text-[10px]">{formatDate(getValGestao(l,['inicio', 'data']))}</td>
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
                      const anexoUrl = getValGestao(l, ['anexo', 'arquivo', 'documento', 'url', 'link', 'file']);
                      const idRegisto = getValGestao(l, ['id', 'identificador']);
                      const isPendente = getValGestao(l,['status']) === 'Pendente';
                      const isRejeitado = String(getValGestao(l,['status'])).includes('Rejeitado');
                      
                      return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-800 text-xs md:text-sm font-black tracking-tighter uppercase flex items-center gap-2">{getValGestao(l,['militar'])}</td>
                        <td className="p-4 text-center text-slate-500 font-bold text-xs">{getValGestao(l,['dias'])}d</td>
                        <td className="p-4 text-[10px] font-mono font-bold text-slate-400">{formatDate(getValGestao(l,['inicio', 'data']))}</td>
                        <td className="p-4 text-center">{anexoUrl ? <a href={anexoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 inline-flex items-center justify-center rounded-lg transition-colors"><Paperclip size={14}/></a> : <span className="text-slate-300">-</span>}</td>
                        <td className="p-4"><span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest text-right leading-tight block w-max ${isRejeitado ? 'bg-red-100 text-red-700' : isPendente ? 'bg-amber-100 text-amber-700' : 'bg-green-50 text-green-700'}`}>{getValGestao(l,['status'])}</span></td>
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
         // ABRE SOMENTE SE ESTIVER NA ABA ESCALA (EXCLUSIVO BETA TESTER)
         return <EscalaPreview appData={appData} />;
      
      // NOVO BLOCO QUE ENCAPSULA A PASSAGEM DE TURNO NO ADMIN
      case 'passagem':
         return (
             <div className="animate-fadeIn w-full">
                 <PassagemTurno currentUser={user} />
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
               { id: 'passagem', label: 'Passagem Turno', icon: BookOpen }, // NOVA ABA ADMIN
               { id: 'atestados', label: 'Atestados', icon: ShieldAlert, badge: isApenasRT ? 0 : (appData.atestados||[]).filter(x=>getValGestao(x,['status'])==='Pendente').length }, 
               { id: 'permutas', label: 'Permutas', icon: ArrowRightLeft, badge: isApenasRT ? 0 : (appData.permutas||[]).filter(x=>getValGestao(x,['status'])==='Pendente').length }, 
               { id: 'ferias', label: 'Férias', icon: Sun, badge: isApenasRT ? 0 : (appData.ferias||[]).filter(x=>getValGestao(x,['status'])==='Pendente').length }, 
               { id: 'licencas', label: 'Licenças', icon: Baby, badge: isApenasRT ? 0 : (appData.licencas||[]).filter(x=>getValGestao(x,['status'])==='Pendente').length }, 
               { id: 'efetivo', label: 'Efetivo', icon: Users },
               isCimirro && { id: 'escala', label: 'Escala Mensal', icon: Calendar }, 
               { id: 'absenteismo', label: 'Absenteísmo', icon: TrendingDown } ].filter(Boolean).map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 p-3.5 md:p-4 rounded-2xl transition-all relative ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                 <div className="relative"><item.icon size={20}/>{item.badge > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-black">{item.badge}</span>}</div>{sidebarOpen && <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{item.label}</span>}</button>
            ))}
         </nav>
         <div className="p-4 md:p-6 border-t border-white/5 flex flex-col items-center gap-3">
            {sidebarOpen && <div className="text-center w-full"><div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-black shadow-md bg-slate-800 text-white border border-slate-700 mb-2">{user.substring(0,2).toUpperCase()}</div><p className="font-black text-xs tracking-tight truncate w-full uppercase">{user}</p><p className="text-[8px] text-blue-400 uppercase font-bold tracking-widest">{role}</p></div>}
            
            <button onClick={onToggleAdmin} className="flex items-center justify-center gap-3 text-white bg-blue-600 hover:bg-blue-500 font-black text-[10px] uppercase tracking-widest w-full p-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all">
               <UserCircle size={16}/> {sidebarOpen && 'Meu Painel'}
            </button>

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
         
         {/* CONTEÚDO PRINCIPAL COM PROTEÇÃO RT */}
         {(() => {
            return renderContent();
         })()}

         {/* MODAIS (Só Lança se não for APENAS RT) */}
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

         {/* Lançamento de Férias Direto (Admin pula homologação) */}
         {showFeriasModal && !isApenasRT && <Modal title="Lançar Férias Direto (Admin)" onClose={() => setShowFeriasModal(false)}><form onSubmit={(e)=>{e.preventDefault(); sendData('saveFerias',{id:Date.now().toString(),status:'Homologado',militar:formFerias.militar,inicio:formFerias.inicio,dias:formFerias.dias});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Militar</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormFerias({...formFerias,militar:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getValGestao(o,['nome'])}>{getValGestao(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormFerias({...formFerias,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Total de Dias</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1 cursor-pointer" onChange={e=>setFormFerias({...formFerias,dias:e.target.value})}><option value="">Selecione...</option><option value="10">10 dias</option><option value="15">15 dias</option><option value="20">20 dias</option><option value="30">30 dias</option></select></div><button disabled={isSaving} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest">{isSaving?"A Enviar...":"Salvar e Homologar"}</button></form></Modal>}

         {/* Lançamento de Licença Direto (Admin) */}
         {showLicencaModal && !isApenasRT && <Modal title="Lançar Licença Direto (Admin)" onClose={() => { setShowLicencaModal(false); setFileData(null); }}><form onSubmit={(e)=>{e.preventDefault(); sendData('saveLicenca',{id:Date.now().toString(),status:'Homologado',militar:formLicenca.militar,inicio:formLicenca.inicio,dias:formLicenca.dias,file:fileData});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Militar</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormLicenca({...formLicenca,militar:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getValGestao(o,['nome'])}>{getValGestao(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Data de Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormLicenca({...formLicenca,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Dias</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormLicenca({...formLicenca,dias:e.target.value})}><option value="">Selecione...</option><option value="120">120 dias</option><option value="180">180 dias</option></select></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest">{isSaving?"Enviando...":"Gravar e Homologar"}</button></form></Modal>}

         {/* Lançamento de Atestados e Permutas (Admin) */}
         {showAtestadoModal && !isApenasRT && <Modal title="Lançar Atestado Direto (Admin)" onClose={() => { setShowAtestadoModal(false); setFileData(null); }}><form onSubmit={(e)=>{e.preventDefault(); sendData('saveAtestado',{id:Date.now().toString(),status:'Homologado',militar:formAtestado.militar,inicio:formAtestado.inicio,dias:formAtestado.dias,data:formAtestado.inicio,file:fileData});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Militar</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormAtestado({...formAtestado,militar:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getValGestao(o,['nome'])}>{getValGestao(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Início</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormAtestado({...formAtestado,inicio:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Dias</label><input type="number" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormAtestado({...formAtestado,dias:e.target.value})}/></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest">{isSaving?"Enviando...":"Gravar e Homologar"}</button></form></Modal>}
         {showPermutaModal && !isApenasRT && <Modal title="Lançar Permuta Direto (Admin)" onClose={() => { setShowPermutaModal(false); setFileData(null); }}><form onSubmit={(e)=>{e.preventDefault(); sendData('savePermuta',{id:Date.now().toString(),status:'Homologado',solicitante:formPermuta.solicitante,substituto:formPermuta.sub,datasai:formPermuta.sai,dataentra:formPermuta.entra,file:fileData});}} className="space-y-4"><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Solicitante (Sai)</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormPermuta({...formPermuta,solicitante:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getValGestao(o,['nome'])}>{getValGestao(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Substituto (Entra)</label><select required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormPermuta({...formPermuta,sub:e.target.value})}><option value="">Escolha...</option>{(appData.officers||[]).map((o,i)=><option key={i} value={getValGestao(o,['nome'])}>{getValGestao(o,['nome'])}</option>)}</select></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Data Saída</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormPermuta({...formPermuta,sai:e.target.value})}/></div><div><label className="text-[9px] font-black uppercase text-slate-400 ml-1">Data de Substituição</label><input type="date" required className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold mt-1" onChange={e=>setFormPermuta({...formPermuta,entra:e.target.value})}/></div><FileUpload onFileSelect={setFileData}/><button disabled={isSaving} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md text-[10px] uppercase tracking-widest">{isSaving?"Enviando...":"Gravar e Homologar"}</button></form></Modal>}
         
         {/* MODAL: HISTÓRICO DO MILITAR (Dossiê) */}
         {historyOfficer && (() => {
            const nomeAlvo = String(getValGestao(historyOfficer,['nome'])).trim().toLowerCase();
            
            const feriasHist = (appData.ferias||[]).filter(f => {
               const nomeF = String(getValGestao(f,['militar', 'nome', 'oficial'])).trim().toLowerCase();
               return nomeF.includes(nomeAlvo) || nomeAlvo.includes(nomeF);
            });
            const licencasHist = (appData.licencas||[]).filter(l => {
               const nomeL = String(getValGestao(l,['militar', 'nome', 'oficial'])).trim().toLowerCase();
               return nomeL.includes(nomeAlvo) || nomeAlvo.includes(nomeL);
            });
            const atestadosHist = (appData.atestados||[]).filter(a => {
               const nomeA = String(getValGestao(a,['militar', 'nome', 'oficial'])).trim().toLowerCase();
               return nomeA.includes(nomeAlvo) || nomeAlvo.includes(nomeA);
            });
            const permutasHist = (appData.permutas||[]).filter(p => {
               const nomeP_solicitante = String(getValGestao(p,['solicitante', 'nome', 'militar'])).trim().toLowerCase();
               const nomeP_substituto = String(getValGestao(p,['substituto'])).trim().toLowerCase();
               return nomeP_solicitante.includes(nomeAlvo) || nomeAlvo.includes(nomeP_solicitante) || 
                      nomeP_substituto.includes(nomeAlvo) || nomeAlvo.includes(nomeP_substituto);
            });

            return (
               <Modal title={<><History size={18}/> Dossiê: {getValGestao(historyOfficer,['patente','posto'])} {getValGestao(historyOfficer,['nome'])}</>} onClose={() => setHistoryOfficer(null)}>
                  <div className="space-y-6">
                     <div>
                        <h4 className="text-[10px] font-black uppercase text-pink-500 tracking-widest mb-2 border-b border-pink-100 pb-1 flex items-center gap-1"><Baby size={12}/> Licenças</h4>
                        <ul className="space-y-2">
                           {licencasHist.length > 0 ? licencasHist.map((l, i) => {
                                 const st = getValGestao(l,['status']) || 'Homologado';
                                 const isRej = String(st).toLowerCase().includes('rejeitado');
                                 return (
                                 <li key={i} className="flex justify-between items-center text-xs bg-pink-50/50 p-2 rounded-lg border border-pink-100/50">
                                    <span className="font-bold text-slate-700">{formatDate(getValGestao(l,['inicio', 'data', 'saida']))} <span className="text-[9px] text-slate-400 font-mono">({getValGestao(l,['dias', 'quantidade'])}d)</span></span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded max-w-[150px] text-right truncate ${isRej ? 'bg-red-100 text-red-700' : st==='Pendente' ? 'bg-amber-200 text-amber-800' : 'bg-green-100 text-green-700'}`} title={st}>{st}</span>
                                 </li>
                              )}) : <li className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nenhum registo</li>}
                        </ul>
                     </div>
                     <div>
                        <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2 border-b border-amber-100 pb-1 flex items-center gap-1"><Sun size={12}/> Férias</h4>
                        <ul className="space-y-2">
                           {feriasHist.length > 0 ? feriasHist.map((f, i) => {
                                 const st = getValGestao(f,['status']) || 'Homologado';
                                 const isRej = String(st).toLowerCase().includes('rejeitado');
                                 return (
                                 <li key={i} className="flex justify-between items-center text-xs bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                                    <span className="font-bold text-slate-700">{formatDate(getValGestao(f,['inicio', 'data', 'saida']))} <span className="text-[9px] text-slate-400 font-mono">({getValGestao(f,['dias', 'quantidade'])}d)</span></span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded max-w-[150px] text-right truncate ${isRej ? 'bg-red-100 text-red-700' : st==='Pendente' ? 'bg-amber-200 text-amber-800' : 'bg-green-100 text-green-700'}`} title={st}>{st}</span>
                                 </li>
                              )}) : <li className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nenhum registo</li>}
                        </ul>
                     </div>
                     <div>
                        <h4 className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-2 border-b border-red-100 pb-1 flex items-center gap-1"><ShieldAlert size={12}/> Atestados Médicos</h4>
                        <ul className="space-y-2">
                           {atestadosHist.length > 0 ? atestadosHist.map((a, i) => {
                                 const st = getValGestao(a,['status']) || 'Homologado';
                                 const isRej = String(st).toLowerCase().includes('rejeitado');
                                 return (
                                 <li key={i} className="flex justify-between items-center text-xs bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                                    <span className="font-bold text-slate-700">{formatDate(getValGestao(a,['inicio', 'data']))} <span className="text-[9px] text-slate-400 font-mono">({getValGestao(a,['dias'])}d)</span></span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded max-w-[150px] text-right truncate ${isRej ? 'bg-red-100 text-red-700' : st==='Pendente' ? 'bg-amber-200 text-amber-800' : 'bg-green-100 text-green-700'}`} title={st}>{st}</span>
                                 </li>
                              )}) : <li className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nenhum registo</li>}
                        </ul>
                     </div>
                     <div>
                        <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 border-b border-indigo-100 pb-1 flex items-center gap-1"><ArrowRightLeft size={12}/> Permutas</h4>
                        <ul className="space-y-2">
                           {permutasHist.length > 0 ? permutasHist.map((p, i) => {
                                 const st = getValGestao(p,['status']) || 'Homologado';
                                 const isRej = String(st).toLowerCase().includes('rejeitado');
                                 const foiSolicitante = String(getValGestao(p,['solicitante', 'nome', 'militar'])).trim().toLowerCase().includes(nomeAlvo);
                                 
                                 return (
                                 <li key={i} className="flex flex-col text-xs bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50 gap-1">
                                    <div className="flex justify-between items-center">
                                       <span className="font-bold text-slate-700">
                                          {foiSolicitante ? `Substituto: ${getValGestao(p,['substituto'])}` : `Cobriu: ${getValGestao(p,['solicitante'])}`}
                                       </span>
                                       <span className={`text-[8px] font-black uppercase px-2 py-1 rounded max-w-[150px] text-right truncate ${isRej ? 'bg-red-100 text-red-700' : st==='Pendente' ? 'bg-amber-200 text-amber-800' : 'bg-green-100 text-green-700'}`} title={st}>{st}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-mono">S: {formatDate(getValGestao(p,['sai', 'datasai']))} / E: {formatDate(getValGestao(p,['entra', 'dataentra']))}</span>
                                 </li>
                              )}) : <li className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nenhum registo</li>}
                        </ul>
                     </div>
                  </div>
               </Modal>
            )
         })()}
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
  
  const [adminModeActive, setAdminModeActive] = useState(true); 
  
  const [appData, setAppData] = useState(() => {
    try {
      const cached = localStorage.getItem('sga_app_cache');
      if (cached) return JSON.parse(cached);
    } catch(e) {}
    return { officers: [], atestados: [], permutas: [], ferias: [], licencas: [], escalasVermelhas: [], upi: {leitosOcupados: 0, acamados: 0, mediaBraden: 0, mediaFugulin: 0, dataReferencia: '--'} };
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
        licencas: Array.isArray(resG.licencas) ? resG.licencas : [], 
        escalasVermelhas: Array.isArray(resG.escalasVermelhas) ? resG.escalasVermelhas : [], 
        upi: {
          leitosOcupados: getValGestao(resG.upiStats, ['ocupacao', 'ocupados', 'leito']) || 0,
          acamados: getValGestao(resG.upiStats, ['acamados']) || 0, 
          mediaBraden: safeParseFloat(getValGestao(resG.upiStats, ['braden'])),
          mediaFugulin: safeParseFloat(getValGestao(resG.upiStats, ['fugulin', 'fugulim'])),
          dataReferencia: getValGestao(resG.upiStats, ['data', 'ref']) || new Date().toLocaleDateString('pt-BR')
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
    setAdminModeActive(true); 
    localStorage.setItem('sga_app_user', u);
    localStorage.setItem('sga_app_role', r);
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    setAdminModeActive(true);
    localStorage.removeItem('sga_app_user');
    localStorage.removeItem('sga_app_role');
  }
  
  const isCimirro = String(user).toLowerCase().includes('cimirro');

  return (
    <ErrorBoundary>
      {!user ? (
        <LoginScreen onLogin={handleLogin} appData={appData} isSyncing={isSyncing} syncError={syncError} onForceSync={() => syncData(true)} />
      ) : (role === 'admin' || role === 'rt') && adminModeActive ? (
        <MainSystem user={user} role={role} onLogout={handleLogout} appData={appData} syncData={syncData} isSyncing={isSyncing} onToggleAdmin={() => setAdminModeActive(false)} isCimirro={isCimirro} />
      ) : (
        <UserDashboard user={user} onLogout={handleLogout} appData={appData} syncData={syncData} isSyncing={isSyncing} isAdmin={role === 'admin' || role === 'rt'} onToggleAdmin={() => setAdminModeActive(true)} />
      )}
    </ErrorBoundary>
  );
}
