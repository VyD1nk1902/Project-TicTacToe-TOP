// Factory function cho từng ô cờ (Cell)
function Cell() {
  let value = "";
  const addMark = (mark) => {
    if (value === "") value = mark; // value p rỗng thì mới cho mark
  };
  const getValue = () => value;
  return { addMark, getValue };
}

// Factory function cho người chơi
function Player(name, mark) {
  return { name, mark };
}

// Module quản lý bàn cờ (3x3)
const Gameboard = (function () {
  const size = 3; //Size bàn cờ
  const board = []; //ma trận 3x3
  for (let i = 0; i < size; i++) {
    board[i] = [];
    for (let j = 0; j < size; j++) {
      board[i][j] = Cell();
    }
  }
  // Trả về toàn bộ ma trận Cell
  const getBoard = () => board;
  // Đánh dấu X/O lên ô
  const addMark = (row, col, mark) => board[row][col].addMark(mark);
  // In ra console (debug)
  const printBoard = () => {
    const boardValues = board.map((row) => row.map((cell) => cell.getValue()));
    console.log(boardValues);
  };
  // Reset value từng cell
  const resetBoard = () => {
    for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) board[i][j] = Cell();
  };
  return { getBoard, addMark, printBoard, resetBoard };
})();

// Module điều khiển luật game, flow game
const GameController = (function () {
  let players = [Player("Player 1", "X"), Player("Player 2", "O")];
  let activePlayer = players[0];
  let isGameOver = false;

  const isOver = () => isGameOver;

  const setPlayers = (name1, name2) => {
    players = [Player(name1, "X"), Player(name2, "O")];
    activePlayer = players[0];
    isGameOver = false;
  };
  const getActivePlayer = () => activePlayer;
  const getPlayers = () => players;

  // Kiểm tra thắng
  const isWin = () => {
    const grid = Gameboard.getBoard().map((row) => row.map((cell) => cell.getValue()));
    for (let i = 0; i < 3; i++) {
      if (grid[i][0] && grid[i][0] === grid[i][1] && grid[i][1] === grid[i][2]) return true; // row //grid[i][0] && grid[i][0] kiểm tra truthy (hàng 1 = hàng 2 = hàng 3)
      if (grid[0][i] && grid[0][i] === grid[1][i] && grid[1][i] === grid[2][i]) return true; // col
    }
    if (grid[0][0] && grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) return true;
    if (grid[0][2] && grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0]) return true;
    return false;
  };
  // Kiểm tra hòa
  const checkTie = () => {
    const grid = Gameboard.getBoard() //lấy mảng 2d
      .flat() //chuyển mảng thành hàng ngang "","","",...
      .map((cell) => cell.getValue()); //lọc giá trị trong từng cell
    return grid.every((value) => value !== ""); //đảm bảo value của cell ko rỗng
  };
  // Xử lý 1 lượt chơi
  const playRound = (row, col) => {
    if (isGameOver) return { over: true };
    const cell = Gameboard.getBoard()[row][col];
    if (cell.getValue() !== "") return { taken: true };
    Gameboard.addMark(row, col, activePlayer.mark);
    if (isWin()) {
      isGameOver = true;
      return { win: true, player: activePlayer };
    }
    if (checkTie()) {
      isGameOver = true;
      return { tie: true };
    }
    // Chuyển lượt
    activePlayer = activePlayer === players[0] ? players[1] : players[0]; // gán giá trị ng chơi lượt mới cho activePlayer
    return { next: true, player: activePlayer };
  };
  // Reset game
  const restart = () => {
    Gameboard.resetBoard();
    activePlayer = players[0];
    isGameOver = false;
  };

  return { playRound, getActivePlayer, getPlayers, restart, setPlayers, isGameOver: isOver };
})();

// Module điều khiển giao diện
const DisplayController = (function () {
  const boardElem = document.querySelector(".game-board");
  const messageElem = document.querySelector(".message");
  const restartBtn = document.querySelector(".res");
  const startBtn = document.querySelector(".start");
  const playerInput = document.querySelector(".player-inputs");

  // Render giao diện bàn cờ dựa trên Gameboard
  function render() {
    boardElem.innerHTML = ""; // clear cũ
    const board = Gameboard.getBoard();
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const cellElem = document.createElement("div");
        cellElem.classList.add("cell");
        cellElem.textContent = board[i][j].getValue(); // "X" or "O"
        cellElem.dataset.row = i;
        cellElem.dataset.col = j;
        // Gắn sự kiện click vào từng ô
        cellElem.addEventListener("click", () => {
          const result = GameController.playRound(i, j);
          render(); // cập nhật lại giao diện
          // Xử lý thông báo/thắng/thua
          if (result && result.taken) showMessage("The cell has been marked!");
          else if (result && result.win) {
            showMessage(`${result.player.name} (${result.player.mark}) Win!`);
            restartBtn.style.display = "inline-block";
          } else if (result && result.tie) {
            showMessage("Tie!");
            restartBtn.style.display = "inline-block";
          } else if (!GameController.isGameOver()) {
            showMessage(`${GameController.getActivePlayer().name} (${GameController.getActivePlayer().mark}) turn!`);
          } else if (result && result.over) {
            showMessage("Game Over! Press restart to replay!");
            return;
          }
        });
        boardElem.appendChild(cellElem);
      }
  }
  function showMessage(msg) {
    messageElem.textContent = msg;
  }

  restartBtn.addEventListener("click", () => {
    GameController.restart();
    render();
    showMessage(`${GameController.getActivePlayer().name} (${GameController.getActivePlayer().mark}) start!`);
    restartBtn.style.display = "none";
    playerInput.style.display = "flex";
  });

  startBtn.addEventListener("click", () => {
    const name1 = document.querySelector(".player-1").value || "Player 1";
    const name2 = document.querySelector(".player-2").value || "Player 2";
    GameController.setPlayers(name1, name2);
    GameController.restart();
    render();
    showMessage(`${name1} (X) First Move!`);
    restartBtn.style.display = "none";
    playerInput.style.display = "none";
  });
  // Hiện bàn cờ rỗng khi load trang
  //   render();
  showMessage("Input name then press Play to start game!");
})();
