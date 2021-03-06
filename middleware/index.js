var Account = require("../models/account");
var Log = require("../models/log");

// Winston logger
var Winston = require("../logger/WinstonPlugin.js");
const errorLogger = Winston.loggers.get("errorLogger");

var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You must be logged in to complete this action.");
	res.redirect("/login");
};

middlewareObj.isAdmin = function(req, res, next) {
	if(req.user.isAdmin) {
		next();
	} else {
		req.flash("error", "You are not authorized to complete this action.");
		res.back();
	}
};

middlewareObj.checkAccountOwnership = function(req, res, next) {
	Account.findById(req.params.id, function(err, foundAccount) {
		if(err || !foundAccount) {
			errorLogger.error(`Account Not Found:\n\t${ err }`);
			req.flash("error", "Unable to find account.");
			res.back();
		} else {
			if(foundAccount.author.id.equals(req.user._id) || req.user.isAdmin) {
				next();
			} else {
				req.flash("error", "You are not authorized to complete this action.");
				res.back();
			}
		}
	});
};

middlewareObj.checkLogOwnership = function(req, res, next) {
	Log.findById(req.params.log_id, function(err, foundLog) {
		if(err || !foundLog) {
			errorLogger.error(`Follow-up Log Not Found:\n\t${ err }`);
			req.flash("error", "Unable to find log entry.");
			return res.back();
		}
		if(foundLog.author.id.equals(req.user._id) || req.user.isAdmin) {
			next();
		} else {
			req.flash("error", "You are not authorized to complete this action.");
			res.back();
		}
	});
}

module.exports = middlewareObj;