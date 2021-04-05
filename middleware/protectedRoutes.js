module.exports = {
	logIp: (req, res, next) => {
		try {
			console.log(
				`${req.method} request ${req.url} from ${req.ip} @ ${timeEST()}`
			);
			return next();
		} catch (err) {
			console.log({ err: err.message });
		}
	},
};

function timeEST(date) {
	date = date || new Date();
	// return new Date(date);
	return new Date(date).toLocaleString("en-US", {
		timeZone: "America/New_York",
	});
}
