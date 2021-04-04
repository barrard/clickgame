const alpacaService = require("./alpaca.js");
const time = require("./time.js");

// let closeAllPositions = false;
let marketIsOpen = false;
let closeTimer, openTimer, weekendTimer;
let tradeAllocation = 5000;
module.exports = { limitBuy, limitSell, cancelOrder, exitPosition };

init();
async function init() {
	console.log("Init Trade Bot");
	startMarketTimer();
	//check for open/unfilled positions
	let openOrders = await alpacaService.getOpenOrders();
	let openPositions = await alpacaService.getPositions();
	//assume these arrays will be empty
	console.log(openPositions);
	console.log(openOrders);
	console.log(openPositions.length + " openPositions");
	console.log(openOrders.length + " openOrders");
	console.log("There should both be zero");

	// await alpacaService.cancelAllOrders(); //debugging
	// await closeAllPositionsEOD();
}

async function limitBuy({ ticker, close }, attemptCount) {
	if (!attemptCount) attemptCount = 0;
	attemptCount++;
	console.log(`Order to buy ${ticker} @ $${close}: ${time.timeEST()}`);
	if (!marketIsOpen) return console.log("Market is not open " + time.timeEST());

	//FIRST check if we are short this stock
	let closeShort = await checkShort(ticker);

	if (closeShort) {
		if (closeShort.err) {
			return console.log("Error closing short " + closeShort.err);
		}
		return console.log("Closed shorts " + ticker);
	}
	//get buying power
	let { cash } = await alpacaService.getAccount();
	cash = parseFloat({ cash });

	if (cash < tradeAllocation) return console.log(`Not enough cash ${cash}`); //so the 25% can stay

	cash = tradeAllocation;

	//get actual price
	let { askprice, bidprice } = await alpacaService.getQuote(ticker);
	let spread = askprice - bidprice;
	close = bidprice;
	if (spread > 0.2) {
		console.log("Large spreads");
		console.log({ askprice, bidprice });
	}

	//   if (Math.abs(askprice - close) > 0.2) {
	//     console.log("price and alert close are way off");
	//     console.log({ askprice, close });
	//   }

	close = parseFloat(close) + 0.01; //get that stock!

	let qty = Math.floor(cash / close);

	let order = await alpacaService.limitBuy({ ticker, qty, close });
	if (!order || order.err) {
		console.log(`Failed to buy ${qty} ${ticker} @ ${close}`);
		return console.log("Not making stop order, initial limit order failed");
	}
	console.log(order);
	let orderId = order.id;

	//follow to make sure order is filled
	didOrderFill(orderId, ticker, "buy", attemptCount);
}

async function limitSell({ ticker, close }, attemptCount) {
	if (!attemptCount) attemptCount = 0;
	attemptCount++;
	console.log(`Order to sell ${ticker} @ $${close}: ${time.timeEST()}`);
	if (!marketIsOpen) return console.log("Market is not open " + time.timeEST());

	//FIRST check if we are short this stock
	let closeLong = await checkLong(ticker);

	if (closeLong) {
		if (closeLong.err) {
			return console.log("Error closing long " + closeLong.err);
		}
		return console.log("Closed longs " + ticker);
	}

	//get buying power
	let { cash } = await alpacaService.getAccount();
	cash = parseFloat(cash);

	if (cash < tradeAllocation) return console.log(`Not enough cash ${cash}`); //so the 25% can stay

	cash = tradeAllocation;

	//get actual price
	let { askprice, bidprice } = await alpacaService.getQuote(ticker);
	let spread = askprice - bidprice;
	close = askprice;
	if (spread > 0.2) {
		console.log("Large spreads");
		console.log({ askprice, bidprice });
	}

	let qty = Math.floor(cash / close);

	close = parseFloat(close) - 0.01; //get that stock!
	let order = await alpacaService.limitSell({ ticker, qty, close });
	if (!order || order.err) {
		console.log(`Failed to sell ${qty} ${ticker} @ ${close}`);
		return console.log("Not making stop order, initial limit order failed");
	}
	let orderId = order.id;
	console.log(`limit sell - ${qty} shares of ${ticker} orderId: ${orderId} `);

	//follow to make sure order is filled
	didOrderFill(orderId, ticker, "sell", attemptCount);
}

