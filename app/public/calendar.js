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

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "day";

    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

    cell.innerHTML = `<strong>${day}</strong>`;

    tasks.forEach(task => {
      if (task.date === dateStr) {
        const t = document.createElement("div");
        t.className = "task";
        t.textContent = "• " + task.title;
        cell.appendChild(t);
      }
    });

    grid.appendChild(cell);
  }

  calendarEl.appendChild(grid);
}

loadTasks();
