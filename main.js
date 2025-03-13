import { createBoard, playMove } from "./connect4.js";

function getWebSocketServer() {
  if (window.location.host === "mirydev.github.io") {
    return "wss://spare-adel-forza-4-project-e1e8058d.koyeb.app/";
  } else if (window.location.host === "localhost:8000") {
    return "ws://localhost:8001/";
  } else {
    throw new Error(`Unsupported host: ${window.location.host}`);
  }
}

function initGame(websocket) {
  websocket.addEventListener("open", () => {
    const params = new URLSearchParams(window.location.search);
    let event = { type: "init" };
    if (params.has("join")) {
      event.join = params.get("join");
      console.log("Trying to join with key:", event.join);
    } else if (params.has("watch")) {
      event.watch = params.get("watch");
      console.log("Trying to watch with key:", event.watch); 
    } else {
    }
    websocket.send(JSON.stringify(event));
  });
}

function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}

function receiveMoves(board, websocket) {
  websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    console.log("Received event:", event);  // Debug
    switch (event.type) {
      case "init":
        document.querySelector(".join").href = "?join=" + event.join;
        document.querySelector(".watch").href = "?watch=" + event.watch;

        console.log("Updated Join URL:", joinLink.href); // DEBUG
        console.log("Updated Watch URL:", watchLink.href); // DEBUG
        break;
      case "play":
        playMove(board, event.player, event.column, event.row);
        break;
      case "win":
        showMessage(`Player ${event.player} wins!`);
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
  const params = new URLSearchParams(window.location.search);
  if (params.has("watch")) {
    return;
  }
  
  board.addEventListener("click", ({ target }) => {
    const column = target.dataset.column;
    if (column === undefined) {
      return;
    }
    const event = {
      type: "play",
      column: parseInt(column, 10),
    };    
    console.log('Sending play event:', event);    
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(event));
    } else {
      console.error("WebSocket is not open. Current state:", websocket.readyState);
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const board = document.querySelector(".board");
  createBoard(board);
  const websocket = new WebSocket(getWebSocketServer());
  initGame(websocket);
  receiveMoves(board, websocket);
  sendMoves(board, websocket);
});