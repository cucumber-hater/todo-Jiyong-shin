// Supabase에 연결합니다. (주소와 열쇠는 config.js에 있어요)
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 화면에서 필요한 요소들을 찾아 둡니다.
const input = document.getElementById("todo-input");
const authorInput = document.getElementById("author-input");
const dueInput = document.getElementById("due-input");
const addButton = document.getElementById("add-button");
const list = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");
const errorMessage = document.getElementById("error-message");
const remainingCount = document.getElementById("remaining-count");
const filterButtons = document.querySelectorAll(".filter-button");

// Supabase에서 가져온 할 일들을 담아 두는 곳
let todos = [];

// 지금 고른 보기: "all"(전체), "active"(진행 중), "done"(완료)
let currentFilter = "all";

// 오류를 화면에 보여 줍니다. (빈 값을 주면 오류 칸을 숨겨요)
function showError(message) {
  errorMessage.textContent = message || "";
  errorMessage.hidden = !message;
}

// Supabase에서 할 일 목록을 가져옵니다.
// 정렬: 마감일이 가까운 순 → (마감일이 없거나 같으면) 먼저 만든 순
async function loadTodos() {
  const { data, error } = await db
    .from("todos")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    showError("할 일을 불러오지 못했어요: " + error.message);
    return;
  }
  showError("");
  todos = data;
  render();
}

// todos 배열을 보고 화면의 목록을 다시 그립니다.
function render() {
  // 고른 보기에 맞는 할 일만 골라냅니다. (Supabase에 다시 묻지 않고 화면에서 고름)
  const visibleTodos = todos.filter(function (todo) {
    if (currentFilter === "active") return !todo.done;
    if (currentFilter === "done") return todo.done;
    return true;
  });

  list.innerHTML = "";
  for (const todo of visibleTodos) {
    list.append(createTodoItem(todo));
  }

  // 목록이 비었을 때 안내 문구
  if (todos.length === 0) {
    emptyMessage.textContent = "아직 할 일이 없어요.";
  } else {
    emptyMessage.textContent = "여기에 보여 줄 할 일이 없어요.";
  }
  emptyMessage.hidden = visibleTodos.length > 0;

  // 남은(완료하지 않은) 할 일 개수
  const remaining = todos.filter(function (todo) {
    return !todo.done;
  }).length;
  remainingCount.textContent = "남은 할 일 " + remaining + "개";

  // 고른 필터 버튼에 표시를 해 둡니다. (CSS가 색으로 구분해 줘요)
  filterButtons.forEach(function (button) {
    const selected = button.dataset.filter === currentFilter;
    button.setAttribute("aria-pressed", String(selected));
  });
}

// 필터 버튼을 누르면 보기를 바꿉니다.
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;
    render();
  });
});

// 할 일 하나를 화면에 보여 줄 <li>를 만듭니다.
function createTodoItem(todo) {
  const item = document.createElement("li");
  item.className = "todo-item";
  item.classList.toggle("done", todo.done);

  // 완료 체크박스
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.addEventListener("change", function () {
    toggleTodo(todo, checkbox.checked);
  });

  // 할 일 글자 (textContent를 써서 입력한 글자가 그대로 보이게 함)
  const span = document.createElement("span");
  span.className = "todo-text";
  span.textContent = todo.title;
  span.title = "더블클릭하면 고칠 수 있어요";
  span.addEventListener("dblclick", function () {
    startEdit(todo, span);
  });

  // 글자 아래에 작성자, 마감일 같은 작은 정보를 보여 줍니다.
  const body = document.createElement("div");
  body.className = "todo-body";
  body.append(span);

  const metaParts = [];
  if (todo.author) {
    metaParts.push("작성자: " + todo.author);
  }
  if (todo.due_date) {
    metaParts.push("마감: " + todo.due_date);
  }
  if (metaParts.length > 0) {
    const meta = document.createElement("div");
    meta.className = "todo-meta";
    meta.textContent = metaParts.join(" · ");
    body.append(meta);
  }

  // 삭제 버튼
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "삭제";
  deleteButton.addEventListener("click", function () {
    deleteTodo(todo);
  });

  item.append(checkbox, body, deleteButton);
  return item;
}

