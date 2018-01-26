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
	res.render("register", { page: "register" });
});

// handle sign up logic
router.post("/register", isLoggedIn, isAdmin, function(req, res) {
	var newUser = new User({ 
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email 
	});
	if(req.body.adminCode === "pass1") {
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user) {
		if(err) {
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		req.flash("success", "Registration completed for new user.");
		res.redirect("/accounts");
		// passport.authenticate("local")(req, res, function() {
		// 	res.redirect("/accounts");
		// });
	});
});

// show login form
router.get("/login", function(req, res) {
	res.render("login", { page: "login" });
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

router.get("/reset/:token", function(req, res) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if(!user) {
			req.flash("error", "Password reset token is invalid or has expired.");
			return res.redirect("/forgot");
		}
		res.render("reset", { token: req.params.token });
	});
});

router.post("/reset/:token", function(req, res) {
	async.waterfall([
		// reset password
		function(done) {
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
				if(!user) {
					req.flash("error", "Password reset token is invalid or has expired.");
					return res.back();
				}
				if(req.body.password === req.body.confirm) {
					user.setPassword(req.body.password, function(err) {
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;

						user.save(function(err) {
							req.logIn(user, function(err) {
								done(err, user);
							});
						});
					});
				} else {
					req.flash("error", "Passwords do not match.");
					return res.back();
				}
			});
		},
		// send confirmation email
		function(user, done) {
			// set service
			var smtpTransport = nodemailer.createTransport({
				service: "Gmail",										// TODO: update with Outlook + credentials
				auth: {
					user: process.env.GMAIL_EMAIL,						
					pass: process.env.GMAIL_PASS
				}
			});
			// compose email
			var mailOptions = {
				to: user.email,
				from: process.env.GMAIL_EMAIL,							// TODO: update with work email
				subject: "Your Worklist password has been changed",
				text: "Hello " + user.firstName + ",\n\n" +
					  "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
			};
			// send email
			smtpTransport.sendMail(mailOptions, function(err) {
				console.log("Password reset confirmation email sent to " + user.email);
				req.flash("success", "Your password has been changed.");
				done(err);
			});
		}
	], function(err) {
		if(err) return next(err);
		res.redirect("/accounts");
	});
});

module.exports = router;