// PACKAGES
var expressSanitizer 	= require("express-sanitizer"),
	methodOverride 		= require("method-override"),
	bodyParser 			= require("body-parser"),
	mongoose 			= require("mongoose"),
	express 			= require("express"),
	session 			= require("express-session"),
	MongoStore			= require("connect-mongo")(session),
	back				= require("express-back"),
	flash				= require("connect-flash"),
	favicon				= require("serve-favicon"),
	passport 			= require("passport"),
	LocalStrategy 		= require("passport-local"),
	seedDB				= require("./seeds"),
	moment				= require("moment-business-days"),
	momentTz			= require("moment-timezone"),
	app 				= express();

// MONGOOSE MODELS
var Account 			= require("./models/account"),
	Comment 			= require("./models/comment"),
	User 				= require("./models/user"),
	Log 				= require("./models/log");

// CONFIGURE DOTENV
require("dotenv").config();

// REQUIRING ROUTES
var indexRoutes 		= require("./routes/index"),
	accountRoutes 		= require("./routes/accounts"),
	commentRoutes 		= require("./routes/comments"),
	logRoutes			= require("./routes/logs");

// APP CONFIGURATION
mongoose.Promise = global.Promise;
const databaseUri = process.env.DB_URL || "mongodb://127.0.0.1/worklist_app";
const databaseOptions = {
	user: process.env.DB_USER,
	pass: process.env.DB_PWD,
	auth: {
		authdb: "admin"
	}
};
mongoose.connect(databaseUri, databaseOptions)
	.then(() => console.log(`Database connected`))
	.catch(err => console.log(`Database connection error: ${err.message}`))
;
mongoose.set("debug", true);

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(flash());
app.locals = {
	moment: moment,
	numeral: require("numeral")
};
app.use(favicon(__dirname + "/public/images/logo.ico"));
// seedDB();  //seed the database

// PASSPORT CONFIGURATION
app.use(session({
	secret: "I am anything.",
	resave: false,
	saveUninitialized: false,
	store: new MongoStore({	
		mongooseConnection: mongoose.connection,
		ttl: 8 * 60 // = 8 hours.
	})
}));
app.use(back());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
	res.locals = {
		currentUser: req.user,
		success: req.flash("success"),
		error: req.flash("error"),
		info: req.flash("info"),
		sess: req.session
	};
	next();
});

// express routers
app.use(indexRoutes);
app.use("/accounts", accountRoutes);
app.use("/accounts/:id/comments", commentRoutes);
app.use("/accounts/:id/logs", logRoutes);

// 404 Not Found routes
app.get("*", function(req, res) {
	var url = req.protocol + "://" + req.get("host") + req.url;
	req.flash("error", "Cannot find " + url);
	res.redirect("/accounts");
});

// 500 Internal Server Error
app.use(function(err, req, res, next) {
	req.flash("error", (err.status || 500) + " Internal Server Error: Please try again later.");
	res.redirect("/accounts");
});

app.listen(process.env.PORT || 3000, function() {
	console.log("Serving Worklist Application on port 3000");
});