// 할 일 글자를 입력칸으로 바꿔서 고칠 수 있게 합니다.
function startEdit(todo, span) {
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "edit-input";
  editInput.value = todo.title;

  span.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  let finished = false; // 저장/취소가 두 번 실행되지 않게 막는 표시

  function finish(save) {
    if (finished) {
      return;
    }
    finished = true;

    const newTitle = editInput.value.trim();
    // 취소했거나, 빈칸이거나, 바뀐 게 없으면 원래 글자로 되돌립니다.
    if (!save || newTitle === "" || newTitle === todo.title) {
      editInput.replaceWith(span);
      return;
    }
    updateTitle(todo, newTitle);
  }

  editInput.addEventListener("keydown", function (event) {
    // 한글 조합 중에 누른 Enter/Esc는 무시합니다. (글자 조합을 끝내는 키라서)
    if (event.isComposing || event.keyCode === 229) {
      return;
    }
    if (event.key === "Enter") {
      finish(true); // Enter = 저장
    } else if (event.key === "Escape") {
      finish(false); // Esc = 취소
    }
  });

  // 다른 곳을 클릭해서 입력칸을 벗어나도 저장합니다.
  editInput.addEventListener("blur", function () {
    finish(true);
  });
}

// 고친 할 일 글자를 저장합니다.
async function updateTitle(todo, title) {
  const { error } = await db.from("todos").update({ title: title }).eq("id", todo.id);
  if (error) {
    showError("할 일을 고치지 못했어요: " + error.message);
    render(); // 원래 글자로 되돌림
    return;
  }
  await loadTodos();
}

// 할 일을 하나 추가합니다.
async function addTodo() {
  const title = input.value.trim();
  if (title === "") {
    return; // 빈 칸이면 아무것도 하지 않음
  }

  // 작성자는 비워도 돼요. 비어 있으면 null(값 없음)로 저장합니다.
  const author = authorInput.value.trim() || null;
  // 마감일도 비워도 돼요. (날짜 칸 값은 "2026-10-31" 같은 모양)
  const dueDate = dueInput.value || null;

  const { error } = await db
    .from("todos")
    .insert({ title: title, author: author, due_date: dueDate });
  if (error) {
    showError("할 일을 추가하지 못했어요: " + error.message);
    return;
  }

  // 할 일과 마감일 칸은 비웁니다. 작성자 이름은 다음에도 쓰도록 그대로 둬요.
  input.value = "";
  dueInput.value = "";
  input.focus();
  await loadTodos();
}

// 완료 여부를 바꿉니다.
async function toggleTodo(todo, done) {
  const { error } = await db.from("todos").update({ done: done }).eq("id", todo.id);
  if (error) {
    showError("완료 표시를 바꾸지 못했어요: " + error.message);
    render(); // 체크박스를 원래 상태로 되돌림
    return;
  }
  await loadTodos();
}

// 할 일을 지웁니다.
async function deleteTodo(todo) {
  const { error } = await db.from("todos").delete().eq("id", todo.id);
  if (error) {
    showError("할 일을 지우지 못했어요: " + error.message);
    return;
  }
  await loadTodos();
}

addButton.addEventListener("click", addTodo);

// 입력칸에서 Enter를 누르면 추가합니다.
function addOnEnter(event) {
  if (event.key !== "Enter") {
    return;
  }
  // 한글을 조합하는 중(예: "가"를 만드는 중)에 누른 Enter는 무시합니다.
  // 이걸 안 하면 마지막 글자가 한 번 더 추가되는 문제가 생깁니다.
  if (event.isComposing || event.keyCode === 229) {
    return;
  }
  addTodo();
}

input.addEventListener("keydown", addOnEnter);
authorInput.addEventListener("keydown", addOnEnter);

loadTodos();