// test();
// async function test() {
// 	// await limitSell({ ticker: "MSFT", close: 1111, qty: 10 });
// 	// let p = await alpacaService.getPositions("VISL");
// 	// console.log(p);
// 	let o = await alpacaService.getOpenOrders("MSFT");
// 	console.log(o);
// 	let c = await alpacaService.cancelOrder(o[0].id);
// 	console.log({ c });
// }

function didOrderFill(orderId, ticker, buySell, attemptCount) {
	let retryCount = 0;
	let didFillTimer = setInterval(async () => {
		try {
			retryCount++;
			console.log(
				`#${retryCount} - Did order# ${orderId.slice(0, 5)} Fill to ${buySell} ${ticker} @ ${time.timeEST()}?`
			);
			//check if order is filled or not
			let oldOrder = await alpacaService.getOrder(orderId);
			//make sure this order hasn't been canceled and is still live
			console.log(
				`Order Status: ${oldOrder.status} / Quantity filled is ${oldOrder.filled_qty} out of ${oldOrder.qty}`
			);
			let filled = oldOrder.qty - oldOrder.filled_qty === 0;
			if (!filled && retryCount === 10) {
				clearInterval(didFillTimer);
				console.log("Order is not filled... GET THE ORDER FILLED!!!");
				// console.log(oldOrder);
				// cancel the oldOrder and reTry with a fresh quote price
				await alpacaService.cancelOrder(oldOrder.id);
				if (attemptCount > 10) {
					return console.log(`$attemptCount is ${attemptCount}, done trying...`);
				}
				let qty = oldOrder.qty - oldOrder.filled_qty;
				let quote = await alpacaService.getQuote(ticker);
				//could soulble check the order.side
				// console.log(oldOrder.side === buySell);
				console.log(
					`Submitting order to ${buySell} ${qty} ${ticker} @${
						buySell === "sell" ? quote.askprice : quote.bidprice
					} `
				);
				if (buySell === "sell") {
					let close = parseFloat(quote.askprice) - 0.01;
					//reOrder with new price +++
					await limitSell({ ticker, close, qty }, attemptCount);
				} else {
					let close = parseFloat(quote.buySell) + 0.01;
					//reOrder with new price +++
					await limitBuy({ ticker, close, qty }, attemptCount);
				}
			} else if (filled) {
				//the order was filled!
				clearInterval(didFillTimer);
				console.log(`Order for ${oldOrder.filled_qty} shared of ${ticker} was filled`);
				let positions = await alpacaService.getPositions(ticker);
				let qty = positions[0].qty;
				let side = buySell === "buy" ? "sell" : "buy";
				let price = parseFloat(oldOrder.filled_avg_price);
				let stop_price = buySell === "buy" ? price - price * 0.02 : price + price * 0.02;
				// let qty = oldOrder.filled_qty;
				let stopLimitOrder = await alpacaService.createStop({ ticker, side: side, stop_price, qty });
				if (stopLimitOrder.err) {
					console.log(
						`The stop limit order for this position ( ${buySell} ${oldOrder.filled_qty} shares of ${ticker}) failed`
					);
					console.log("consider exiting since there is no stop?");
				} else {
					console.log(`Stops are INNNNNNNN!!! for ${qty} shares of ${ticker} @ $${stop_price}`);
				}
			}
		} catch (err) {
			clearInterval(didFillTimer);

			console.log(`An error occurred trying to check this order fill to ${buySell} ${qty} shares of ${ticker}`);
		}
	}, 1000 * 6);
}

async function closeAllPositionsEOD() {
	//get all open positions, and close them
	let orders = await alpacaService.cancelAllOrders();
	let positions = await alpacaService.closeAllPositions();
	if (positions.err) {
		console.log("Error closing positions");
		console.log(positions.err);
	} else {
		console.log(positions.length + " Positions Closed");
	}

	if (orders.err) {
		console.log("Error closing orders");
		console.log(orders.err);
	} else {
		console.log(orders.length + " Orders Closed");
	}

	//start morning timer
	// startMorningTimer();
}

