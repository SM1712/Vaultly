export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'in_progress' | 'done';

export interface Course {
    id: string;
    name: string;
    code?: string;
    color: string;
    professor?: string;
    schedule?: string;
    location?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date;
    status: Status;
    priority: Priority;
    courseId?: string;
    completedAt?: Date;
}
