import React, { useState, useEffect } from "react";
import { CountDown, Board } from "./components";
import Confetti from "react-confetti";

import "./App.css";
import socketIOClient from "socket.io-client";
const ENDPOINT = window.location.origin;

//pull somehing from codepen
//i want a confetti wining animation

//https://loading.io/background/m-confetti
//this one seems to try and make me buy it or something
//but i like it
//buy it?  buy what?
function App() {
	const [mySocket, setMySocket] = useState(null);
	const [userId, setUserId] = useState("");
	const [gameList, setGameList] = useState({});
	const [currentGame, setCurrentGame] = useState(null);
	const [color, setColor] = useState(null);
	const [gameReady, setGameReady] = useState(false);
	const [gameStarted, setGameStarted] = useState(false);

	useEffect(() => {
		const socket = socketIOClient(ENDPOINT, {
			withCredentials: true,
			extraHeaders: {
				"my-custom-header": "abcd",
			},
		});
		setMySocket(socket);
	}, []);

	const selectBox = (id) => {
		if (currentGame.state !== 2) return;
		let box = currentGame.boxes[id];
		if (!box.color) {
			box.color = "pending";
		}
		mySocket.emit("selectBox", { boxId: id, gameId: currentGame.id });
		console.log(currentGame);
		setCurrentGame({ ...currentGame });
	};
	useEffect(() => {
		if (mySocket) {
			mySocket.on("setUserId", (data) => {
				console.log(data);
				setUserId(data);
			});

			mySocket.on("new game", (game) => {
				//user has joined the game and assigned a color
				console.log(gameList);
				gameList[game.id] = game;

				setGameList({ ...gameList });
			});

			mySocket.on("gameList", (games) => {
				//user has joined the game and assigned a color
				console.log("gameList", games);
				setGameList(games);
			});

			mySocket.on("joiningGame", ({ game, color }) => {
				//user has joined the game and assigned a color
				setColor(color);
				setCurrentGame(game);
			});

			mySocket.on("updateGameList", (game) => {
				console.log("updateGameList");
				console.log(game);
				gameList[game.id] = game;

				setGameList({ ...gameList });
			});

			mySocket.on("updateCurrentGame", (game) => {
				setCurrentGame(game);
			});
		}
	});
	return (
		<div style={{ position: "relative", overflow: "hidden" }}>
			<div>
				{userId && <h3>Hello {userId}</h3>}
				{!userId && <h3>Connecting....</h3>}
			</div>

			{!currentGame && (
				<div>
					<h3>
						Game List - Total games {Object.keys(gameList).length}
					</h3>
					<button onClick={() => mySocket.emit("createGame", userId)}>
						Create Game
					</button>
					{Object.keys(gameList).map((gameId, i) => {
						let game = gameList[gameId];
						let gameOver = game.state === 3;
						let gameInProgress = game.state === 2;
						let gameIsStarting = game.state === 1;
						let canJoin = game.state === 0;

						return (
							<div key={gameId}>
								<h4>{`Game #${i + 1} ${gameId}`}</h4>
								<p>Players {gameList[gameId].players.length}</p>
								{canJoin && (
									<button
										onClick={() =>
											mySocket.emit("joinGame", gameId)
										}
									>
										JOIN
									</button>
								)}
								{gameIsStarting && <p>Game Is Starting...</p>}
								{gameInProgress && <p>Game In Progress...</p>}
								{gameOver && (
									<p>{`Game Is Over.  ${game.winner} won...`}</p>
								)}
							</div>
						);
					})}
				</div>
			)}

			{currentGame && (
				<div>
					{currentGame.state === 0 && (
						<h3>Waiting for more players</h3>
					)}
					{currentGame.state === 1 && (
						<>
							<h3>Ready for game to start</h3>
							<CountDown />
						</>
					)}
					{currentGame.state === 2 && <h3>GO GO GO CLICK!!</h3>}
					{currentGame.state === 3 && (
						<>
							{currentGame.winner === userId && (
								<>
									<h1>YOU WON!!!</h1>
									<Confetti />
								</>
							)}
							{currentGame.winner !== userId && (
								<>
									<h1>YOU LOST!!!</h1>
								</>
							)}
						</>
					)}

					<div>
						<h4>Player list</h4>
						<div>
							{currentGame.players.map((playerId, i) => {
								let color = currentGame.colors[i];
								let score = currentGame.scores[i];
								return (
									<div key={color} style={{ color }}>
										<p>
											{playerId} : {score}
										</p>
									</div>
								);
							})}
						</div>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							overflow: "hidden",
							position: "relative",
						}}
					>
						<Board
							userColor={color}
							selectBox={selectBox}
							game={currentGame}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
