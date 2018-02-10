var express = require("express");
var router = express.Router();
var Account = require("../models/account");
var moment = require("moment-business-days");
var json2csv = require("json2csv");
// var fs = require("fs");
const os = require("os");
const path = require("path");
var middleware = require("../middleware");
const { isLoggedIn, checkAccountOwnership } = middleware;

// INDEX ROUTE
router.get("/", isLoggedIn, function(req, res) {
	// pagination
	var perPage = 10;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;

	// sorting
	var sortType = req.query.sortType;
	var sortDirection = parseInt(req.query.direction);
	var sortObj = sortType && sortDirection ? [[ sortType, sortDirection ]] : [[ "lastModified", 1 ]];

	// facility
	if(req.query.fac) {
		req.session.facility = req.query.fac;
	}

	// fuzzy search
	var findObj = {};
	if(req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		var findObj = { facility: req.session.facility, lastName: regex };
	} else {
		var findObj = { facility: req.session.facility };
	}

	// filter search
	if(req.query.cycle) { findObj["mcal.cycle"] = parseInt(req.query.cycle); }
	if(req.query.type) { findObj.type = req.query.type; }
	if(req.query.status) { findObj.status = req.query.status; }
	if(req.query.followup) { 
		var year = parseInt(req.query.followup.slice(0, 4)),
			month = parseInt(req.query.followup.slice(5, 7)),
			day = parseInt(req.query.followup.slice(8,));
		findObj.lastModified = { 
			"$gte": moment(new Date(year, month - 1, day)).businessSubtract(10), 
			"$lt": moment(new Date(year, month - 1, day + 1)).businessSubtract(10) 
		};
	}

	Account.find(findObj).sort(sortObj).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allAccounts) {
		if(err) {
			req.flash("error", "An error occurred while retrieving the accounts from the database.");
			res.redirect("/");
		} else {
			Account.find(findObj).count().exec(function(err, count) {
				if(err) {
					req.flash("error", "An error occurred while retrieving the number of accounts stored in the database.");
					res.redirect("/");
				} else {
					res.render("accounts/index", {
						accounts: allAccounts,
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						sort: sortObj,
						search: req.query.search,
						page: "home"
					});
				}
			});
		}
	});
});

// NEW ROUTE
router.get("/new", isLoggedIn, function(req, res) {
	res.render("accounts/new");
});

// CREATE ROUTE
router.post("/", isLoggedIn, function(req, res) {
	// New account
	var newAccount = req.body.account;
	// Add facility to account
	newAccount.facility = req.session.facility;
	// Add user id and username to account
	newAccount.author = {
		id: req.user._id,
		username: req.user.username
	};
	// Check if account number already exists
	Account.findOne({ facility: req.session.facility, number: req.body.account.number }, function(err, foundAccount) {
		// If account does not exist
		if(err || !foundAccount) {
			// Create new account
			Account.create(newAccount, function(err, newAccount) {
				if(err) {
					req.flash("error", "Failed to create new account: " + err.message);
					res.redirect("/accounts/new");
				} else {
					console.log("=== NEW ===:\n" + newAccount);
					req.flash("success", "Successfully created new account.")
					res.redirect("/accounts");
				}
			});
		// If account exists, display message notifying user
		} else {
			req.flash("error", "Account # " + req.body.account.number + " already exists!");
			res.back();
		}
	});
	
});

// CSV EXPORT ROUTE
router.get("/export", function(req, res) {
	const facility = req.session.facility;
	Account.find({ facility: facility }).exec(function(err, accounts) {
		if(err) {
			req.flash("error", "Unable to find accounts.");
			return res.redirect("/accounts");
		}
		var fields = [
			"mcal.cycle",
			"mcal.hmsIssueDate",
			"mcal.hmsCloseDate",
			"type",
			"number",
			"lastName",
			"firstName",
			"dob",
			"admit",
			"discharge",
			"charges",
			"balance",
			"status",
			"commercial.fc",
			"commercial.payer",
			"commercial.insuredId",
			"commercial.isEligible",
			"commercial.billedDate",
			"commercial.expected",
			"commercial.paidOn",
			"commercial.reim",
			"commercial.soc",
			"commercial.status",
			"mcal.arTrans",
			"mcal.retractionDate",
			"mcal.recoup",
			"mcal.cifDate",
			"mcal.cifAmount"
		];
		var fieldNames = [
			"Cycle",
			"HMS Issue Date",
			"HMS Close Date",
			"Type",
			"Account",
			"Last Name",
			"First Name",
			"DOB",
			"Admit",
			"Disch",
			"Total Charges",
			"AR Balance",
			"Acct Status",
			"FC",
			"Payer",
			"Insured Id",
			"Eligible?",
			"Billed Date",
			"Expected Reim",
			"Reim Date",
			"Reim Amt",
			"Pt Liab",
			"Commercial Status",
			"AR Trans",
			"Retraction Date",
			"Recoup Amt",
			"CIF Date",
			"CIF Amt"
		];
		json2csv({ 
			data: accounts, 
			fields: fields, 
			fieldNames: fieldNames,
			quotes: ""
		}, function(err, csv) {
			if(err) {
				req.flash("err", "Export failed.");
				return res.redirect("/accounts");
			}
			const filename = facility.toLowerCase() + moment(Date.now()).format("YYYYMMDDhhmmss") + ".csv"
			var filepath = path.join(os.homedir(), "Desktop", filename);
			res.attachment(filepath);
			res.set({
				"Content-Type": "text/csv",
				"Content-Disposition": "attachment; filename=" + filename
			});
			res.send(csv);
		});
	});
});

// SHOW ROUTE
router.get("/:id", isLoggedIn, function(req, res) {
	Account.findById(req.params.id).populate("comments").populate("logs").exec(function(err, foundAccount) {
		if(err || !foundAccount) {
			req.flash("error", "Unable to find the account. Please note the account number and contact support.");
			res.redirect("/accounts");
		} else {
			res.render("accounts/show", { account: foundAccount });
		}
	});
});

// EDIT ROUTE
router.get("/:id/edit", isLoggedIn, checkAccountOwnership, function(req, res) {
	Account.findById(req.params.id, function(err, foundAccount) {
		res.render("accounts/edit", { account: foundAccount });
	});
});

// UPDATE ROUTE
router.put("/:id",isLoggedIn, checkAccountOwnership, function(req, res) {
	Account.findByIdAndUpdate(req.params.id, req.body.account, function(err, updatedAccount) {
		if(err) {
			req.flash("error", "Failed to update account.");
			res.back();
		} else {
			console.log("=== UPDATE ===:\n" + updatedAccount);
			req.flash("success", "Successfully updated account.");
			res.redirect("/accounts/" + req.params.id);
		}
	});
});

// DELETE ROUTE
router.delete("/:id", isLoggedIn, checkAccountOwnership, function(req, res) {
	Account.findByIdAndRemove(req.params.id, function(err) {
		if(err) {
			req.flash("error", "Failed to delete account.");
			res.back();
		} else {
			req.flash("success", "Successfully deleted account.");
			res.redirect("/accounts");
		}
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;