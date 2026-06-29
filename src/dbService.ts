import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Professor, Revista, Turma, Aluno, FrequenciaEBD, Membro, FrequenciaCulto, Usuario } from "./types";

// --- SECURITY ERROR HANDLER (MANDATORY) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to convert Firestore snapshot to array with typed objects
const mapSnapshot = <T>(snapshot: any): T[] => {
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
};

// --- PROFESSORES ---
export const getProfessores = async (): Promise<Professor[]> => {
  const path = "professores";
  try {
    const colRef = collection(db, path);
    const q = query(colRef, orderBy("nome"));
    const snapshot = await getDocs(q);
    return mapSnapshot<Professor>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const addProfessor = async (prof: Omit<Professor, "id">): Promise<string> => {
  const path = "professores";
  try {
    const colRef = collection(db, path);
    const docRef = await addDoc(colRef, prof);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return "";
  }
};

export const updateProfessor = async (id: string, prof: Partial<Professor>): Promise<void> => {
  const path = `professores/${id}`;
  try {
    const docRef = doc(db, "professores", id);
    await updateDoc(docRef, prof);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteProfessor = async (id: string): Promise<void> => {
  const path = `professores/${id}`;
  try {
    const docRef = doc(db, "professores", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};


// --- REVISTAS ---
export const getRevistas = async (): Promise<Revista[]> => {
  const path = "revistas";
  try {
    const colRef = collection(db, path);
    const q = query(colRef, orderBy("ano", "desc"), orderBy("trimestre", "desc"));
    const snapshot = await getDocs(q);
    return mapSnapshot<Revista>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const addRevista = async (revista: Omit<Revista, "id">): Promise<string> => {
  const path = "revistas";
  try {
    const colRef = collection(db, path);
    const docRef = await addDoc(colRef, revista);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return "";
  }
};

export const updateRevista = async (id: string, revista: Partial<Revista>): Promise<void> => {
  const path = `revistas/${id}`;
  try {
    const docRef = doc(db, "revistas", id);
    await updateDoc(docRef, revista);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteRevista = async (id: string): Promise<void> => {
  const path = `revistas/${id}`;
  try {
    const docRef = doc(db, "revistas", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};


// --- TURMAS ---
export const getTurmas = async (): Promise<Turma[]> => {
  const path = "turmas";
  try {
    const colRef = collection(db, path);
    const q = query(colRef, orderBy("nome"));
    const snapshot = await getDocs(q);
    return mapSnapshot<Turma>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const addTurma = async (turma: Omit<Turma, "id">): Promise<string> => {
  const path = "turmas";
  try {
    const colRef = collection(db, path);
    const docRef = await addDoc(colRef, turma);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return "";
  }
};

export const updateTurma = async (id: string, turma: Partial<Turma>): Promise<void> => {
  const path = `turmas/${id}`;
  try {
    const docRef = doc(db, "turmas", id);
    await updateDoc(docRef, turma);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteTurma = async (id: string): Promise<void> => {
  const path = `turmas/${id}`;
  try {
    const docRef = doc(db, "turmas", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};


// --- ALUNOS ---
export const getAlunos = async (): Promise<Aluno[]> => {
  const path = "alunos";
  try {
    const colRef = collection(db, path);
    const q = query(colRef, orderBy("nome"));
    const snapshot = await getDocs(q);
    return mapSnapshot<Aluno>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const addAluno = async (aluno: Omit<Aluno, "id">): Promise<string> => {
  const path = "alunos";
  try {
    const colRef = collection(db, path);
    const docRef = await addDoc(colRef, aluno);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return "";
  }
};

export const addAlunosBatch = async (alunosList: Omit<Aluno, "id">[]): Promise<void> => {
  const path = "alunos";
  try {
    const colRef = collection(db, path);
    for (const aluno of alunosList) {
      await addDoc(colRef, aluno);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateAluno = async (id: string, aluno: Partial<Aluno>): Promise<void> => {
  const path = `alunos/${id}`;
  try {
    const docRef = doc(db, "alunos", id);
    await updateDoc(docRef, aluno);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteAluno = async (id: string): Promise<void> => {
  const path = `alunos/${id}`;
  try {
    const docRef = doc(db, "alunos", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};


// --- FREQUENCIA EBD ---
export const getFrequenciasEBD = async (): Promise<FrequenciaEBD[]> => {
  const path = "frequencia_ebd";
  try {
    const colRef = collection(db, path);
    const q = query(colRef, orderBy("data", "desc"));
    const snapshot = await getDocs(q);
    return mapSnapshot<FrequenciaEBD>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const saveFrequenciaEBD = async (freq: Omit<FrequenciaEBD, "id"> & { id?: string }): Promise<string> => {
  const path = "frequencia_ebd";
  try {
    const colRef = collection(db, path);
    if (freq.id) {
      const docRef = doc(db, path, freq.id);
      await setDoc(docRef, {
        turmaId: freq.turmaId,
        data: freq.data,
        hora: freq.hora,
        presencas: freq.presencas
      });
      return freq.id;
    } else {
      const docRef = await addDoc(colRef, freq);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return "";
  }
};

export const deleteFrequenciaEBD = async (id: string): Promise<void> => {
  const path = `frequencia_ebd/${id}`;
  try {
    const docRef = doc(db, "frequencia_ebd", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};


// --- MEMBROS ---
export const getMembros = async (): Promise<Membro[]> => {
  const path = "membros";
  try {
    const colRef = collection(db, path);
    const q = query(colRef, orderBy("nome"));
    const snapshot = await getDocs(q);
    return mapSnapshot<Membro>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const addMembro = async (membro: Omit<Membro, "id">): Promise<string> => {
  const path = "membros";
  try {
    const colRef = collection(db, path);
    const docRef = await addDoc(colRef, membro);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return "";
  }
};

export const updateMembro = async (id: string, membro: Partial<Membro>): Promise<void> => {
  const path = `membros/${id}`;
  try {
    const docRef = doc(db, "membros", id);
    await updateDoc(docRef, membro);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteMembro = async (id: string): Promise<void> => {
  const path = `membros/${id}`;
  try {
    const docRef = doc(db, "membros", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};


// --- FREQUENCIA CULTO ---
export const getFrequenciasCulto = async (): Promise<FrequenciaCulto[]> => {
  const path = "frequencia_culto";
  try {
    const colRef = collection(db, path);
    const q = query(colRef, orderBy("data", "desc"));
    const snapshot = await getDocs(q);
    return mapSnapshot<FrequenciaCulto>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const saveFrequenciaCulto = async (freq: Omit<FrequenciaCulto, "id"> & { id?: string }): Promise<string> => {
  const path = "frequencia_culto";
  try {
    const colRef = collection(db, path);
    if (freq.id) {
      const docRef = doc(db, path, freq.id);
      await setDoc(docRef, {
        data: freq.data,
        hora: freq.hora,
        nomeCulto: freq.nomeCulto,
        presencas: freq.presencas
      });
      return freq.id;
    } else {
      const docRef = await addDoc(colRef, freq);
      return docRef.id;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return "";
  }
};

export const deleteFrequenciaCulto = async (id: string): Promise<void> => {
  const path = `frequencia_culto/${id}`;
  try {
    const docRef = doc(db, "frequencia_culto", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// --- USUARIOS & APROVACOES ---
export const getUsuarios = async (): Promise<Usuario[]> => {
  const path = "usuarios";
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    return mapSnapshot<Usuario>(snapshot);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const createOrUpdateUsuario = async (uid: string, userProfile: Omit<Usuario, "id" | "uid">): Promise<void> => {
  const path = `usuarios/${uid}`;
  try {
    const docRef = doc(db, "usuarios", uid);
    await setDoc(docRef, {
      uid,
      ...userProfile
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateUsuarioStatus = async (uid: string, approved: boolean): Promise<void> => {
  const path = `usuarios/${uid}`;
  try {
    const docRef = doc(db, "usuarios", uid);
    await updateDoc(docRef, { approved });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteUsuarioDoc = async (uid: string): Promise<void> => {
  const path = `usuarios/${uid}`;
  try {
    const docRef = doc(db, "usuarios", uid);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

