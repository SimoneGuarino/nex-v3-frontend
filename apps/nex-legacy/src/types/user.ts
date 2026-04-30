export interface UserContextTypes {
    details?: User;
    token?: string;
};

export interface User {
    _id: string;
    nome: string;
    cognome: string;
    multiRuolo: number[];
    username: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
};