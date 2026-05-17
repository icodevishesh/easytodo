import Dexie, { type Table } from "dexie";

export interface Todo {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  dueDate: number;
  completedAt?: number;
  completed: boolean;
}

class TodoDatabase extends Dexie {
  todos!: Table<Todo, string>;

  constructor() {
    super("todo-desk");
    this.version(1).stores({
      todos: "id, createdAt, dueDate, completed, completedAt",
    });
  }
}

export const db = new TodoDatabase();
