import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { createOrUpdateUsuario } from "../dbService";
import { Lock, Mail, Loader2, Sparkles, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      setError("Por favor, digite seu e-mail no campo acima e depois clique em 'Esqueceu a senha?' para redefinir.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccess("E-mail de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada e spam.");
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);
      let ptMsg = "Não foi possível enviar o e-mail de redefinição.";
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        ptMsg = "E-mail inválido ou não cadastrado.";
      } else if (err.code === "auth/operation-not-allowed") {
        ptMsg = "O serviço de redefinição de senha está desabilitado nas configurações do Firebase.";
      } else {
        ptMsg = err.message || ptMsg;
      }
      setError(ptMsg);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const reason = sessionStorage.getItem("auth_blocked_reason");
    if (reason) {
      setError(reason);
      sessionStorage.removeItem("auth_blocked_reason");
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validation
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !password) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        // Create user with Firebase Auth
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = credential.user;
        
        // Master admin email auto-approved, others start as pending
        const isMasterAdmin = cleanEmail === "vitorcatanio@gmail.com";
        const status = isMasterAdmin ? "aprovado" : "pendente";
        
        // Write status profile to Firestore
        await createOrUpdateUsuario(user.uid, {
          email: cleanEmail,
          status,
          createdAt: new Date().toISOString()
        });

        if (isMasterAdmin) {
          setSuccess("Conta administrativa criada com sucesso! Carregando...");
        } else {
          setSuccess("Cadastro realizado com sucesso! Carregando...");
        }
      } else {
        // Sign in with Firebase Auth
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        setSuccess("Login efetuado com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro na autenticação:", err);
      // Map common Firebase error messages to pleasant Portuguese translations
      let ptMsg = "Erro na autenticação. Verifique os dados.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        ptMsg = "Credenciais inválidas ou senha incorreta. Verifique os dados.";
      } else if (err.code === "auth/user-not-found") {
        ptMsg = "Usuário não cadastrado com este e-mail.";
      } else if (err.code === "auth/email-already-in-use") {
        ptMsg = "Este e-mail já está cadastrado no sistema! Caso não saiba a senha, digite seu e-mail acima e clique em 'Esqueceu a senha?' logo abaixo para receber um link de redefinição.";
      } else if (err.code === "auth/invalid-email") {
        ptMsg = "O formato do e-mail digitado é inválido.";
      } else if (err.code === "auth/weak-password") {
        ptMsg = "A senha é muito fraca. Digite pelo menos 6 caracteres.";
      } else if (err.code === "auth/operation-not-allowed") {
        ptMsg = "⚠️ ATENÇÃO: O provedor de login com 'E-mail/Senha' está desativado no Firebase. Vitor, para corrigir isso, acesse o Console do Firebase > Authentication > Sign-in method e habilite o provedor 'E-mail/Senha'.";
      } else {
        ptMsg = err.message || ptMsg;
      }
      setError(ptMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background abstract decoration elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/60 shadow-2xl rounded-3xl p-6 md:p-8 backdrop-blur-md z-10 transition-all">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white font-display tracking-tight">Portal EBD</h2>
          <p className="text-xs text-slate-400 font-medium">Secretaria Geral e Controle de Escola Dominical</p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs flex gap-2.5 items-start mb-5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs flex gap-2.5 items-start mb-5">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                id="login-email"
                type="email"
                placeholder="seu-email@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs text-white bg-slate-900/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-slate-900 transition-all"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Senha</label>
              {!isRegisterMode && (
                <button
                  id="btn-forgot-password"
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder={isRegisterMode ? "Escolha uma senha segura" : "Digite sua senha de acesso"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs text-white bg-slate-900/60 border border-slate-700/60 rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-slate-900 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (only on Register Mode) */}
          {isRegisterMode && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="login-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha escolhida"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs text-white bg-slate-900/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-slate-900 transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:pointer-events-none mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegisterMode ? (
              "Criar Conta Gratuita"
            ) : (
              "Acessar Painel"
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-6 space-y-4 border-t border-slate-700/50 pt-5 text-center text-xs">
          <p className="text-slate-400">
            {isRegisterMode ? "Já possui uma conta?" : "Não possui uma conta de acesso?"}{" "}
            <button
              id="btn-toggle-mode"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError(null);
                setSuccess(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-bold hover:underline cursor-pointer"
            >
              {isRegisterMode ? "Faça login" : "Cadastre-se agora"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
