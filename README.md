# Todo Desk

A minimal modern todo app built with React, TypeScript, Tailwind CSS, and Dexie.js. Tasks are stored locally in IndexedDB through Dexie.

## Features

- Create tasks for the current day.
- Keep tasks in two sections: Open and Completed.
- Drag tasks from Open to Completed to mark them done.
- Edit or delete any task.
- Store task fields: `id`, `title`, `description`, `createdAt`, `dueDate`, `completedAt`, and `completed`.
- View weekly and monthly analytics for created tasks, completed tasks, and completion rate.

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Dexie.js
- Vite

## Application Steps

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the local URL printed by Vite.

4. Add a task using the form on the left.

5. Drag the task from Open to Completed when it is finished.

6. Use Edit or Delete from each task card when needed.

7. Open Analytics to review weekly and monthly insights.

## Build

```bash
npm run build
```
