import { createBoard, playMove } from "./connect4.js";
const websocket = new WebSocket(getWebSocketServer());


function initGame(websocket) {
  websocket.addEventListener("open", () => {
    // Send an "init" event according to who is connecting.
    const params = new URLSearchParams(window.location.search);
    let event = { type: "init" };
    if (params.has("join")) {
      // Second player joins an existing game.
      event.join = params.get("join");
      console.log("Trying to join with key:", event.join); // DEBUG
    } else if (params.has("watch")) {
      // Spectator watches an existing game.
      event.watch = params.get("watch");
      console.log("Trying to watch with key:", event.watch);  // debug
    } else {
      // First player starts a new game.
    }
    websocket.send(JSON.stringify(event));
  });
}


function getWebSocketServer() {
  if (window.location.host === "mirydev.github.io") {
    return "wss://spare-adel-forza-4-project-e1e8058d.koyeb.app/"; // Utilizza il server su Koyeb
  } else if (window.location.host === "localhost:8000") {
    return "ws://localhost:8001/";  // Local server for testing
  } else {
    throw new Error(`Unsupported host: ${window.location.host}`);
  }
}


function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}

function receiveMoves(board, websocket) {
  websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    switch (event.type) {
      case "init":
        const joinLink = document.querySelector(".join");
        const watchLink = document.querySelector(".watch");

        // Assicurati che i link vengano aggiornati con le ultime chiavi ricevute
        joinLink.href = "?join=" + event.join;
        watchLink.href = "?watch=" + event.watch;

        console.log("Updated Join URL:", joinLink.href); // DEBUG
        console.log("Updated Watch URL:", watchLink.href); // DEBUG
      break;


      case "play":
        // Update the UI with the move.
        playMove(board, event.player, event.column, event.row);
        break;
      case "win":
        showMessage(`Player ${event.player} wins!`);
        // No further messages are expected; close the WebSocket connection.
        websocket.close(1000);
        break;
      case "error":
        showMessage(event.message);
        break;
      default:
        throw new Error(`Unsupported event type: ${event.type}.`);
    }
  });
}

function sendMoves(board, websocket) {
  // Don't send moves for a spectator watching a game.
  const params = new URLSearchParams(window.location.search);
  if (params.has("watch")) {
    return;
  }

  // When clicking a column, send a "play" event for a move in that column.
  board.addEventListener("click", ({ target }) => {
    const column = target.dataset.column;
    // Ignore clicks outside a column.
    if (column === undefined) {
      return;
    }
    const event = {
      type: "play",
      column: parseInt(column, 10),
    };
    websocket.send(JSON.stringify(event));
  });
}

window.addEventListener("DOMContentLoaded", () => {
  // Initialize the UI.
  const board = document.querySelector(".board");
  createBoard(board);
  // Open the WebSocket connection and register event handlers.
  const websocket = new WebSocket("ws://localhost:8001/");
  initGame(websocket);
  receiveMoves(board, websocket);
  sendMoves(board, websocket);
});