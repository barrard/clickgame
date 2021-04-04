const rp = require("request-promise");
require("dotenv");
const Alpaca = require("@alpacahq/alpaca-trade-api");

const time = require("./time.js");
console.log(`Is paper set to ${process.env.IS_PAPER}`);

const alpaca = new Alpaca({
	keyId: process.env.API_KEY,
	secretKey: process.env.SECRET_KEY,
	paper: process.env.IS_PAPER === "true",
});

module.exports = {
	cancelAllOrders,
	cancelOrder,
	closeAllPositions,
	createStop,
	getAccount,
	getAccountActivities,
	getAccountConfigurations,
	getAssets,
	getOrder,
	getOrders,
	getOpenOrders,
	getPortfolioHistory,
	// getPosition,//TODO if needed
	getPositions,
	getQuote,
	lastTrade,
	limitBuy,
	limitSell,
	marketBuy,
	marketSell,
	updateAccountConfigurations,
};

async function cancelOrder(id) {
	try {
		console.log("canceling Order");
		let canceledOrder = await alpaca.cancelOrder(id);
		//TODO add some possible error handling
		return canceledOrder;
	} catch (err) {
		return { err: err.error.message };
	}
}

async function cancelAllOrders(symbol) {
	try {
		var canceledOrders;
		if (symbol) {
			//get open orders and filter with the symbol
			let openOrders = await getOpenOrders(symbol);
			canceledOrders = await promise.all(
				openOrders.map(async (order) => await cancelOrder(order.id))
			);
		} else {
			console.log("Canceling ALL orders");
			canceledOrders = await alpaca.cancelAllOrders();
		}

		console.log(
			`${canceledOrders.length} order${
				canceledOrders.length > 1 ? "s" : ""
			} canceled`
		);
		return canceledOrders;
	} catch (err) {
		console.log({ err: err.message });
	}
}

//todo how to use this
async function lastTrade(ticker) {
	try {
		let { status, last } = await alpaca.lastTrade(ticker);

		if (status !== "success") {
			return "Error";
			//Throw?
		}
		let {
			price,
			size,
			exchange,
			cond1,
			cond2,
			cond3,
			cond4,
			timestamp,
		} = last;
		timestamp = timestamp / 1000000;

		console.log(new Date(timestamp).toLocaleString());
	} catch (err) {
		console.log({ err: err.message });
	}
}

async function getQuote(ticker) {
	try {
		let { status, last } = await alpaca.lastQuote(ticker);
		if (status !== "success") {
			console.log(`Error getting quote for ${ticker}`);
			return "Error";
			//Throw?
		}
		let {
			askprice,
			asksize,
			askexchange,
			bidprice,
			bidsize,
			bidexchange,
			timestamp,
		} = last;
		timestamp = timestamp / 1000000;
		let dateTime = new Date(timestamp).toLocaleString("en-US", {
			timeZone: "America/New_York",
		});
		last.ticker = ticker;
		last.time = time.timeEST();
		console.log(last);
		return {
			askprice,
			asksize,
			askexchange,
			bidprice,
			bidsize,
			bidexchange,
			timestamp,
			dateTime,
		};
	} catch (err) {
		console.log({ err: err.message });
	}
}
async function getPortfolioHistory() {
	try {
		let resp = await alpaca.getPortfolioHistory({
			// date_start: "2020-12-12", //"date_start", //Date,
			// date_end: "date_end", //Date,
			// period: "period", //'1M' | '3M' | '6M' | '1A' | 'all' | 'intraday',
			// timeframe: "timeframe", //'1Min' | '5Min' | '15Min' | '1H' | '1D',
			// extended_hours: "true", //"extended_hours", //Boolean
		});

		return resp;
	} catch (err) {
		console.log({ err: err.message });
	}
}
async function getAccountActivities() {
	try {
		let resp = await alpaca.getAccountActivities({
			activityTypes: ["FILL"], //string | string[], // Any valid activity type
			// until: "until", //Date,
			// after: "after", //Date,
			// direction: "direction", //string,
			// date: "date", //Date,
			// pageSize: "pageSize", //number,
			// pageToken: "pageToken", //string
		});
		// console.log(resp);
		return resp;
	} catch (err) {
		console.log({ err: err.message });
	}
}

