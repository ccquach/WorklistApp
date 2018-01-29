var express = require("express");
var router = express.Router();
var Account = require("../models/account");
var middleware = require("../middleware");
const { isLoggedIn, checkAccountOwnership } = middleware;

// INDEX ROUTE
router.get("/", isLoggedIn, function(req, res) {
	// pagination
	var perPage = 10;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;

	// sorting
	var sortType = req.query.type;
	var sortDirection = parseInt(req.query.direction);
	var sortObject = sortType && sortDirection ? [[ sortType, sortDirection ]] : [[ "lastModified", 1 ]];

	Account.find({}).sort(sortObject).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allAccounts) {
		if(err) {
			req.flash("error", "An error occurred while retrieving the accounts from the database.");
			res.redirect("/");
		} else {
			Account.count().exec(function(err, count) {
				if(err) {
					req.flash("error", "An error occurred while retrieving the number of accounts stored in the database.");
					res.redirect("/");
				} else {
					res.render("accounts/index", {
						accounts: allAccounts,
						current: pageNumber,
						pages: Math.ceil(count / perPage),
						sort: sortObject,
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
	// Add user id and username to account
	newAccount.author = {
		id: req.user._id,
		username: req.user.username
	};
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
});

// SHOW ROUTE
router.get("/:id", isLoggedIn, function(req, res) {
	Account.findById(req.params.id).populate("comments").exec(function(err, foundAccount) {
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

module.exports = router;