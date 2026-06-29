import React, { useState, useEffect } from "react";
import { 
  getTurmas, 
  getProfessores, 
  getAlunos, 
  getRevistas, 
  getMembros 
} from "./dbService";
import { Turma, Professor, Aluno, Revista, Membro, Usuario } from "./types";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Subcomponents imports
import TurmasTab from "./components/TurmasTab";
import ProfessoresTab from "./components/ProfessoresTab";
import AlunosTab from "./components/AlunosTab";
import RevistasTab from "./components/RevistasTab";
import FrequenciaEBDTab from "./components/FrequenciaEBDTab";
import CultoSoleneTab from "./components/CultoSoleneTab";
import RelatoriosTab from "./components/RelatoriosTab";
import PesquisaGlobal from "./components/PesquisaGlobal";
import AniversariantesTab from "./components/AniversariantesTab";
import AprovacoesTab from "./components/AprovacoesTab";
import LoginForm from "./components/LoginForm";

// Icons
import { 
  School, BookOpen, Users, ClipboardCheck, BarChart3, 
  Search, BookOpenCheck, Loader2, RefreshCw, Calendar, Sparkles, Menu, X, Clock, Shield,
  ChevronLeft, ChevronRight, Cake, LogOut
} from "lucide-react";

type MainTab = "ebd" | "culto" | "relatorios" | "pesquisa" | "aniversariantes" | "aprovacoes";
type EBDSubTab = "frequencia" | "turmas" | "professores" | "alunos" | "revistas";

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>("ebd");
  const [activeEBDSubTab, setActiveEBDSubTab] = useState<EBDSubTab>("frequencia");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  // Auth states
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Databases states
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [revistas, setRevistas] = useState<Revista[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);

  // Loading and Error States
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "usuarios", currentUser.uid);
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            setUserProfile(userSnapshot.data() as Usuario);
          } else {
            const isMasterAdmin = currentUser.email?.toLowerCase().trim() === "vitorcatanio@gmail.com";
            const profile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              approved: isMasterAdmin,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, profile);
            setUserProfile({ id: currentUser.uid, ...profile });
          }
        } catch (err) {
          console.error("Erro ao carregar perfil do usuário:", err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  const loadAllData = async (isSilent = false) => {
    if (!isSilent) setInitialLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [turmasData, professoresData, alunosData, revistasData, membrosData] = await Promise.all([
        getTurmas(),
        getProfessores(),
        getAlunos(),
        getRevistas(),
        getMembros()
      ]);

      setTurmas(turmasData);
      setProfessores(professoresData);
      setAlunos(alunosData);
      setRevistas(revistasData);
      setMembros(membrosData);
    } catch (err: any) {
      setError("Falha ao comunicar com o servidor: " + err.message);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const handleRefresh = () => {
    loadAllData(true);
  };

  const handleGlobalNavigate = (tabName: string) => {
    if (tabName === "alunos") {
      setActiveTab("ebd");
      setActiveEBDSubTab("alunos");
    } else if (tabName === "turmas") {
      setActiveTab("ebd");
      setActiveEBDSubTab("turmas");
    } else if (tabName === "professores") {
      setActiveTab("ebd");
      setActiveEBDSubTab("professores");
    } else if (tabName === "culto") {
      setActiveTab("culto");
    }
  };

  // Format Current Date nicely
  const getTodayFormatted = () => {
    const today = new Date();
    return today.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (authLoading) {
    return (
      <div id="auth-loading-fallback" className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <div className="text-center">
          <p className="font-extrabold text-white text-base tracking-tight font-display">Autenticando Portal EBD...</p>
          <p className="text-xs text-slate-500">Aguarde enquanto verificamos sua sessão</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Check if the user has a registered profile and is approved
  const isMasterAdmin = user.email?.toLowerCase().trim() === "vitorcatanio@gmail.com";
  if (userProfile && !userProfile.approved && !isMasterAdmin) {
    return (
      <div id="pending-approval-container" className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/60 shadow-2xl rounded-3xl p-6 md:p-8 backdrop-blur-md z-10 text-center space-y-6 animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shadow-lg">
            <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white font-display tracking-tight">Cadastro em Análise! ⏳</h2>
            <p className="text-xs text-slate-400">E-mail registrado: <strong className="text-slate-300">{user.email}</strong></p>
          </div>

          <div className="p-4 bg-slate-900/40 border border-slate-700/30 rounded-2xl text-left text-xs text-slate-300 space-y-2.5">
            <p>
              Para garantir a segurança dos dados da escola dominical, todo novo acesso precisa ser autorizado pelo administrador.
            </p>
            <p className="text-amber-400 font-semibold">
              Sua solicitação de cadastro já está na lista de aprovações do Vitor Catânio. Assim que ele liberar seu perfil, seu painel será ativado!
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={async () => {
                try {
                  const userDocRef = doc(db, "usuarios", user.uid);
                  const userSnapshot = await getDoc(userDocRef);
                  if (userSnapshot.exists()) {
                    const prof = userSnapshot.data() as Usuario;
                    setUserProfile(prof);
                    if (prof.approved) {
                      window.location.reload();
                    } else {
                      alert("Seu cadastro ainda está em análise. Fale com o administrador!");
                    }
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Verificar se Fui Aprovado
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-slate-700/40 hover:bg-slate-700/60 text-slate-300 hover:text-white text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer"
            >
              Sair da Conta / Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div id="loading-fallback" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <div className="text-center">
          <p className="font-bold text-slate-800 text-lg">Iniciando Portal EBD...</p>
          <p className="text-sm text-slate-500">Conectando ao banco de dados seguro</p>
        </div>
      </div>
    );
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 flex flex-row font-sans overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR NAVIGATION (High Density Theme - Collapsible) --- */}
      <aside className={`${isSidebarCollapsed ? "w-16" : "w-64"} bg-slate-900 text-slate-300 hidden md:flex flex-col flex-shrink-0 border-r border-slate-800 transition-all duration-300 relative`}>
        
        {/* Floating Toggle Button */}
        <button
          id="toggle-sidebar-btn"
          onClick={toggleSidebar}
          className="absolute -right-3 top-5 w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center border border-slate-750 shadow-md cursor-pointer z-50 transition-all hover:scale-110 shrink-0"
          title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className="p-4 border-b border-slate-800 flex items-center h-14 overflow-hidden shrink-0">
          <div className="flex items-center gap-3 w-full justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 font-display shrink-0">P</div>
            {!isSidebarCollapsed && (
              <div className="transition-all duration-300 min-w-0">
                <h1 className="text-sm font-extrabold text-white tracking-tight leading-none font-display truncate">Portal EBD</h1>
                <span className="text-[9px] text-slate-500 font-medium tracking-wider uppercase truncate block mt-1">Secretaria Geral</span>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto space-y-6">
          {/* Menu Principal Section */}
          <div className="space-y-1">
            {!isSidebarCollapsed ? (
              <div className="px-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Menu Principal</div>
            ) : (
              <div className="mx-3 border-t border-slate-800/80 my-2" />
            )}
            <div className={`space-y-0.5 ${isSidebarCollapsed ? "px-1.5" : "px-2"}`}>
              <button
                id="maintab-ebd"
                onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("frequencia"); }}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                } ${
                  activeTab === "ebd" && activeEBDSubTab === "frequencia"
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title="Chamada Dominical"
              >
                <BookOpenCheck className="w-4.5 h-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Chamada Dominical</span>}
              </button>
              <button
                id="maintab-culto"
                onClick={() => setActiveTab("culto")}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                } ${
                  activeTab === "culto"
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title="Culto Solene"
              >
                <ClipboardCheck className="w-4.5 h-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Culto Solene</span>}
              </button>
              <button
                id="maintab-relatorios"
                onClick={() => setActiveTab("relatorios")}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                } ${
                  activeTab === "relatorios"
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title="Relatórios"
              >
                <BarChart3 className="w-4.5 h-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Relatórios</span>}
              </button>
              <button
                id="maintab-pesquisa"
                onClick={() => setActiveTab("pesquisa")}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                } ${
                  activeTab === "pesquisa"
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title="Pesquisa Global"
              >
                <Search className="w-4.5 h-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Pesquisa Global</span>}
              </button>
              <button
                id="maintab-aniversariantes"
                onClick={() => setActiveTab("aniversariantes")}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                } ${
                  activeTab === "aniversariantes"
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title="Aniversariantes"
              >
                <Cake className="w-4.5 h-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Aniversariantes</span>}
              </button>

              {isMasterAdmin && (
                <button
                  id="maintab-aprovacoes"
                  onClick={() => setActiveTab("aprovacoes")}
                  className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2"
                  } ${
                    activeTab === "aprovacoes"
                      ? "bg-amber-600 text-white shadow-sm shadow-amber-500/10"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                  title="Aprovações de Contas"
                >
                  <Shield className="w-4.5 h-4.5 shrink-0 text-amber-400" />
                  {!isSidebarCollapsed && <span className="truncate">Aprovações</span>}
                </button>
              )}
            </div>
          </div>

          {/* Configurações EBD Section */}
          <div className="space-y-1">
            {!isSidebarCollapsed ? (
              <div className="px-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">EBD & Classes</div>
            ) : (
              <div className="mx-3 border-t border-slate-800/80 my-2" />
            )}
            <div className={`space-y-0.5 ${isSidebarCollapsed ? "px-1.5" : "px-2"}`}>
              <button
                id="sidebar-ebd-turmas"
                onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("turmas"); }}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                } ${
                  activeTab === "ebd" && activeEBDSubTab === "turmas"
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                }`}
                title={`Turmas & Salas (${turmas.length})`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <School className="w-4.5 h-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Turmas & Salas</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none shrink-0">{turmas.length}</span>
                )}
              </button>
              <button
                id="sidebar-ebd-alunos"
                onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("alunos"); }}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                } ${
                  activeTab === "ebd" && activeEBDSubTab === "alunos"
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                }`}
                title={`Alunos Matriculados (${alunos.length})`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="w-4.5 h-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Alunos Matriculados</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none shrink-0">{alunos.length}</span>
                )}
              </button>
              <button
                id="sidebar-ebd-professores"
                onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("professores"); }}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                } ${
                  activeTab === "ebd" && activeEBDSubTab === "professores"
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                }`}
                title={`Professores (${professores.length})`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className="w-4.5 h-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Professores</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none shrink-0">{professores.length}</span>
                )}
              </button>
              <button
                id="sidebar-ebd-revistas"
                onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("revistas"); }}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                } ${
                  activeTab === "ebd" && activeEBDSubTab === "revistas"
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                }`}
                title={`Revistas (${revistas.length})`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BookOpen className="w-4.5 h-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">Revistas</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none shrink-0">{revistas.length}</span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* User Workspace Status */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/60 shrink-0">
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 font-mono">
                {(user?.email ? user.email.substring(0, 2).toUpperCase() : "CV")}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 transition-all duration-300">
                  <p className="text-xs font-semibold text-white truncate">{user?.email || "Convidado"}</p>
                  <p className="text-[9px] text-emerald-400 flex items-center gap-1 leading-none mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Banco Conectado
                  </p>
                </div>
              )}
            </div>
            
            <button
              id="sidebar-logout-btn"
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
              title="Sair do Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- RIGHT HAND CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* --- MOBILE COMPACT TOP HEADER --- */}
        <header className="bg-blue-900 text-white shadow-md md:hidden flex-shrink-0 z-40">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center border border-blue-700/50">
                <School className="w-4.5 h-4.5 text-blue-200" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight font-display">Portal EBD</h1>
                <span className="text-[9px] text-blue-300 font-medium block -mt-1">Secretaria Dominical</span>
              </div>
            </div>
            
            <button
              id="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-800/50 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </header>

        {/* --- MOBILE NAVIGATION DRAWER --- */}
        {mobileMenuOpen && (
          <div id="mobile-menu-drawer" className="md:hidden bg-slate-900 text-slate-300 py-3 px-4 space-y-3 shadow-xl border-b border-slate-800 absolute top-14 left-0 right-0 z-50">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider px-2 mb-1">Menu Principal</div>
              <div className="space-y-0.5">
                <button
                  id="mobile-tab-ebd"
                  onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("frequencia"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeTab === "ebd" && activeEBDSubTab === "frequencia" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <BookOpenCheck className="w-4 h-4" /> Chamada Dominical
                </button>
                <button
                  id="mobile-tab-culto"
                  onClick={() => { setActiveTab("culto"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeTab === "culto" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4" /> Culto Solene
                </button>
                <button
                  id="mobile-tab-relatorios"
                  onClick={() => { setActiveTab("relatorios"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeTab === "relatorios" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> Relatórios
                </button>
                <button
                  id="mobile-tab-pesquisa"
                  onClick={() => { setActiveTab("pesquisa"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeTab === "pesquisa" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Search className="w-4 h-4" /> Pesquisa Global
                </button>
                <button
                  id="mobile-tab-aniversariantes"
                  onClick={() => { setActiveTab("aniversariantes"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeTab === "aniversariantes" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Cake className="w-4 h-4" /> Aniversariantes
                </button>

                {isMasterAdmin && (
                  <button
                    id="mobile-tab-aprovacoes"
                    onClick={() => { setActiveTab("aprovacoes"); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                      activeTab === "aprovacoes" ? "bg-amber-600 text-white" : "text-amber-400 hover:bg-slate-800"
                    }`}
                  >
                    <Shield className="w-4 h-4" /> Aprovações Contas
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider px-2 mb-1">EBD & Classes</div>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("turmas"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                    activeTab === "ebd" && activeEBDSubTab === "turmas" ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-3"><School className="w-4 h-4" /> Turmas</span>
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono">{turmas.length}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("alunos"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                    activeTab === "ebd" && activeEBDSubTab === "alunos" ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-3"><Users className="w-4 h-4" /> Alunos</span>
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono">{alunos.length}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("professores"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                    activeTab === "ebd" && activeEBDSubTab === "professores" ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-3"><Users className="w-4 h-4" /> Professores</span>
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono">{professores.length}</span>
                </button>
                <button
                  onClick={() => { setActiveTab("ebd"); setActiveEBDSubTab("revistas"); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold ${
                    activeTab === "ebd" && activeEBDSubTab === "revistas" ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-3"><BookOpen className="w-4 h-4" /> Revistas</span>
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono">{revistas.length}</span>
                </button>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800 flex flex-col gap-2 px-2 text-[11px]">
              <div className="flex justify-between items-center text-slate-500">
                <span>{getTodayFormatted()}</span>
                <button
                  id="mobile-refresh-btn"
                  onClick={() => { handleRefresh(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-1 text-slate-400 font-semibold cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> Atualizar
                </button>
              </div>
              <button
                id="mobile-logout-btn"
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 font-bold rounded-lg border border-red-900/20 cursor-pointer mt-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair da Conta
              </button>
            </div>
          </div>
        )}

        {/* --- DESKTOP HIGH DENSITY HEADER & CONTROL BAR --- */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight font-display flex items-center gap-2">
              {activeTab === "ebd" && (
                <>
                  <BookOpenCheck className="w-4.5 h-4.5 text-blue-600" />
                  <span>Escola Bíblica Dominical</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500 font-medium capitalize text-xs">
                    {activeEBDSubTab === "frequencia" && "Chamada Dominical"}
                    {activeEBDSubTab === "turmas" && "Controle de Turmas"}
                    {activeEBDSubTab === "alunos" && "Alunos"}
                    {activeEBDSubTab === "professores" && "Professores"}
                    {activeEBDSubTab === "revistas" && "Revistas de Trimestre"}
                  </span>
                </>
              )}
              {activeTab === "culto" && (
                <>
                  <ClipboardCheck className="w-4.5 h-4.5 text-blue-600" />
                  <span>Culto Solene</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500 font-medium text-xs">Frequência da Congregação</span>
                </>
              )}
              {activeTab === "relatorios" && (
                <>
                  <BarChart3 className="w-4.5 h-4.5 text-blue-600" />
                  <span>Relatórios</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500 font-medium text-xs">Estatísticas Gerais</span>
                </>
              )}
              {activeTab === "pesquisa" && (
                <>
                  <Search className="w-4.5 h-4.5 text-blue-600" />
                  <span>Pesquisa Global</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500 font-medium text-xs">Localizador Geral</span>
                </>
              )}
              {activeTab === "aniversariantes" && (
                <>
                  <Cake className="w-4.5 h-4.5 text-blue-600" />
                  <span>Aniversariantes</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500 font-medium text-xs">Quadro de Aniversários</span>
                </>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3.5">
            <span className="hidden lg:inline-flex text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/80 font-semibold font-mono">
              {getTodayFormatted()}
            </span>
            
            <button
              id="global-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer disabled:opacity-50 border border-slate-200 bg-white"
              title="Sincronizar Banco de Dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* --- WORKSPACE SCROLL PANE --- */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-5 flex gap-3 shadow-xs">
              <X className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Ocorreu um erro de comunicação</p>
                <p className="text-xs">{error}</p>
              </div>
            </div>
          )}

          {/* --- HIGH DENSITY TABS BAR FOR MOBILE (EBD SUBTABS ONLY) --- */}
          {activeTab === "ebd" && (
            <div className="md:hidden flex overflow-x-auto scrollbar-none items-center gap-1 pb-3 mb-4 border-b border-slate-200/60 text-[11px]">
              <button
                id="subtab-frequencia"
                onClick={() => setActiveEBDSubTab("frequencia")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  activeEBDSubTab === "frequencia" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 bg-white border border-slate-200"
                }`}
              >
                Chamada
              </button>
              <button
                id="subtab-turmas"
                onClick={() => setActiveEBDSubTab("turmas")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  activeEBDSubTab === "turmas" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 bg-white border border-slate-200"
                }`}
              >
                Turmas ({turmas.length})
              </button>
              <button
                id="subtab-alunos"
                onClick={() => setActiveEBDSubTab("alunos")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  activeEBDSubTab === "alunos" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 bg-white border border-slate-200"
                }`}
              >
                Alunos ({alunos.length})
              </button>
              <button
                id="subtab-professores"
                onClick={() => setActiveEBDSubTab("professores")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  activeEBDSubTab === "professores" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 bg-white border border-slate-200"
                }`}
              >
                Professores ({professores.length})
              </button>
              <button
                id="subtab-revistas"
                onClick={() => setActiveEBDSubTab("revistas")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                  activeEBDSubTab === "revistas" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 bg-white border border-slate-200"
                }`}
              >
                Revistas ({revistas.length})
              </button>
            </div>
          )}

          {/* --- ACTIVE WORKSPACE COMPONENT --- */}
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === "ebd" && (
              <div id="ebd-workspace-content" className="animate-fade-in">
                {activeEBDSubTab === "frequencia" && (
                  <FrequenciaEBDTab 
                    turmas={turmas} 
                    alunos={alunos} 
                    onRefresh={handleRefresh} 
                  />
                )}
                {activeEBDSubTab === "turmas" && (
                  <TurmasTab 
                    turmas={turmas} 
                    professores={professores} 
                    revistas={revistas} 
                    onRefresh={handleRefresh} 
                  />
                )}
                {activeEBDSubTab === "alunos" && (
                  <AlunosTab 
                    alunos={alunos} 
                    turmas={turmas} 
                    onRefresh={handleRefresh} 
                  />
                )}
                {activeEBDSubTab === "professores" && (
                  <ProfessoresTab 
                    professores={professores} 
                    turmas={turmas} 
                    onRefresh={handleRefresh} 
                  />
                )}
                {activeEBDSubTab === "revistas" && (
                  <RevistasTab 
                    revistas={revistas} 
                    turmas={turmas} 
                    onRefresh={handleRefresh} 
                  />
                )}
              </div>
            )}

            {activeTab === "culto" && (
              <div id="culto-workspace-content" className="animate-fade-in">
                <CultoSoleneTab 
                  turmas={turmas} 
                  onRefresh={handleRefresh} 
                />
              </div>
            )}

            {activeTab === "relatorios" && (
              <div id="relatorios-workspace-content" className="animate-fade-in">
                <RelatoriosTab 
                  turmas={turmas} 
                  alunos={alunos} 
                  membros={membros} 
                  professores={professores}
                />
              </div>
            )}

            {activeTab === "pesquisa" && (
              <div id="pesquisa-workspace-content" className="animate-fade-in">
                <PesquisaGlobal 
                  alunos={alunos} 
                  professores={professores} 
                  turmas={turmas} 
                  membros={membros} 
                  onNavigateToTab={handleGlobalNavigate}
                />
              </div>
            )}

            {activeTab === "aniversariantes" && (
              <div id="aniversariantes-workspace-content" className="animate-fade-in">
                <AniversariantesTab 
                  alunos={alunos} 
                  membros={membros} 
                  turmas={turmas} 
                />
              </div>
            )}

            {activeTab === "aprovacoes" && isMasterAdmin && (
              <div id="aprovacoes-workspace-content" className="animate-fade-in">
                <AprovacoesTab />
              </div>
            )}
          </div>

          {/* --- HIGH DENSITY FOOTER --- */}
          <footer className="mt-12 py-5 border-t border-slate-200/60 text-center text-[11px] text-slate-400 font-semibold">
            <p>© 2026 Portal EBD • Sistema Integrado de Controle de Escola Bíblica Dominical e Secretaria de Culto.</p>
          </footer>
        </main>

      </div>
    </div>
  );
}
