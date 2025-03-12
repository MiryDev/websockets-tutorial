import asyncio
import json
import secrets

import http
import os
import signal

from websockets.asyncio.server import broadcast, serve

from connect4 import PLAYER1, PLAYER2, Connect4


JOIN = {}

WATCH = {}


async def error(websocket, message):
    event = {
        "type": "error",
        "message": message,
    }
    await websocket.send(json.dumps(event))


async def replay(websocket, game):
    for player, column, row in game.moves.copy():
        event = {
            "type": "play",
            "player": player,
            "column": column,
            "row": row,
        }
        await websocket.send(json.dumps(event))


async def play(websocket, game, player, connected):
    async for message in websocket:
        event = json.loads(message)
        assert event["type"] == "play"
        column = event["column"]

        try:
            row = game.play(player, column)
        except ValueError as exc:
            await error(websocket, str(exc))
            continue

        event = {
            "type": "play",
            "player": player,
            "column": column,
            "row": row,
        }
        broadcast(connected, json.dumps(event))

        if game.winner is not None:
            event = {
                "type": "win",
                "player": game.winner,
            }
            broadcast(connected, json.dumps(event))


async def start(websocket):
    game = Connect4()
    connected = {websocket}

    join_key = secrets.token_urlsafe(12)
    watch_key = secrets.token_urlsafe(12)

    JOIN[join_key] = (game, connected)
    WATCH[watch_key] = (game, connected)

    try:
        event = {
            "type": "init",
            "join": join_key,
            "watch": watch_key,
        }
        await websocket.send(json.dumps(event))
        await play(websocket, game, PLAYER1, connected)
    finally:
        connected.remove(websocket)
        if not connected:
            del JOIN[join_key]
            del WATCH[watch_key]
            print(f"Game {join_key} removed because no connection is active.")



async def join(websocket, join_key):
    
    print(f"Trying to join game with key: {join_key}")  # DEBUG
    print(f"Available JOIN keys: {list(JOIN.keys())}")  # DEBUG


    try:
        game, connected = JOIN[join_key]
    except KeyError:
        print(f"Game {join_key} not found!")  # DEBUG
        await error(websocket, "Game not found.")
        return

    connected.add(websocket)
    try:
        await replay(websocket, game)
        await play(websocket, game, PLAYER2, connected)
    finally:
        connected.remove(websocket)


async def watch(websocket, watch_key):
    try:
        game, connected = WATCH[watch_key]
    except KeyError:
        await error(websocket, "Game not found.")
        return
    
    connected.add(websocket)
    try:
        await replay(websocket, game)
        await websocket.wait_closed()
    finally:
        connected.remove(websocket)


async def handler(websocket):
    message = await websocket.recv()
    event = json.loads(message)
    assert event["type"] == "init"

    if "join" in event:
        await join(websocket, event["join"])
    elif "watch" in event:
        await watch(websocket, event["watch"])
    else:
        await start(websocket)


def health_check(connection, request):
    if request.path == "/healthz":
        return connection.respond(http.HTTPStatus.OK, "OK\n")


async def main():
    port = int(os.environ.get("PORT", "8001"))
    async with serve(handler, "", port, process_request=health_check) as server:
        loop = asyncio.get_running_loop()
        loop.add_signal_handler(signal.SIGTERM, server.close)
        await server.wait_closed()


if __name__ == "__main__":
    asyncio.run(main())