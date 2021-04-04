const { v4: uuidv4 } = require("uuid");

const games = {};
const userGames = {};

const sockets = {};
const socketIds = {};
const waitingRoom = "waiting room";
let colors = ["red", "blue", "green", "yellow"];
const playerLimit = colors.length;
module.exports = (io) => {
	io.on("connection", (socket) => {
		console.log("CONNECTED");
		socket.join(waitingRoom);
		//create uuid
		let userId = uuidv4();
		console.log("a user connected assigned as " + userId);
		sockets[userId] = socket;
		console.log(socket.id);
		socketIds[socket.id] = userId;
		//send the user thier ID
		socket.emit("setUserId", userId);
		//send them all the games
		socket.emit("gameList", games);

		socket.on("createGame", () => {
			let userId = socketIds[socket.id];
			//make sure they havent already started a game
			if (userGames[userId]) {
				//already have a game started
				socket.emit("error", {
					msg: `You already have a game at ${userGames[userId]}`,
				});
			} else {
				//create game id
				let gameId = uuidv4();
				let game = {
					id: gameId,
					createdBy: userId,
					players: [userId],
					scores: [0],
					state: 0, //means needs more people
					colors,
					availableBoxes: 100,
					boxes: [...Array(100).keys()].map((i) => ({
						id: i,
						color: null,
					})),
				};
				games[gameId] = game;
				let color = colors[game.players.length - 1];
				console.log({ game, color });
				socket.leave(waitingRoom);
				socket.join(gameId);
				socket.emit("joiningGame", { game, color });
				io.to(waitingRoom).emit("new game", game);
			}
		});

		socket.on("joinGame", (gameId) => {
			//user wants to join this game
			let userId = socketIds[socket.id];
			//make sure player limit is not reached
			let game = games[gameId];
			if (!game) {
				socket.emit("error", { msg: "Game does not exist" });
			}
			let players = game.players.length;
			if (players >= playerLimit) {
				socket.emit("error", {
					msg: "This game has reached its player limit",
				});
			} else {
				game.players.push(userId);
				game.scores.push(0);
				//set color
				let color = colors[game.players.length - 1];
				//tell the socket to join the game
				socket.emit("joiningGame", { game, color });
				//exit waiting room channel
				socket.leave(waitingRoom);
				//update game list for waiting room
				io.to(waitingRoom).emit("updateGameList", game);
				//tell the game room someone joined.
				io.to(gameId).emit("updateCurrentGame", game);
				//tell socket to join the game channel
				socket.join(gameId);
				//if the player count is hit, start game count down
				if (game.players.length === playerLimit) {
					console.log("the game is ready to start");
					game.state = 1;
					io.to(gameId).emit("updateCurrentGame", game);
					setTimeout(() => {
						game.state = 2;
						io.to(gameId).emit("updateCurrentGame", game);
					}, 5000);
				}
			}
		});

		socket.on("selectBox", ({ boxId, gameId }) => {
			let game = games[gameId];
			if (!game) {
				socket.emit("error", {
					msg: `Game doesn't exist`,
				});
				return socket.emit("updateCurrentGame", null);
			}
			let box = game.boxes[boxId];
			let userId = socketIds[socket.id];
			let index = game.players.indexOf(userId);
			let color = colors[index];
			if (!box.color) {
				box.color = color;
				game.scores[index]++;
				game.availableBoxes--;
			}
			io.to(gameId).emit("updateCurrentGame", game);
			if (game.availableBoxes === 0) {
				game.state = 3;
				//get the winner
				let winnerIndex = game.scores.indexOf(Math.max(...game.scores));
				game.winner = game.players[winnerIndex];
				io.to(gameId).emit("updateCurrentGame", game);
			}
		});

		socket.on("disconnect", () => {
			let userId = socketIds[socket.id];
			console.log(`user ${userId} disconnected`);
		});
	});
};
