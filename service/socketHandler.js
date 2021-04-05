const { v4: uuidv4 } = require("uuid");
const rp = require("request-promise");

const games = {};
const userGames = {};
let socketIo;
const sockets = {};
const socketIds = {};
const waitingRoom = "waiting room";
let colors = ["red", "blue", "green", "yellow"];
const playerLimit = colors.length;
module.exports = (io) => {
	socketIo = io;
	io.on("connection", async (socket) => {
		console.log("CONNECTED");
		socket.join(waitingRoom);
		//create uuid

		let user = await getUser();
		console.log("a user connected assigned as " + user.name);
		sockets[user.id] = socket;
		console.log(socket.id);
		socketIds[socket.id] = user;
		//send the user thier ID
		socket.emit("setUser", user);
		//send them all the games
		socket.emit("gameList", games);

		socket.on("createGame", () => {
			let user = socketIds[socket.id];
			if (!user) return console.log("No user found");
			//make sure they havent already started a game
			if (userGames[user.id]) {
				//already have a game started
				socket.emit("error", {
					msg: `You already have a game at ${userGames[user.id]}`,
				});
			} else {
				//create game id
				let game = createNewGame(user);
				let color = game.players[user.id].color;
				games[game.id] = game;
				console.log({ game, color });
				socket.leave(waitingRoom);
				socket.join(game.id);
				socket.emit("joiningGame", { game, color });
				io.to(waitingRoom).emit("new game", game);
			}
		});

		socket.on("joinGame", (gameId) => {
			//user wants to join this game
			joinGame(socket, gameId);
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
			let user = socketIds[socket.id];
			if (!user) return console.log("No user found");
			let player = game.players[user.id];
			if (!player) return console.log("No user found");
			let color = player.color;
			if (!box.color) {
				box.color = color;
				player.score++;
				game.availableBoxes--;
			}
			io.to(gameId).emit("updateCurrentGame", game);
			if (game.availableBoxes === 0) {
				game.state = 3;
				//get the winner
				let highScore = 0;
				let winner;
				Object.keys(game.players).forEach((userId) => {
					let { score } = game.players[userId];
					if (score > highScore) {
						highScore = score;
						winner = game.players[userId];
					}
				});
				game.winner = winner;
				io.to(gameId).emit("updateCurrentGame", game);
				io.to(waitingRoom).emit("updateGameList", game);
			}
		});

		socket.on("disconnect", () => {
			let userId = socketIds[socket.id];
			console.log(`user ${userId} disconnected`);
		});
	});
};

async function getUser() {
	try {
		let { results } = await rp("https://randomuser.me/api/", {
			json: true,
		});
		results = results[0];

		let { title, first, last } = results.name;
		let name = `${title} ${first} ${last}`;
		let pic = results.picture.medium;
		let id = results.login.uuid;
		return { name, pic, id };
	} catch (err) {
		console.log(err);
		return false;
	}
}

function createNewGame(user) {
	let gameId = uuidv4();
	let color = colors[0];
	let game = {
		id: gameId,
		createdBy: user.id,
		players: { [user.id]: { ...user, score: 0, color } },
		state: 0, //means needs more people
		availableBoxes: 100,
		boxes: [...Array(100).keys()].map((i) => ({
			id: i,
			color: null,
		})),
	};

	return game;
}

function joinGame(socket, gameId) {
	let user = socketIds[socket.id];
	//make sure player limit is not reached
	let game = games[gameId];
	if (!game) {
		socket.emit("error", { msg: "Game does not exist" });
	}
	let playerCount = Object.keys(game.players).length;
	if (playerCount >= playerLimit) {
		socket.emit("error", {
			msg: "This game has reached its player limit",
		});
	} else {
		//set color
		let color = colors[playerCount];

		(game.players[user.id] = { ...user, score: 0, color }),
			//tell the socket to join the game
			socket.emit("joiningGame", { game, color });
		//exit waiting room channel
		socket.leave(waitingRoom);
		//update game list for waiting room
		//tell the game room someone joined.
		socketIo.to(gameId).emit("updateCurrentGame", game);
		//tell socket to join the game channel
		socket.join(gameId);
		//if the player count is hit, start game count down
		if (Object.keys(game.players).length === playerLimit) {
			console.log("the game is ready to start");
			game.state = 1;
			socketIo.to(gameId).emit("updateCurrentGame", game);
			setTimeout(() => {
				game.state = 2;
				socketIo.to(gameId).emit("updateCurrentGame", game);
				socketIo.to(waitingRoom).emit("updateGameList", game);
			}, 5000);
		}
		socketIo.to(waitingRoom).emit("updateGameList", game);
	}
}
