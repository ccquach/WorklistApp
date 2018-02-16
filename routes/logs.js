var express = require("express");
var router = express.Router({ mergeParams: true });
var Account = require("../models/account");
var Log = require("../models/log");
var middleware = require("../middleware");
const { isLoggedIn, isAdmin, checkLogOwnership } = middleware;

// Winston logger
var Winston = require("../logger/WinstonPlugin.js");
const errorLogger = Winston.loggers.get("errorLogger");
const queryLogger = Winston.loggers.get("queryLogger");

// new log entry
router.get("/new", isLoggedIn, function(req, res) {
	Account.findById(req.params.id, function(err, account) {
		if(err || !account) {
			errorLogger.error(`Follow-up Log New Failure:\n\t${ err }`);
			req.flash("error", "Unable to find account.");
			return res.back();
		}
		res.render("logs/new", { account: account });
	});
});

// create log entry
router.post("/", isLoggedIn, function(req, res) {
	req.body.log.note = req.sanitize(req.body.log.note);
	// Find account by Id
	Account.findById(req.params.id, function(err, account) {
		if(err || !account) {
			errorLogger.error(`Follow-up Log Create Get Account Failure:\n\t${ err }`);
			req.flash("error", "Unable to find account.");
			return res.render({ prevLog: req.body.log });
		}
		// Create new log entry
		Log.create(req.body.log, function(err, log) {
			if(err || !log) {
				errorLogger.error(`Follow-up Log Create Failure:\n\t${ err }`);
				req.flash("error", "Failed to add new follow-up to log.");
				return res.back();
			}
			// Add account number to log entry
			log.account = account._id;
			// Add username and id to log entry
			log.author.id = req.user._id;
			log.author.username = req.user.username;
			log.save();
			// Connect new log entry to account
			account.logs.push(log._id);
			account.lastModified = Date.now();
			account.save();
			// Redirect to account show page
			queryLogger.debug(`Follow-up Create Success: { username: ${ req.user.username } }\n\t${ log }`);
			req.flash("success", "Successfully added new follow-up to communication log.");
			res.redirect("/accounts/" + req.params.id);
		});
	});
});

// edit log entry
router.get("/:log_id/edit", isLoggedIn, checkLogOwnership, function(req, res) {
	Account.findById(req.params.id, function(err, foundAccount) {
		if(err || !foundAccount) {
			errorLogger.error(`Follow-up Log Edit Get Account Failure:\n\t${ err }`);
			req.flash("error", "Unable to find account.");
			return res.back();
		}
		Log.findById(req.params.log_id, function(err, foundLog) {
			if(err || !foundLog) {
				errorLogger.error(`Follow-up Log Edit Get Log Failure:\n\t${ err }`);
				req.flash("error", "Unable to find follow-up log entry.");
				return res.back();
			}
			queryLogger.debug(`Follow-up Update Attempt: { username: ${ req.user.username } }\n\t${ foundLog }`);
			res.render("logs/edit", { account: foundAccount, log: foundLog });
		});
	});
});

// update log entry
router.put("/:log_id", isLoggedIn, checkLogOwnership, function(req, res) {
	req.body.log.note = req.sanitize(req.body.log.note);
	Log.findByIdAndUpdate(req.params.log_id, req.body.log, { new: true }, function(err, updatedLog) {
		if(err) {
			errorLogger.error(`Follow-up Log Update Failure:\n\t${ err }`);
			req.flash("error", "Failed to update follow-up log entry.");
			return res.back();
		}
		queryLogger.debug(`Follow-up Update Success: { username: ${ req.user.username } }\n\t${ updatedLog }`);
		req.flash("success", "Successfully updated follow-up log entry!");
		res.redirect("/accounts/" + req.params.id);
	});
});

// destroy log entry
router.delete("/:log_id", isLoggedIn, isAdmin, function(req, res) {
	// debug to query logger delete attempt
	Log.findById(req.params.log_id, function(err, foundLog) {
		queryLogger.debug(`Follow-up Delete Attempt: { username: ${ req.user.username } }\n\t${ foundLog }`);
	});

	// remove log entry from account logs array
	Account.findByIdAndUpdate(req.params.id, {
		$pull: {
			logs: req.params.log_id
		}
	}, function(err) {
		if(err) {
			errorLogger.error(`Follow-up Log Account Delete Failure:\n\t${ err }`);
			req.flash("error", "Failed to delete follow-up log entry from account.");
			return res.redirect("/accounts/" + req.params.id);
		}
		// delete log entry from db
		Log.findByIdAndRemove(req.params.log_id, function(err) {
			if(err) {
				errorLogger.error(`Follow-up Log Database Delete Failure:\n\t${ err }`);
				req.flash("error", "Failed to delete follow-up log entry from database.");
				res.back();
			} else {
				queryLogger.debug(`Follow-up Delete Success: { username: ${ req.user.username } }`);
				req.flash("success", "Successfully deleted follow-up log entry!");
				res.redirect("/accounts/" + req.params.id);
			}
		});
	});
});

module.exports = router;