function startMarketTimer() {
	marketIsOpen = false;
	console.log("starting market timer");
	//if not market hours
	let morning = time.isMorning();
	let evening = time.isEvening();
	let weekend = time.isWeekend();
	console.log({ morning, evening, weekend });
	console.log(time.timeEST());
	if (weekend) {
		startWeekendTimer();
	} else if (morning || evening) {
		startMorningTimer();
	} else {
		//market is open, watch for the close
		marketIsOpen = true;
		console.log("Market is open!");
		startCloseTimer();
	}
}

function startCloseTimer() {
	console.log("starting close timer");
	closeTimer = setInterval(() => {
		//check is market about to close
		let isClosing = time.marketIsClosing();
		// console.log({ isClosing });
		if (isClosing) {
			clearInterval(closeTimer);
			console.log("Market is Closing @ " + time.timeEST());
			closeAllPositionsEOD();
			startMorningTimer();
			marketIsOpen = false;
		}
	}, 6000);
}

function startWeekendTimer() {
	console.log("starting weekend timer");
	marketIsOpen = false;
	weekendTimer = setInterval(() => {
		//check is morning and not weekend
		let morning = time.isMorning();
		let weekend = time.isWeekend();
		if (morning && !weekend) {
			clearInterval(weekendTimer);
			startMorningTimer();
		}
	}, 1000 * 60 * 60);
}

function startMorningTimer() {
	console.log("starting morning timer");
	marketIsOpen = false;

	openTimer = setInterval(() => {
		//check is market about to close
		let isOpening = time.marketIsOpening();
		let isWeekend = time.isWeekend();
		let open = time.isOpen();
		// console.log({ isOpening });
		if (isWeekend) {
			clearInterval(openTimer);
			startWeekendTimer();
		} else if (isOpening || open) {
			console.log(`Market is OPENing! ${time.timeEST()}`);
			marketIsOpen = true;
			clearInterval(openTimer);
			startCloseTimer();
		}
	}, 6000);
}

async function cancelOrder(id) {
	try {
		let order = await alpacaService.cancelOrder(id);
		return order;
	} catch (err) {
		console.log(err);
		return { err: err.error.message };
	}
}

async function checkShort(ticker) {
	let side = "short";
	console.log(`check positions ${side} for ${ticker}`);
	let positions = await alpacaService.getPositions(ticker, side);
	console.log(`Found ${positions.length} positions`);
	side = "buy";
	let type = "stop";
	//get possible stop_limit buy orders for this shorts
	console.log(`check possible ${type} stop orders for ${ticker}`);
	let stopLimitOrders = await alpacaService.getOpenOrders(ticker, side, type);
	console.log(`Found ${stopLimitOrders.length}  ${type} stop positions`);

	if (!stopLimitOrders.length && positions.length) {
		console.log(`Got open positions in ${ticker} and no stop_limit order.....?`);
	}
	if (stopLimitOrders.length) {
		await Promise.all(
			stopLimitOrders.map(async (order) => {
				await alpacaService.cancelOrder(order.id);
			})
		);
	}
	if (positions.length) {
		//better close
		let closed = await alpacaService.closeAllPositions(ticker);
		if (closed.err) {
			console.log(`Error closing short positions`);
			return { err: closed.err };
		}
		return true;
	} else {
		return false;
	}
}

async function exitPosition(symbol) {
	//get position
	//get any orders associated
	//cancel orders
	//exit position
	let exit = await alpacaService.closeAllPositions(symbol);
	return exit;
}

async function checkLong(ticker) {
	let side = "long";
	let positions = await alpacaService.getPositions(ticker, side);
	side = "sell";
	let type = "stop";
	let stopLimitOrders = await alpacaService.getOpenOrders(ticker, side, type);
	// console.log(stopLimitOrders);
	if (!stopLimitOrders.length && positions.length) {
		console.log(`!!!!   Got open positions in ${ticker} and no stop_limit order.....?!!!!`);
	}
	if (stopLimitOrders.length) {
		await Promise.all(
			stopLimitOrders.map(async (order) => {
				await alpacaService.cancelOrder(order.id);
			})
		);
	}
	if (positions.length) {
		//better close
		let closed = await alpacaService.closeAllPositions(ticker);
		if (closed.err) {
			return { err: closed.err };
		}
		return true;
	} else {
		return false;
	}
}
