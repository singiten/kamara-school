import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface SchoolInfo {
    name: string;
    logo: string;
    email: string;
    phone: string;
    address: string;
    principal: string;
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    audience: "All" | "Students" | "Teachers" | "Parents";
    date: string;
    status: "Published" | "Draft";
}

export interface AttendanceRecord {
    id: number;
    studentName: string;
    date: string;
    status: "present" | "absent" | "late";
    grade: string;
}

export interface GradeRecord {
    id: number;
    studentName: string;
    subject: string;
    score: number;
    grade: string;
    date: string;
}

type Role = "admin" | "registrar" | "finance_officer" | "teacher" | "student" | "parent";

interface AppContextType {
    schoolInfo: SchoolInfo;
    setSchoolInfo: (info: SchoolInfo) => void;
    announcements: Announcement[];
    setAnnouncements: (announcements: Announcement[]) => void;
    addAnnouncement: (announcement: Announcement) => void;
    updateAnnouncement: (id: number, data: Partial<Announcement>) => void;
    deleteAnnouncement: (id: number) => void;
    attendanceRecords: AttendanceRecord[];
    setAttendanceRecords: (records: AttendanceRecord[]) => void;
    addAttendanceRecord: (record: AttendanceRecord) => void;
    gradeRecords: GradeRecord[];
    setGradeRecords: (records: GradeRecord[]) => void;
    addGradeRecord: (record: GradeRecord) => void;
    currentRole: Role | null;
    setCurrentRole: (role: Role | null) => void;
}

const defaultSchoolInfo: SchoolInfo = {
    name: "Our School",
    logo: "",
    email: "info@ourschool.edu",
    phone: "+251 911 000000",
    address: "Adama, Ethiopia",
    principal: "Mr. Principal",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(defaultSchoolInfo);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
    const [currentRole, setCurrentRole] = useState<Role | null>(null);

    const addAnnouncement = (announcement: Announcement) => {
        setAnnouncements((prev) => [...prev, announcement]);
    };

    const updateAnnouncement = (id: number, data: Partial<Announcement>) => {
        setAnnouncements((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...data } : item))
        );
    };

    const deleteAnnouncement = (id: number) => {
        setAnnouncements((prev) => prev.filter((item) => item.id !== id));
    };

    const addAttendanceRecord = (record: AttendanceRecord) => {
        setAttendanceRecords((prev) => [...prev, record]);
    };

    const addGradeRecord = (record: GradeRecord) => {
        setGradeRecords((prev) => [...prev, record]);
    };

    return (
        <AppContext.Provider
            value={{
                schoolInfo,
                setSchoolInfo,
                announcements,
                setAnnouncements,
                addAnnouncement,
                updateAnnouncement,
                deleteAnnouncement,
                attendanceRecords,
                setAttendanceRecords,
                addAttendanceRecord,
                gradeRecords,
                setGradeRecords,
                addGradeRecord,
                currentRole,
                setCurrentRole,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within an AppContextProvider");
    }
    return context;
};
