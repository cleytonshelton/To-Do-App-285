const calendarEl = document.getElementById("calendar");
let tasks = [];
const today = new Date();
let year = today.getFullYear();
let month = today.getMonth();

async function loadTasks() {
  try {
    const res = await fetch("/listjson");
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    tasks = await res.json();
    renderCalendar();
  } catch (err) {
    console.error("Failed to load tasks:", err);
  }
}

function renderCalendar() {
  calendarEl.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Header Logic
  const header = document.createElement("div");
  header.className = "calendar-header";
  header.innerHTML = `
        <button class="cal-nav" id="prevMonth"><i class="fas fa-chevron-left"></i></button>
        <span class="calendar-title">${monthNames[month]} ${year}</span>
        <button class="cal-nav" id="nextMonth"><i class="fas fa-chevron-right"></i></button>
      `;
  calendarEl.appendChild(header);

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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayNames.forEach(name => {
    const h = document.createElement("div");
    h.className = "day-header";
    h.textContent = name;
    grid.appendChild(h);
  });

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "day";

    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
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
        const statusClass = (task.status || "Pending").toLowerCase().replace(" ", "-");
        const priorityClass = `prio-${task.priority || 3}`;

        t.className = `task status-${statusClass} ${priorityClass}`;
        let prefix = (task.status === "Completed") ? '<i class="fas fa-check mr-1"></i>' : '<i class="fas fa-circle mr-1" style="font-size: 0.4rem; vertical-align: middle;"></i>';

        t.innerHTML = `${prefix} ${task.title}`;

        // Navigate to detail on click
        t.onclick = () => window.location.href = `/detail/${task._id}`;

        cell.appendChild(t);
      }
    });

    grid.appendChild(cell);
  }
  calendarEl.appendChild(grid);
}

loadTasks();