async function getOrders(opts) {
	try {
		if (!opts) return;
		let {
			status, // 'open' | 'closed' | 'all',
			after, // Date,
			until, // Date,
			limit, // number, required?
			direction, // 'asc' | 'desc' required?
		} = opts;
		let orders = await alpaca.getOrders(opts);
		logOrders(orders);
		return orders;
	} catch (err) {
		console.log({ err: err.message });
	}
}

async function getOrder(id) {
	try {
		let order = await alpaca.getOrder(id);
		return order;
	} catch (err) {
		console.log({ err: err.message });
	}
}

async function getOpenOrders(symbol, side, type) {
	try {
		let status = "open"; // | 'closed' | 'all',
		let openOrders = await alpaca.getOrders({ status });
		if (symbol)
			openOrders = openOrders.filter((order) => order.symbol === symbol);
		if (side)
			openOrders = openOrders.filter((order) => order.side === side);
		if (type)
			openOrders = openOrders.filter((order) => order.type === type);
		// logOrders(openOrders);

		return openOrders;
	} catch (err) {
		console.log({ err: err.message });
	}
}
// get_account()
async function getAccount() {
	try {
		let account = await alpaca.getAccount();
		// console.log("Current Account:", account);
		return account;
	} catch (err) {
		console.log({ err: err.message });
	}
}
//market Buy
function marketBuy(orderData) {
	try {
		let { ticker, amount, price } = orderData;
		console.log({ ticker, amount, price, buySell });
	} catch (err) {
		console.log({ err: err.message });
	}
}

// Limit Buy
async function limitBuy({ ticker, qty, close }) {
	try {
		// let stop_price = close - close * 0.02;
		close = parseFloat(close);
		let order = await createOrder({
			ticker,
			side: "buy",
			limit_price: close,
			qty: qty,
			type: "limit",
			// stop_price,
		});
		if (order.err) {
			console.log(order.err);
			console.log(`Order to buy ${qty} shares of ${ticker} failed`);
			return;
		}

		return order;
	} catch (err) {
		console.log({ err: err.message });
	}
}

//limit sell
async function limitSell({ ticker, qty, close }) {
	try {
		// let stop_price = close + close * 0.02;
		close = parseFloat(close);
		let order = await createOrder({
			ticker,
			side: "sell",
			limit_price: close,
			qty: qty,
			type: "limit",
			// stop_price,
		});

		if (order.err) {
			console.log(order.err);
			console.log(`Order to sell ${qty} shares of ${ticker} failed`);
		}

		return order;
	} catch (err) {
		console.log({ err: err.message });
	}
}

async function createStop({ ticker, side, stop_price, qty }) {
	try {
		let limit_price = stop_price;
		let stop_order = await createOrder({
			ticker,
			side,
			type: "stop",
			stop_price,
			// limit_price,
			qty,
		});
		if (stop_order.err) {
			console.log(stop_order.err);
			console.log(
				`Stop Order to ${side} ${qty} shares of ${ticker} failed`
			);
		}
		console.log(`Stop order ${stop_order.symbol} was ${stop_order.status}`);
		return stop_order;
	} catch (err) {
		console.log({ err: err.message });
	}
}

//limit sell
function marketSell(orderData) {
	try {
		let { ticker, amount, price } = orderData;
		console.log({ ticker, amount, price, buySell });
	} catch (err) {
		console.log({ err: err.message });
	}
}

