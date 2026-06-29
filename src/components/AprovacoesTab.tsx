import React, { useState, useEffect } from "react";
import { Usuario } from "../types";
import { getUsuarios, updateUsuarioStatus, deleteUsuarioDoc } from "../dbService";
import { Users, Check, X, Shield, Clock, AlertTriangle, Search, Loader2, Mail } from "lucide-react";

export default function AprovacoesTab() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const list = await getUsuarios();
      setUsuarios(list);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const handleApprove = async (uid: string) => {
    setActioningId(uid);
    try {
      await updateUsuarioStatus(uid, true);
      // Update local state
      setUsuarios(prev => prev.map(u => u.uid === uid ? { ...u, approved: true } : u));
    } catch (err) {
      console.error("Erro ao aprovar usuário:", err);
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (uid: string) => {
    if (!window.confirm("Tem certeza que deseja recusar e excluir o cadastro deste usuário?")) return;
    setActioningId(uid);
    try {
      await deleteUsuarioDoc(uid);
      // Remove from local state
      setUsuarios(prev => prev.filter(u => u.uid !== uid));
    } catch (err) {
      console.error("Erro ao recusar usuário:", err);
    } finally {
      setActioningId(null);
    }
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
    u.email !== "vitorcatanio@gmail.com" // Hide master admin from list
  );

  const pendingCount = filteredUsuarios.filter(u => !u.approved).length;

  return (
    <div className="space-y-6">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md flex items-center justify-between border border-slate-800">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Aprovações Pendentes</span>
            <span className="text-3xl font-extrabold font-display leading-none text-amber-400">{pendingCount}</span>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Usuários aguardando sua liberação para acessar o sistema</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center border border-amber-500/20">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md flex items-center justify-between border border-slate-800">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Total de Usuários</span>
            <span className="text-3xl font-extrabold font-display leading-none text-blue-400">{filteredUsuarios.length}</span>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Contas criadas (excluindo o Administrador Master)</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center border border-blue-500/20">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Panel Header */}
        <div className="p-4 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold font-display flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-blue-400" /> Gestão de Acessos e Usuários
            </h3>
            <p className="text-[10px] text-slate-400">Somente você, Vitor Catânio, tem acesso a esta aba de moderação</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="user-search"
              type="text"
              placeholder="Buscar por e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 w-full sm:w-48 text-white"
            />
            <button
              onClick={loadUsuarios}
              disabled={loading}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              title="Recarregar"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="divide-y divide-slate-100">
          {loading && usuarios.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
              <p className="text-xs font-semibold">Carregando lista de usuários...</p>
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">Nenhum usuário encontrado</p>
              <p className="text-[10px] text-slate-400">Quando as pessoas se cadastrarem, elas aparecerão aqui para sua aprovação.</p>
            </div>
          ) : (
            filteredUsuarios.map((u) => (
              <div 
                key={u.uid} 
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  !u.approved ? "bg-amber-50/20" : "hover:bg-slate-50/30"
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    u.approved ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse-slow"
                  }`}>
                    {u.approved ? <Check className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate block">{u.email}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        u.approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {u.approved ? "Aprovado" : "Pendente"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Cadastrado em: {new Date(u.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!u.approved ? (
                    <>
                      <button
                        onClick={() => handleApprove(u.uid)}
                        disabled={actioningId !== null}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        {actioningId === u.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Aprovar Acesso
                      </button>
                      <button
                        onClick={() => handleDecline(u.uid)}
                        disabled={actioningId !== null}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 border border-slate-200 hover:border-red-200"
                      >
                        Recusar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDecline(u.uid)}
                      disabled={actioningId !== null}
                      className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-slate-100 cursor-pointer"
                      title="Excluir Usuário"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Integration Guide Mockup */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-slate-700 font-display flex items-center gap-1.5">
          <Mail className="w-4 h-4 text-slate-500" /> Guia de Envio de E-mail Notificações (Opcional)
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Para que você receba um e-mail em tempo real toda vez que um novo cadastro for solicitado, você pode configurar uma <strong>Cloud Function</strong> no Firebase ou um webhook no seu backend integrado com serviços como o <strong>Resend</strong> ou <strong>SendGrid</strong>.
        </p>
        <p className="text-xs text-slate-500">
          Atualmente, o sistema já faz a triagem com perfeição: novas contas são bloqueadas em uma tela de espera até que você as aprove aqui mesmo!
        </p>
      </div>

    </div>
  );
}
