let time = require("../service/time");
let alerts = [];
module.exports = {
	logIp: (req, res, next) => {
		try {
			console.log(`${req.method} request ${req.url} from ${req.ip} @ ${timeEST()}`);
			return next();
		} catch (err) {
			console.log({ err: err.message });
		}
	},
	onlyMe: (req, res, next) => {
		try {
			const cookies = req.cookies;
			console.log(`Secret = .....${cookies.secret}`);
			if (cookies.secret == process.env.PASS) {
				console.log("onlyMe!");
				return next();
			} else {
				console.log("INTRUDER!!!");
				res.json({ ok: "ok" });
			}
		} catch (err) {
			console.log({ err: err.message });
		}
	},
	onlyTradeView: (req, res, next) => {
		try {
			const reqIP = req.ip;
			const TRADE_VIEW_IP_ADDRESSES = ["52.89.214.238", "34.212.75.30", "54.218.53.128", "52.32.178.7"];
			const isTV = TRADE_VIEW_IP_ADDRESSES.some((ip) => reqIP === ip);
			const isDev = process.env.ENV === "DEV" ? true : false;

			//if dev then let this pass
			if (isTV || isDev) {
				if (isDev) console.log("FYI this is being run in DEV");
				console.log("Alert from Trading View");
				console.log(JSON.stringify(req.body, null, 2));
				alerts.push({
					...req.body,
					reIP: req.ip,
					side: req.url,
					dateTime: time.timeEST(),
				});
				return next();
			}
			console.log("!!!!  not Trading View  !!!!!!");
			return res.send({ err: { message: "not Trading View" } });
		} catch (err) {
			console.log({ err: err.message });
		}
	},
};

function timeEST(date) {
	date = date || new Date();
	// return new Date(date);
	return new Date(date).toLocaleString("en-US", { timeZone: "America/New_York" });
}
