
# ToDoApp - Task Management App

A task management application designed to help users organize tasks, track their progress, and stay motivated through gamification and a modern modular interface.

---

## Problem Domain and Motivation

### The Problem
Many users struggle to manage their tasks, projects, and deadlines efficiently. Existing task management tools are either too generic, overly complex, or fail to provide meaningful ways to organize and track progress. Common challenges include:  

- Losing track of multiple tasks and deadlines  
- Difficulty managing projects with multiple steps or sub-tasks  
- Hard to get a clear overview of workload at a glance  
- Lack of motivation or feedback to complete tasks on time  

### Why It Matters
Poor task organization and visibility can lead to missed deadlines, reduced productivity, and increased stress. Users need a system that **simplifies task management**, **helps them track progress**, and **keeps them motivated** to complete tasks efficiently.

### Our Solution
Our ToDoApp provides a **flexible task management application** with features like a **calendar view**, **priority-based task organization**, **progress tracking (Not Started, In Progress, Completed)**, **modular task blocks**, **customizable UI themes**, and a **gamified points system** to help users stay organized, productive, and engaged.

---

## Features and Implementation Requirements

### Feature 1: Dashboard with Modular Task Blocks
**Assigned to:** Member A

**Requirements to Implement:**
- Display all tasks in a **dashboard layout** with modular blocks  
- Each block shows task **title, priority, and status**  
- Ability to **expand/collapse blocks** to show/hide sub-tasks  
- Modular design to allow adding future features (like notes or attachments)

---

### Feature 2: Task Priorities
**Assigned to:** Member B

**Requirements to Implement:**
- Assign tasks **priority** levels: High, Medium, Low  
- Visual indicators (like badges or color coding) for priority  
- Ability to filter or sort tasks by **priority**

---

### Feature 3: Task Status and Progress Tracking
**Assigned to:** Member B

**Requirements to Implement:**
- Assign tasks **status**: Not Started, In Progress, Completed  
- Track progress for multi-part tasks based on sub-tasks completed  
- Update progress dynamically as sub-tasks are completed  
- Allow users to **see a summary of progress** for each task

---

### Feature 4: Calendar View
**Assigned to:** Member B

**Requirements to Implement:**
- Map tasks to a **calendar based on due dates**  
- Display tasks in **monthly/weekly views**  
- Click on calendar task to **view detailed info** (title, description, sub-tasks, priority)  
- Optional: color-code tasks based on **status or priority**

---

### Feature 5: Customizable UI Themes
**Assigned to:** Member A

**Requirements to Implement:**
- Users can switch between **light and dark mode**  
- Option to select **custom colors** for themes  
- Ensure all dashboard and task block elements **update dynamically** with theme changes  
- Keep design modular to allow future customization options

---

### Feature 6: Gamification / Points System
**Assigned to:** Member C

**Requirements to Implement:**
- Track points for **task completion**  
- Award **bonus points** for early completion  
- Display **points and level** on user profile  
- Optional: leaderboards or progress badges for motivation  
- Integrate with task completion workflow to automatically update points

---

## Data Model and Architecture

### System Architecture

┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│         Frontend          │      │        Backend API        │      │         Database          │
│   (React.js / Vue.js)     │      │        (Node.js)          │      │        (MongoDB)          │
│                           │      │                           │      │                           │
│ - Dashboard Display       │─────▶│ - Task Management         │─────▶│ - Users                  │
│ - Modular Task Blocks     │      │ - Task Status & Priority  │      │ - Tasks                   │
│ - Calendar View           │      │ - Points System           │      │ - Points & Levels         │
│ - Gamification UI         │      │ - Theme Management        │      │ - Themes                  │
│                           │      │                           │      │                           │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘


## Tests

### Test Strategy
- **Unit Tests:** Test individual components and functions  
- **Integration Tests:** Test API endpoints and database interaction  
- **Acceptance Tests:** End-to-end verification of user workflows  

### Burndown Metrics

| Metric       | Count |
|--------------|-------|
| Features     | 6     |
| Requirements | 24    |
| Tests        | 18    |

---

## Team Members and Roles

| Member   | Role       | Features Assigned                        |
|----------|------------|-----------------------------------------|
| Member A | Developer  | Dashboard + Modular Blocks, UI Themes   |
| Member B | Developer  | Task Priorities, Task Status, Calendar View |
| Member C | Developer  | Gamification / Points System             |

---

## Links

| Resource | Link |
|----------|------|
| GitHub Repository | [https://github.com/yourusername/taskflow](https://github.com/yourusername/taskflow) |
| Documentation | [docs/](./docs/) |
| Source Code | [src/](./src/) |
| Tests | [tests/](./tests/) |

