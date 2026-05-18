import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Todo } from "./db";
import { Panda, Clipboard, ClipboardCheck, ClipboardPen, Pencil, Moon, Sun, CheckCheck, X } from 'lucide-react';

type View = "tasks" | "analytics";
type Draft = Pick<Todo, "title" | "description" | "dueDate">;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const formatDateTime = (timestamp?: number) =>
  timestamp
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(timestamp)
    : "Not set";

const toDateInputValue = (timestamp: number) => {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

const fromDateInputValue = (value: string) => new Date(value).getTime();

const blankDraft = (): Draft => ({
  title: "",
  description: "",
  dueDate: Date.now(),
});

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const saved = window.localStorage.getItem("app-theme");
    return saved === "light" ? "light" : "dark";
  });
  const [view, setView] = useState<View>("tasks");
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<"open" | "completed" | null>(null);

  const todos = useLiveQuery(() => db.todos.orderBy("createdAt").reverse().toArray(), [], []);

  const openTodos = todos.filter((todo) => !todo.completed).sort((a, b) => a.createdAt - b.createdAt);
  const completedTodos = todos.filter((todo) => todo.completed);

  const analytics = useMemo(() => buildAnalytics(todos), [todos]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("app-theme", theme);
  }, [theme]);

  const resetForm = () => {
    setDraft(blankDraft());
    setEditingId(null);
  };

  const saveTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.title.trim();
    const description = draft.description?.trim();

    if (!title) {
      return;
    }

    if (editingId) {
      const current = await db.todos.get(editingId);
      await db.todos.update(editingId, {
        title,
        description,
        dueDate: draft.dueDate,
        completedAt: current?.completed ? current.completedAt ?? Date.now() : undefined,
      });
    } else {
      await db.todos.add({
        id: crypto.randomUUID(),
        title,
        description,
        createdAt: Date.now(),
        dueDate: draft.dueDate || startOfToday(),
        completedAt: undefined,
        completed: false,
      });
    }

    resetForm();
  };

  const editTodo = (todo: Todo) => {
    setView("tasks");
    setEditingId(todo.id);
    setDraft({
      title: todo.title,
      description: todo.description ?? "",
      dueDate: todo.dueDate,
    });
  };

  const moveTodo = async (id: string, completed: boolean) => {
    await db.todos.update(id, {
      completed,
      completedAt: completed ? Date.now() : undefined,
    });
  };

  const onDrop = async (event: React.DragEvent<HTMLElement>, completed: boolean) => {
    event.preventDefault();
    setDropTarget(null);
    const id = event.dataTransfer.getData("text/todo-id");
    if (id) {
      await moveTodo(id, completed);
    }
  };

  return (
    <main className="min-h-screen bg-app-bg text-[var(--app-text)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-app-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="flex items-center gap-2 mb-4">
              <Panda/>
              <p className="text-lg font-bold tracking-[0.18em] text-app-accent">
                easyytodo
              </p>
            </span>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Today&apos;s work, sorted.
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="secondary-button inline-flex items-center gap-2"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              type="button"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Day" : "Night"}
            </button>
            <nav className="flex rounded-md border border-app-line bg-app-panel p-1">
              <button
                className={view === "tasks" ? "tab tab-active" : "tab"}
                onClick={() => setView("tasks")}
                type="button"
              >
                Tasks
              </button>
              <button
                className={view === "analytics" ? "tab tab-active" : "tab"}
                onClick={() => setView("analytics")}
                type="button"
              >
                Analytics
              </button>
            </nav>
          </div>
        </header>

        {view === "tasks" ? (
          <section className="grid flex-1 gap-5 py-6 lg:grid-cols-[360px_1fr]">
            <form className="h-fit rounded-lg border border-app-line bg-app-panel p-5" onSubmit={saveTodo}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {editingId ? <Clipboard /> : <Clipboard />}
                  {editingId ? "Edit task" : "New task"}
                </h2>
                {editingId ? (
                  <button className="ghost-button" type="button" onClick={resetForm}>
                    Cancel
                  </button>
                ) : null}
              </div>

              <label className="field">
                <span>Title</span>
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Write the task title"
                  className="font-['Cause']"
                  required
                />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Add optional context"
                  className="font-['Cause']"
                  rows={4}
                />
              </label>

              <label className="field">
                <span>Due date</span>
                <input
                  type="datetime-local"
                  value={toDateInputValue(draft.dueDate)}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, dueDate: fromDateInputValue(event.target.value) }))
                  }
                />
              </label>

              <button className="primary-button hover:brightness-125 mt-3 w-full cursor-pointer flex items-center gap-2 justify-center" type="submit">
                {editingId ? <Pencil /> : <Pencil />}
                {editingId ? "Save changes" : "Create task"}
              </button>
            </form>

            <div className="grid min-h-[560px] gap-5 xl:grid-cols-2">
              <TaskColumn
                icon={<ClipboardPen />}
                title="Open"
                todos={openTodos}
                emptyText="No open tasks for today."
                active={dropTarget === "open"}
                onDragEnter={() => setDropTarget("open")}
                onDrop={(event) => onDrop(event, false)}
                onEdit={editTodo}
                onDelete={(id) => db.todos.delete(id)}
                onToggleComplete={moveTodo}
              />
              <TaskColumn
                icon={<ClipboardCheck />}
                title="Completed"
                todos={completedTodos}
                emptyText="Drag finished tasks here."
                active={dropTarget === "completed"}
                onDragEnter={() => setDropTarget("completed")}
                onDrop={(event) => onDrop(event, true)}
                onEdit={editTodo}
                onDelete={(id) => db.todos.delete(id)}
                onToggleComplete={moveTodo}
              />
            </div>
          </section>
        ) : (
          <AnalyticsView analytics={analytics} />
        )}
      </div>
    </main>
  );
}