async function createOrder(data) {
	try {
		let details = {
			symbol: data.ticker, //string, // any valid ticker symbol
			qty: data.qty, //number,
			side: data.side, //'buy' | 'sell',
			type: data.type, //number'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop',
			//TODO: review time in force
			time_in_force: "day", //'day' | 'gtc' | 'opg' | 'ioc',

			limit_price: data.limit_price, //number, // optional,
			stop_price: data.stop_price, //number, // optional,
			// client_order_id: data.client_order_id, //string, // optional,
			extended_hours: time.isMorning() || time.isEvening(), //boolean, // optional,
			// order_class: data.order_class, //string, // optional,
			// take_profit: data.take_profit, //object, // optional,
			// stop_loss: data.stop_loss, //object, // optional,
			// trail_price: data.trail_price, //string, // optional,
			// trail_percent: data.trail_percent, //string // optional,
		};
		if (details.extended_hours && details.type !== "limit") {
			console.log("THIS ORDER WILL FAIL");
		}
		console.log(details);

		let order = await alpaca.createOrder(details);
		return order;
	} catch (err) {
		console.log("Error creating order");
		// console.log(JSON.stringify(err, undefined, 2));
		handleAlpacaErrors(err);
		let msg = err.error.message;
		return { err: msg };
	}
}

async function getPositions(symbol, side) {
	try {
		let positions;
		if (!symbol) {
			positions = await alpaca.getPositions();
		} else {
			positions = await alpaca.getPosition(symbol);
			positions = [positions];
		}
		if (side) {
			positions = positions.filter((position) => position.side === side);
		}
		return positions;
	} catch (err) {
		if (
			err.message.includes(
				'404 - {"code":40410000,"message":"position does not exist"}'
			)
		) {
			return [];
		} else {
			console.log({ err: err.message });
		}
	}
}

async function closeAllPositions(symbol) {
	try {
		let positions;

		if (symbol) {
			positions = await alpaca.closePosition(symbol);
		} else {
			positions = await alpaca.closeAllPositions();
		}
		if (!positions) return [];
		if (!Array.isArray(positions)) positions = [positions];

		return positions;
	} catch (err) {
		handleAlpacaErrors(err);
		return { err: err.error.message };
	}
}

async function getAssets() {
	try {
		let assets = await alpaca.getAssets();
		console.log(assets);
	} catch (err) {
		console.log({ err: err.message });
	}
}

async function getAccountConfigurations() {
	try {
		let resp = await alpaca.getAccountConfigurations();
		console.log(resp);
		return resp;
	} catch (err) {
		console.log({ err: err.message });
	}
}
async function updateAccountConfigurations() {
	try {
		let resp = await alpaca.updateAccountConfigurations();
		console.log(resp);
	} catch (err) {
		console.log({ err: err.message });
	}
}

function logOrders(orderData) {
	try {
		console.log("LOGGING ALL OPEN ORDERS");
		orderData.forEach((order, i) => {
			console.log(
				"---------------------------------------------------------"
			);
			console.log(`Order #${i + 1}`);
			console.log(
				"submitted_at " + new Date(order.submitted_at).toLocaleString()
			);
			// console.log("canceled_at " + new Date(order.canceled_at).toLocaleString());
			console.log("status " + order.status);
			console.log("symbol " + order.symbol);
			console.log("type " + order.type);
			console.log("order_type " + order.order_type);
			console.log("limit_price " + order.limit_price);
			console.log("qty " + order.qty);
			console.log("filled_qty " + order.filled_qty);
			console.log("side " + order.side);
			console.log("filled_avg_price " + order.filled_avg_price);
		});
	} catch (err) {
		console.log({ err: err.message });
	}
}

function handleAlpacaErrors(err) {
	try {
		let errMsg = err.error.message;
		let errCode = err.error.code;
		console.log({ errMsg, errCode });

		switch (errCode) {
			case 40310000: {
				console.log(errMsg);

				break;
			}
			case 40310000: {
				let isMsg =
					errMsg ===
					"cannot open a long buy while a short sell order is open";
				console.log({ isMsg });
				if (isMsg) {
					console.log(errMsg);
				}
				break;
			}
			case 40010001: {
				let isMsg =
					errMsg ===
						"stop limit orders require both stop and limit price" ||
					errMsg ===
						'only type="limit" is allowed for extended hours orders';
				console.log({ isMsg });
				if (isMsg) {
					console.log(errMsg);
				}
				break;
			}

			default: {
				console.log(`Need to handle  ${errCode} : ${errMsg}`);
				break;

				break;
			}
		}

		return errMsg;
	} catch (err) {
		console.log({ err: err.message });
	}
}
