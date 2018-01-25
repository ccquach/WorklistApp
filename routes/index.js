var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var middleware = require("../middleware");
const { isLoggedIn, isAdmin } = middleware;

// Root route
router.get("/", function(req, res) {
	res.render("landing");
});

// ============================
// AUTH ROUTES
// ============================
// show registration form
router.get("/register", isLoggedIn, isAdmin, function(req, res) {
	res.render("register");
});

// handle sign up logic
router.post("/register", isLoggedIn, isAdmin, function(req, res) {
	var newUser = new User({ username: req.body.username });
	if(req.body.adminCode === "pass1") {
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user) {
		if(err) {
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		req.flash("success", "Registration completed for new user.");
		res.back();
		// passport.authenticate("local")(req, res, function() {
		// 	res.redirect("/accounts");
		// });
	});
});

// show login form
router.get("/login", function(req, res) {
	res.render("login");
});

// handle login logic
router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/accounts",
		failureRedirect: "/login"
	}), function(req, res){
});

// logout route
router.get("/logout", function(req, res) {
	req.logout();
	req.flash("success", "You have been successfully logged out.");
	res.redirect("/");
});

// ============================
// PASSWORD RESET ROUTES
// ============================
router.get("/forgot", function(req, res) {
	res.render("forgot");
});

router.post("/forgot", function(req, res, next) {
	async.waterfall([
		// create token
		function(done) {
			crypto.randomBytes(20, function(err, buf) {
				var token = buf.toString("hex");
				done(err, token);
			});
		},
		// look for provided email
		function(token, done) {
			User.findOne({ email: req.body.email }, function(err, user) {
				if(!user) {
					req.flash("error", "No account with that email address exists.");
					return res.redirect("/forgot");
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

				user.save(function(err) {
					done(err, token, user);
				});
			});
		},
		// send reset email
		function(token, user, done) {
			// set service
			var smtpTransport = nodemailer.createTransport({
				service: "Gmail",									// TODO: update with Outlook + credentials
				auth: {
					user: process.env.GMAIL_EMAIL,
					pass: process.env.GMAIL_PASS
				}
			});
			// compose email
			var mailOptions = {
				to: user.email,
				from: process.env.GMAIL_EMAIL,						// TODO: update with work email
				subject: "Worklist Password Reset",
				text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
					  "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
				  	  "http://" + req.headers.host + "/reset/" + token + "\n\n" +
				  	  "If you did not request this, please ignore this email and your password will remain unchanged.\n"
			};
			// send email
			smtpTransport.sendMail(mailOptions, function(err) {
				console.log("Password reset email sent to " + user.email);
				req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions.");
				done(err, "done");
			});
		}
	], function(err) {
		if(err) return next(err);
		res.redirect("/forgot");
	});
});

module.exports = router;