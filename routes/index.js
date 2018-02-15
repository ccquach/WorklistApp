var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var middleware = require("../middleware");
const { isLoggedIn, isAdmin } = middleware;

var Winston = require("../logger/WinstonPlugin.js");
const userLogger = Winston.loggers.get("userLogger");

// Root route
router.get("/", function(req, res) {
	res.render("landing");
});

// ============================
// AUTH ROUTES
// ============================
// show registration form
router.get("/register", isLoggedIn, isAdmin, function(req, res) {
	res.render("users/register", { page: "register" });
});

// handle sign up logic
router.post("/register", isLoggedIn, isAdmin, function(req, res) {
	var newUser = new User({ 
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email 
	});
	if(req.body.adminCode === process.env.ADMIN_PASS) {
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user) {
		if(err) {
			userLogger.info(`Register Failure: { username: ${ newUser.username }, error: ${ err.message } }`);
			req.flash("error", err.message);
			return res.redirect("/register");
		}
		userLogger.info(`Register Success: { username: ${ newUser.username } }`);
		req.flash("success", "Registration completed for new user.");
		res.redirect("/forgot");
	});
});

// show login form
router.get("/login", function(req, res) {
	res.render("users/login", { page: "login" });
});

router.post("/login", function(req, res, next) {
	passport.authenticate("local", function(err, user, info) {
		if (err) { return next(err); }
		if (!user) { 
			userLogger.info(`Login Failure: ${info.message}`);
			req.flash("error", info.message);
			return res.redirect("/login"); 
		}
		req.logIn(user, function(err) {
			if (err) { return next(err); }
			req.session.facility = req.body.facility;
			userLogger.info(`Login Success: { facility: ${ req.session.facility }, user: ${ req.user.username } }`);
			req.flash("success", "Welcome to the Worklist Application, " + req.user.firstName + "!");
			return res.redirect("/accounts");
		});
	})(req, res, next);
});

// logout route
router.get("/logout", function(req, res) {
	userLogger.info(`Logout Attempt: { facility: ${ req.session.facility }, user: ${ req.user.username } }`);
	delete req.session.facility;
	userLogger.info(`Logout Success.`);
	req.logout();
	req.flash("info", "You have successfully logged out!");
	res.redirect("/login");
});

// ============================
// PASSWORD RESET ROUTES
// ============================
router.get("/forgot", function(req, res) {
	res.render("users/forgot");
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
					userLogger.info(`Password Reset Request Failure: { email: ${ req.body.email }, error: Email does not exist. }`);
					req.flash("error", "No account with that email address exists.");
					return res.redirect("/forgot");
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

				user.save(function(err) {
					userLogger.info(`Password Reset Request Success: { user: ${ user.username }, email: ${ user.email } }`);
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
				if(err) {
					userLogger.info(`Password Reset Request Email Failure: { username: ${ user.username }, email: ${ user.email } }`);
					req.flash("error", "Failed to send password reset email.");
					return res.redirect("/forgot");
				}
				console.log("Password reset email sent to " + user.email);
				userLogger.info(`Password Reset Request Email Success: { username: ${ user.username }, email: ${ user.email } }`);
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
		userLogger.info(`Password Reset Attempt: { token: ${ req.params.token } }`);
		if(!user) {
			req.flash("error", "Password reset token is invalid or has expired.");
			return res.redirect("/forgot");
		}
		res.render("users/reset", { token: req.params.token });
	});
});

router.post("/reset/:token", function(req, res) {
	async.waterfall([
		// reset password
		function(done) {
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
				if(!user) {
					userLogger.info(`Password Reset Failure: { username: ${ user.username }, error: Invalid Token. }`)
					req.flash("error", "Password reset token is invalid or has expired.");
					return res.back();
				}
				if(req.body.password === req.body.confirm) {
					user.setPassword(req.body.password, function(err) {
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;

						user.save(function(err) {
							userLogger.info(`Password Reset Success: { username: ${ user.username } }`)
							done(err, user);
						});
					});
				} else {
					userLogger.info(`Password Reset Failure: { username: ${ user.username }, error: Mismatching Passwords. }`)
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
				if(err) {
					userLogger.info(`Password Reset Email Failure: { username: ${ user.username }, email: ${ user.email } }`)
					req.flash("error", "Failed to send password reset confirmation email.");
					return res.redirect("/forgot");
				}
				userLogger.info(`Password Reset Email Success: { username: ${ user.username }, email: ${ user.email } }`)
				console.log("Password reset confirmation email sent to " + user.email);
				req.flash("success", "Your password has been changed.");
				done(err);
			});
		}
	], function(err) {
		if(err) return next(err);
		res.redirect("/login");
	});
});

module.exports = router;