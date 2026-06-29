import React, { useState } from "react";
import { Aluno, Membro, Turma } from "../types";
import { Cake, Gift, Phone, Search, Users, Calendar, MessageCircle, Info } from "lucide-react";

interface AniversariantesTabProps {
  alunos: Aluno[];
  membros: Membro[];
  turmas: Turma[];
}

interface BirthdayPerson {
  id: string;
  nome: string;
  dataNascimento: string;
  telefone: string;
  tipo: "Aluno" | "Membro";
  turmaNome: string;
  dia: number;
  mes: number;
  anoNasc: number;
  idadeFutura: number;
  isToday: boolean;
  isThisWeek: boolean;
  isThisMonth: boolean;
}

export default function AniversariantesTab({ alunos, membros, turmas }: AniversariantesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1 to 12

  // Map month names
  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Helper to find turma name
  const getTurmaNome = (turmaId?: string) => {
    if (!turmaId) return "Não associado";
    const t = turmas.find((item) => item.id === turmaId);
    return t ? t.nome : "Não associado";
  };

  // Process all people to extract birthday information
  const today = new Date();
  const currentYear = today.getFullYear();

  // Helper to check if a date is within this week (Sunday to Saturday)
  const checkIfThisWeek = (birthMonth: number, birthDay: number) => {
    const todayDayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - todayDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const bdateThisYear = new Date(currentYear, birthMonth - 1, birthDay);
    
    // Handle year wrap if the calendar week spans across years (extremely rare for birthdays, but safe)
    return bdateThisYear >= startOfWeek && bdateThisYear <= endOfWeek;
  };

  const allPeople: BirthdayPerson[] = [
    ...alunos.map((a) => {
      const parts = (a.dataNascimento || "").split("-");
      const anoNasc = parts[0] ? parseInt(parts[0], 10) : 0;
      const mes = parts[1] ? parseInt(parts[1], 10) : 0;
      const dia = parts[2] ? parseInt(parts[2], 10) : 0;
      const isToday = mes === today.getMonth() + 1 && dia === today.getDate();
      const isThisWeek = mes > 0 && dia > 0 ? checkIfThisWeek(mes, dia) : false;
      const isThisMonth = mes === today.getMonth() + 1;
      const idadeFutura = anoNasc > 0 ? currentYear - anoNasc : 0;

      return {
        id: a.id,
        nome: a.nome,
        dataNascimento: a.dataNascimento,
        telefone: a.telefone,
        tipo: "Aluno" as const,
        turmaNome: getTurmaNome(a.turmaId),
        dia,
        mes,
        anoNasc,
        idadeFutura,
        isToday,
        isThisWeek,
        isThisMonth,
      };
    }),
    ...membros.map((m) => {
      const parts = (m.dataNascimento || "").split("-");
      const anoNasc = parts[0] ? parseInt(parts[0], 10) : 0;
      const mes = parts[1] ? parseInt(parts[1], 10) : 0;
      const dia = parts[2] ? parseInt(parts[2], 10) : 0;
      const isToday = mes === today.getMonth() + 1 && dia === today.getDate();
      const isThisWeek = mes > 0 && dia > 0 ? checkIfThisWeek(mes, dia) : false;
      const isThisMonth = mes === today.getMonth() + 1;
      const idadeFutura = anoNasc > 0 ? currentYear - anoNasc : 0;

      return {
        id: m.id,
        nome: m.nome,
        dataNascimento: m.dataNascimento,
        telefone: m.telefone,
        tipo: "Membro" as const,
        turmaNome: getTurmaNome(m.turmaId),
        dia,
        mes,
        anoNasc,
        idadeFutura,
        isToday,
        isThisWeek,
        isThisMonth,
      };
    })
  ].filter(p => p.dia > 0 && p.mes > 0); // Filter out invalid birth dates

  // Sort by day and then by name
  const sortedPeople = [...allPeople].sort((a, b) => {
    if (a.mes !== b.mes) return a.mes - b.mes;
    if (a.dia !== b.dia) return a.dia - b.dia;
    return a.nome.localeCompare(b.nome);
  });

  // Filtered groups
  const aniversariantesHoje = sortedPeople.filter(p => p.isToday);
  const aniversariantesSemana = sortedPeople.filter(p => p.isThisWeek && !p.isToday);
  const aniversariantesMes = sortedPeople.filter(p => p.isThisMonth && !p.isToday && !p.isThisWeek);

  // General monthly list (interactive select filter)
  const aniversariantesDoMesSelecionado = sortedPeople.filter(p => {
    const matchesMonth = p.mes === selectedMonth;
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.turmaNome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMonth && matchesSearch;
  });

  // Format phone for WhatsApp
  const getWhatsAppLink = (phone: string, nome: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const dddAndPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(`Olá, ${nome}! O Portal da EBD lhe deseja um feliz aniversário! Que Deus abençoe ricamente sua vida e ministério. 🎉✨`);
    return `https://wa.me/${dddAndPhone}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Stat Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-5 text-white shadow-md shadow-rose-500/10 flex items-center justify-between">
          <div>
            <span className="text-white/85 text-xs font-bold uppercase tracking-wider block mb-1">Aniversariantes de Hoje</span>
            <span className="text-3xl font-extrabold font-display leading-none">{aniversariantesHoje.length}</span>
            <p className="text-[10px] text-pink-100/90 mt-2 font-medium">Parabéns aos aniversariantes do dia!</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/15">
            <Cake className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-md shadow-orange-500/10 flex items-center justify-between">
          <div>
            <span className="text-white/85 text-xs font-bold uppercase tracking-wider block mb-1">Nesta Semana</span>
            <span className="text-3xl font-extrabold font-display leading-none">{aniversariantesHoje.length + aniversariantesSemana.length}</span>
            <p className="text-[10px] text-amber-100/90 mt-2 font-medium">Total de celebrações nesta semana civil</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/15">
            <Gift className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md shadow-indigo-500/10 flex items-center justify-between">
          <div>
            <span className="text-white/85 text-xs font-bold uppercase tracking-wider block mb-1">No Mês Atual</span>
            <span className="text-3xl font-extrabold font-display leading-none">
              {sortedPeople.filter(p => p.isThisMonth).length}
            </span>
            <p className="text-[10px] text-blue-100/90 mt-2 font-medium">Celebrando a comunhão em {mesesNomes[today.getMonth()]}</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/15">
            <Calendar className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Main Alert Banner if someone is celebrating today */}
      {aniversariantesHoje.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-sm animate-pulse-slow">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-700 shrink-0">
            <Cake className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-extrabold text-amber-800 font-display">Hoje é dia de festa! 🎉</h4>
            <p className="text-xs text-amber-700 mt-1">
              {aniversariantesHoje.map(p => `${p.nome} (${p.tipo})`).join(", ")} {aniversariantesHoje.length === 1 ? "está" : "estão"} completando mais um ano de vida hoje. Que tal enviar uma mensagem de felicitações?
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
            {aniversariantesHoje.map(p => (
              <a
                key={p.id}
                href={getWhatsAppLink(p.telefone, p.nome)}
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center gap-1.5 justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-all grow md:grow-0"
              >
                <MessageCircle className="w-4 h-4" /> Parabenizar {p.nome.split(" ")[0]}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Immediate Birthdays vs Search list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Immediate (Today and This Week) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider font-display flex items-center gap-2">
                <Cake className="w-4 h-4 text-pink-400" /> Celebrantes Imediatos
              </h3>
              <span className="bg-pink-500/20 text-pink-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                {aniversariantesHoje.length + aniversariantesSemana.length} Total
              </span>
            </div>

            <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
              {/* Today list */}
              <div>
                <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span> Hoje ({aniversariantesHoje.length})
                </h4>
                {aniversariantesHoje.length === 0 ? (
                  <p className="text-xs text-slate-400 italic pl-3">Nenhum aniversariante hoje.</p>
                ) : (
                  <div className="space-y-2">
                    {aniversariantesHoje.map(p => (
                      <BirthdayCard key={p.id} person={p} onSendWpp={() => { window.open(getWhatsAppLink(p.telefone, p.nome), "_blank"); }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-4" />

              {/* This Week list */}
              <div>
                <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">
                  Esta Semana ({aniversariantesSemana.length})
                </h4>
                {aniversariantesSemana.length === 0 ? (
                  <p className="text-xs text-slate-400 italic pl-3">Nenhum outro aniversariante esta semana.</p>
                ) : (
                  <div className="space-y-2">
                    {aniversariantesSemana.map(p => (
                      <BirthdayCard key={p.id} person={p} onSendWpp={() => { window.open(getWhatsAppLink(p.telefone, p.nome), "_blank"); }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Search by month */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-blue-600" /> Calendário Mensal
                </h3>
                <p className="text-xs text-slate-400">Consulte aniversariantes de qualquer mês do ano</p>
              </div>

              {/* Month Selector dropdown */}
              <select
                id="select-month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {mesesNomes.map((nome, idx) => (
                  <option key={idx} value={idx + 1}>{nome}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="birthday-search"
                type="text"
                placeholder="Buscar aniversariante por nome ou classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {aniversariantesDoMesSelecionado.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Nenhum aniversariante encontrado</p>
                  <p className="text-[10px] text-slate-400">Altere o mês ou ajuste sua busca acima.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aniversariantesDoMesSelecionado.map(p => (
                    <div 
                      key={p.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 bg-slate-50/50 hover:bg-slate-50 ${
                        p.isToday 
                          ? "border-pink-300 bg-pink-50/20 shadow-xs" 
                          : p.isThisWeek 
                            ? "border-amber-300 bg-amber-50/20" 
                            : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800 truncate block">{p.nome}</span>
                            <span className={`text-[8px] font-bold px-1 py-0.2 rounded shrink-0 ${
                              p.tipo === "Aluno" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            }`}>
                              {p.tipo}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium block truncate mt-0.5">
                            Classe: {p.turmaNome}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-blue-600 block leading-none">{p.dia.toString().padStart(2, "0")}</span>
                          <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider block mt-0.5">{mesesNomes[p.mes - 1]?.substring(0, 3)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                        <span className="text-slate-500 font-medium">
                          {p.idadeFutura > 0 ? `Fará ${p.idadeFutura} anos` : "Idade n/d"}
                        </span>
                        
                        <a
                          href={getWhatsAppLink(p.telefone, p.nome)}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// Compact individual birthday item card helper
function BirthdayCard({ person, onSendWpp }: { person: BirthdayPerson; onSendWpp: () => void; key?: React.Key }) {
  return (
    <div className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
      person.isToday 
        ? "bg-pink-50/35 border-pink-200 hover:bg-pink-50/50" 
        : "bg-slate-50/50 border-slate-100 hover:bg-slate-50"
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
          person.isToday 
            ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm" 
            : "bg-slate-200 text-slate-600"
        }`}>
          {person.isToday ? <Cake className="w-4.5 h-4.5" /> : person.nome.substring(0, 2).toUpperCase()}
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h5 className="font-bold text-xs text-slate-800 truncate">{person.nome}</h5>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
              person.tipo === "Aluno" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-purple-50 text-purple-600 border border-purple-100"
            }`}>
              {person.tipo}
            </span>
          </div>
          
          <p className="text-[10px] text-slate-500 truncate mt-0.5">
            {person.idadeFutura > 0 ? `Completa ${person.idadeFutura} anos` : "Data: " + person.dataNascimento}
          </p>
          <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">
            {person.turmaNome}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onSendWpp}
          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
          title="Enviar WhatsApp"
        >
          <Phone className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
