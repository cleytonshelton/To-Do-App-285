const calendarEl = document.getElementById("calendar");

let tasks = [];
const today = new Date();
let year = today.getFullYear();
let month = today.getMonth();

async function loadTasks() {
  const res = await fetch("/listjson");
  tasks = await res.json();
  renderCalendar();
}

function renderCalendar() {
    calendarEl.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // ── Month / Year header ──────────────────────────────────────────────────────
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const header = document.createElement("div");
  header.className = "calendar-header";
  header.innerHTML = `
    <button class="cal-nav" id="prevMonth">&#8592;</button>
    <span class="calendar-title">${monthNames[month]} ${year}</span>
    <button class="cal-nav" id="nextMonth">&#8594;</button>
  `;
  calendarEl.appendChild(header);

  // ── Wire up nav buttons ──────────────────────────────────────────────────────
  header.querySelector("#prevMonth").addEventListener("click", () => {
    month--;
    if (month < 0) { month = 11; year--; }
    renderCalendar();
  });

  header.querySelector("#nextMonth").addEventListener("click", () => {
    month++;
    if (month > 11) { month = 0; year++; }
    renderCalendar();
  });

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  // ── Day of week headers ──────────────────────────────────────────────────────
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayNames.forEach(name => {
    const header = document.createElement("div");
    header.className = "day-header";
    header.textContent = name;
    grid.appendChild(header);
  });

  // ── Empty cells before the 1st ──────────────────────────────────────────────
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    grid.appendChild(empty);
  }

  // ── Day cells ────────────────────────────────────────────────────────────────
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "day";

    // Highlight today
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("today");
    }

    cell.innerHTML = `<strong>${day}</strong>`;

    tasks.forEach(task => {
      const taskDate = new Date(task.date);

      if (
        !isNaN(taskDate) &&
        taskDate.getFullYear() === year &&
        taskDate.getMonth() === month &&
        taskDate.getDate() === day
      ) {
        const t = document.createElement("div");
        
        // 1. Assign classes for status and priority
        const statusClass = (task.status || "Pending").toLowerCase().replace(" ", "-");
        const priorityClass = `prio-${task.priority || 3}`;
        
        t.className = `task status-${statusClass} ${priorityClass}`;
        
        // 2. Add checkmark if complete, otherwise use the dot
        let prefix = "• ";
        if (task.status === "Completed") {
          prefix = "✓ ";
          t.style.textDecoration = "line-through";
          t.style.opacity = "0.7";
        }

        t.textContent = prefix + task.title;
        cell.appendChild(t);
      }
    });

    grid.appendChild(cell);
  }

  calendarEl.appendChild(grid);
}

loadTasks();