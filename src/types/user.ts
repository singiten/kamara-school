// src/types/user.ts
export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    gender?: string;
    grade?: string;
    password?: string;
    department?: string;
    subject?: string;
    age?: number;
    parentId?: string;
    role?: 'student' | 'teacher' | 'parent' | 'admin';
}