// 화면에서 필요한 요소들을 찾아 둡니다.
const input = document.getElementById("todo-input");
const addButton = document.getElementById("add-button");
const list = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");

// 할 일을 하나 추가하는 함수
function addTodo() {
  const text = input.value.trim();
  if (text === "") {
    return; // 빈 칸이면 아무것도 하지 않음
  }

  const item = document.createElement("li");
  item.className = "todo-item";

  // 완료 체크박스
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.addEventListener("change", function () {
    item.classList.toggle("done", checkbox.checked);
  });

  // 할 일 글자 (textContent를 써서 입력한 글자가 그대로 보이게 함)
  const span = document.createElement("span");
  span.className = "todo-text";
  span.textContent = text;

  // 삭제 버튼
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "삭제";
  deleteButton.addEventListener("click", function () {
    item.remove();
    updateEmptyMessage();
  });

  item.append(checkbox, span, deleteButton);
  list.append(item);

  input.value = "";
  input.focus();
  updateEmptyMessage();
}

// 목록이 비어 있으면 안내 문구를 보여 줍니다.
function updateEmptyMessage() {
  emptyMessage.hidden = list.children.length > 0;
}

addButton.addEventListener("click", addTodo);

input.addEventListener("keydown", function (event) {
  if (event.key !== "Enter") {
    return;
  }
  // 한글을 조합하는 중(예: "가"를 만드는 중)에 누른 Enter는 무시합니다.
  // 이걸 안 하면 마지막 글자가 한 번 더 추가되는 문제가 생깁니다.
  if (event.isComposing || event.keyCode === 229) {
    return;
  }
  addTodo();
});

updateEmptyMessage();
