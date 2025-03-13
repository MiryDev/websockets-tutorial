import { createBoard, playMove } from "./connect4.js";

const websocket = new WebSocket(getWebSocketServer());

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
        const joinLink = document.querySelector(".join");
        const watchLink = document.querySelector(".watch");

        joinLink.href = "?join=" + event.join;
        watchLink.href = "?watch=" + event.watch;

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


function getWebSocketServer() {
  if (window.location.host === "mirydev.github.io") {
    return "wss://spare-adel-forza-4-project-e1e8058d.koyeb.app/";
  } else if (window.location.host === "localhost:8000") {
    return "ws://localhost:8001/";
  } else {
    throw new Error(`Unsupported host: ${window.location.host}`);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const board = document.querySelector(".board");
  createBoard(board);
  initGame(websocket);
  receiveMoves(board, websocket);
  sendMoves(board, websocket);
});

////////////////////////////////////////////////////////////////


function createWebSocket() {
  websocket = new WebSocket(getWebSocketServer());

  websocket.addEventListener("open", () => {
    console.log("WebSocket connection established.");
    // Inizializza il gioco come prima
    initGame(websocket);
  });

  websocket.addEventListener("close", () => {
    console.log("WebSocket connection closed.");
    // Riprova a connetterti dopo un certo intervallo
    setTimeout(createWebSocket, 1000); // Riprova dopo 1 secondo
  });

  websocket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
    websocket.close();
  });

  websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    console.log("Received event:", event);
    handleEvent(event);
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
    
    // Controlla lo stato della connessione prima di inviare
    if (websocket.readyState === WebSocket.OPEN) {
      console.log('Sending play event:', event);
      websocket.send(JSON.stringify(event));
    } else {
      console.error("WebSocket is not open. Current state:", websocket.readyState);
    }
  });
}
