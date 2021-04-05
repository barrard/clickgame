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
