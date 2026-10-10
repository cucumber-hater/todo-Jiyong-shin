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

// Supabase에서 가져온 할 일들을 담아 두는 곳
let todos = [];

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
  list.innerHTML = "";
  for (const todo of todos) {
    list.append(createTodoItem(todo));
  }
  emptyMessage.hidden = todos.length > 0;
}

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