interface TaskColumnProps {
  icon: React.ReactNode;
  title: string;
  todos: Todo[];
  emptyText: string;
  active: boolean;
  onDragEnter: () => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

function TaskColumn({
  icon,
  title,
  todos,
  emptyText,
  active,
  onDragEnter,
  onDrop,
  onEdit,
  onDelete,
  onToggleComplete,
}: TaskColumnProps) {
  return (
    <section
      className={`flex min-h-[320px] flex-col rounded-lg border bg-app-panel p-4 transition ${
        active ? "border-app-accent" : "border-app-line"
      }`}
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <span className="rounded-full bg-app-soft px-3 py-1 text-sm text-zinc-600 dark:text-zinc-200">{todos.length}</span>
      </div>

      <div
        className={`flex flex-1 flex-col gap-3 ${
          todos.length > 5 ? "max-h-[34rem] overflow-y-auto pr-1 no-scrollbar" : ""
        }`}
      >
        {todos.length === 0 ? <p className="empty-state">{emptyText}</p> : null}
        {todos.map((todo) => (
          <article
            className="task-card"
            draggable
            key={todo.id}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/todo-id", todo.id);
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-['Cause'] break-words text-lg font-semibold">{todo.title}</h3>
                {todo.description ? (
                  <p className="font-['Cause'] mt-2 break-words text-sm leading-6 text-zinc-600 dark:text-zinc-300">{todo.description}</p>
                ) : null}
              </div>
              <span className={todo.completed ? "status status-done" : "status"}>{todo.completed ? "Done" : "In progress"}</span>
            </div>

            <dl className="font-['Cause'] mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(todo.createdAt)}</dd>
              </div>
              <div>
                <dt>Due</dt>
                <dd>{formatDateTime(todo.dueDate)}</dd>
              </div>
              {todo.completedAt ? (
                <div className="sm:col-span-2">
                  <dt>Completed</dt>
                  <dd>{formatDateTime(todo.completedAt)}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-4 flex gap-2">
              <button className="secondary-button hover:bg-app-accent/20 cursor-pointer" type="button" onClick={() => onEdit(todo)}>
                Edit
              </button>
              <button className="danger-button hover:bg-red-500/20 cursor-pointer" type="button" onClick={() => onDelete(todo.id)}>
                Delete
              </button>
              <div className="ml-auto">
                {!todo.completed ? (
                  <button
                    className="secondary-button cursor-pointer"
                    type="button"
                    onClick={() => onToggleComplete(todo.id, true)}
                  >
                    <CheckCheck size={16} />
                  </button>
                ) : (
                  <button
                    className="ghost-button cursor-pointer"
                    type="button"
                    onClick={() => onToggleComplete(todo.id, false)}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildAnalytics(todos: Todo[]) {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const completed = todos.filter((todo) => todo.completed);
  const completedThisWeek = completed.filter((todo) => (todo.completedAt ?? 0) >= weekAgo);
  const completedThisMonth = completed.filter((todo) => (todo.completedAt ?? 0) >= monthAgo);
  const createdThisWeek = todos.filter((todo) => todo.createdAt >= weekAgo);
  const createdThisMonth = todos.filter((todo) => todo.createdAt >= monthAgo);

  return {
    total: todos.length,
    open: todos.filter((todo) => !todo.completed).length,
    completed: completed.length,
    weekly: {
      created: createdThisWeek.length,
      completed: completedThisWeek.length,
      completionRate: percentage(completedThisWeek.length, createdThisWeek.length),
    },
    monthly: {
      created: createdThisMonth.length,
      completed: completedThisMonth.length,
      completionRate: percentage(completedThisMonth.length, createdThisMonth.length),
    },
  };
}

function percentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function AnalyticsView({ analytics }: { analytics: ReturnType<typeof buildAnalytics> }) {
  return (
    <section className="grid gap-5 py-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total tasks" value={analytics.total} />
        <Metric label="Open" value={analytics.open} />
        <Metric label="Completed" value={analytics.completed} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <InsightPanel title="Weekly insights" data={analytics.weekly} />
        <InsightPanel title="Monthly insights" data={analytics.monthly} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-app-line bg-app-panel p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-app-accent">{value}</p>
    </article>
  );
}

function InsightPanel({
  title,
  data,
}: {
  title: string;
  data: { created: number; completed: number; completionRate: number };
}) {
  return (
    <article className="rounded-lg border border-app-line bg-app-panel p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-5 grid gap-4">
        <AnalyticsRow label="Created" value={data.created} max={Math.max(data.created, data.completed, 1)} />
        <AnalyticsRow label="Completed" value={data.completed} max={Math.max(data.created, data.completed, 1)} />
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-zinc-400">Completion rate</span>
            <span>{data.completionRate}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-app-soft">
            <div className="h-full bg-app-accent" style={{ width: `${data.completionRate}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}

function AnalyticsRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(6, Math.round((value / max) * 100));

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-app-soft">
        <div className="h-full bg-white" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default App;
