# Elvo

Elvo is an intelligent productivity application designed to help you achieve a state of "flow" by aligning your daily tasks with your self-reported energy levels. The core philosophy is to work smarter, not just harder. By tackling tasks that are best suited for your current mental and physical state, the app helps you build momentum, maintain motivation, and achieve your goals more effectively.

## Key Features

The application is built around a central dashboard and several key modules that provide a holistic and AI-enhanced productivity experience.

### 1. Dashboard: Your Daily Command Center

This is the main screen where you interact with the core features of the app.

-   **Energy Input**: Report your current energy level (Low, Medium, or High). This single input is the primary driver for the app's AI-powered recommendations.
-   **AI-Powered Task Suggestions**: Based on your energy input, the AI analyzes your task list and intelligently suggests the tasks that are most appropriate for you to work on right now.
-   **Task Management**: A complete to-do list where you can create, edit, and complete tasks. Each task can be assigned a category, project, deadline, effort level, and priority.
-   **Pomodoro Timer**: An integrated timer to help you use the Pomodoro Technique. You can select a task to focus on, and the timer will track your work sessions.
-   **Momentum Card**: Displays your **Daily Momentum Score**, which is calculated by an AI based on how well your completed tasks aligned with your reported energy. It also tracks your **streak** of productive days.
-   **Projects Overview**: A quick, at-a-glance carousel view of all your projects, each showing its completion percentage.
-   **Daily Work Report Card**: A simple interface to log your workday start and end times and see a summary of the day's goals, completed tasks, and in-progress items.

### 2. Projects Page

A dedicated section for high-level organization of your work.

-   **Create & Manage Projects**: Group related tasks together under different projects (e.g., "Q3 Marketing Campaign," "Personal Health Goals").
-   **Track Progress**: Each project is displayed as a card showing its overall progress with a radial chart, giving you an immediate sense of what's outstanding.

### 3. Recurring Tasks Page

Manage tasks that happen on a regular basis without having to create them manually each time.

-   **Weekly & Monthly Tabs**: Organize tasks based on their frequency.
-   **Status Tracking**: The system automatically tracks whether a recurring task has been completed for the current period (week or month).
-   **Auto-Reset**: Completion status resets automatically at the start of a new week or month.

### 4. Weekly Planner Page

Visualize and organize your tasks across a 7-day grid, providing a clear overview of your week.

-   **7-Day Grid View**: Each day of the current week is displayed as a column, showing all tasks with a deadline on that day.
-   **At-a-Glance Overview**: Quickly see which days are busy and which are lighter, helping you to balance your workload.

### 5. Reports Page

Log your work hours and generate summaries for your records or for sharing with a team.

-   **Daily Report Generation**: Log start/end times and get a summary of tasks completed.
-   **Report History**: View a history of all past daily reports, select any day to see its details, and copy the report to your clipboard or export it as a `.txt` file.

### 6. AI-Powered Analytics Page

Understand your productivity patterns over time with AI-driven insights.

-   **Flow Visualizer**: The AI analyzes your historical task and energy data to generate a visual chart that shows your task-energy alignment.
-   **AI Report**: Alongside the chart, the AI provides a textual report that summarizes your patterns and offers insights to help you improve your workflow.

## Technical Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Generative AI**: [Google's Gemini models](https://ai.google.dev/) via [Genkit](https://firebase.google.com/docs/genkit)
-   **Data Storage**: Local JSON files (simulating a database for prototype stage)

## Getting Started

To run the project locally, follow these steps:

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the development server**:
    The application requires two separate processes to run concurrently: the Next.js web app and the Genkit AI flows.

    -   In your first terminal, start the Next.js development server:
        ```bash
        npm run dev
        ```

    -   In a second terminal, start the Genkit server:
        ```bash
        npm run genkit:start
        ```

3.  **Open the app**:
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
