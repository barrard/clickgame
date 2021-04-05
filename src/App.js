import React, { useState, useEffect } from "react";
import {
	Avatar,
	CountDown,
	Board,
	CreateGameBtn,
	JoinGameBtn,
	Alert,
} from "./components";
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
	const [user, setUser] = useState("");
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
			mySocket.on("setUser", (data) => {
				console.log(data);
				setUser(data);
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
		<div
			style={{
				position: "relative",
				overflow: "hidden",
				background: "black",
				color: "white",
				minHeight: "100vh",
			}}
		>
			<div>
				{user && <h3>Hello {user.name}</h3>}
				{!user && <h3>Connecting....</h3>}
			</div>

			{!currentGame && (
				<div>
					<h3>
						Game List - Total games {Object.keys(gameList).length}
					</h3>
					<CreateGameBtn
						onClick={() => mySocket.emit("createGame", user)}
					>
						Create Game
					</CreateGameBtn>
					{Object.keys(gameList)
						.sort((a, b) => gameList[a].state - gameList[b].state)
						.map((gameId, i) => {
							let game = gameList[gameId];
							let gameOver = game.state === 3;
							let gameInProgress = game.state === 2;
							let gameIsStarting = game.state === 1;
							let canJoin = game.state === 0;

							return (
								<div key={gameId}>
									<h4>{`Game #${i + 1} ${gameId}`}</h4>

									{canJoin && (
										<>
											<Alert background="lightblue">
												{`Players Ready:
												${Object.keys(gameList[gameId].players).length}`}
											</Alert>
											<Alert>
												Waiting for more players...
											</Alert>
											<JoinGameBtn
												onClick={() =>
													mySocket.emit(
														"joinGame",
														gameId
													)
												}
											>
												JOIN
											</JoinGameBtn>
										</>
									)}
									{gameIsStarting && (
										<Alert background="lightblue">
											Game Is Starting...
										</Alert>
									)}
									{gameInProgress && (
										<Alert background="lightblue">
											Game In Progress...
										</Alert>
									)}
									{gameOver && (
										<Alert background="tomato">
											{`Game Is Over.  ${game.winner.name} won...`}
										</Alert>
									)}
								</div>
							);
						})}
				</div>
			)}

			{currentGame && (
				<div>
					{currentGame.state === 0 && (
						<Alert>Waiting for more players</Alert>
					)}
					{currentGame.state === 1 && (
						<>
							<Alert background={"lawngreen"}>
								Ready for game to start
							</Alert>
							<CountDown />
						</>
					)}
					{currentGame.state === 2 && <Alert>GO GO GO CLICK!!</Alert>}
					{currentGame.state === 3 && (
						<>
							{currentGame.winner.id === user.id && (
								<>
									<h1>YOU WON!!!</h1>
									<Confetti />
								</>
							)}
							{currentGame.winner.id !== user.id && (
								<>
									<h1>YOU LOST!!!</h1>
								</>
							)}
						</>
					)}

					<div>
						<h4>Player list</h4>
						<div style={{ width: "25%", display: "inline-flex" }}>
							<div>
								{Object.keys(currentGame.players).map(
									(playerId, i) => {
										let player =
											currentGame.players[playerId];

										return (
											<Avatar
												player={player}
												key={player.color}
											/>
										);
									}
								)}
							</div>
						</div>
						<div
							style={{
								display: "inline-flex",

								justifyContent: "center",
								// overflow: "hidden",
								position: "relative",
								width: "50%",
								minWidth: "500px",
								maxWidth: "500px",
							}}
						>
							<Board
								userColor={color}
								selectBox={selectBox}
								game={currentGame}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
