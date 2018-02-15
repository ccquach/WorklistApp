'use strict';
const Winston = require("winston");
const fs = require("fs");
const moment = require("moment-timezone");

const logDir = "./logger";
const errorLogDir = logDir + "/error";
const queryLogDir = logDir + "/query";
const userLogDir = logDir + "/user";

const dateFormat = moment().format("YYYY-MM-DD");
const tsFormat = () => moment().tz("US/Pacific").format("YYYY-MM-DD hh:mm:ss.SSS");

// Create the log directory if it does not exist
if(!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir);
}
if(!fs.existsSync(errorLogDir)) {
	fs.mkdirSync(errorLogDir);
}
if(!fs.existsSync(queryLogDir)) {
	fs.mkdirSync(queryLogDir);
}
if(!fs.existsSync(userLogDir)) {
	fs.mkdirSync(userLogDir);
}

// shared console logger
Winston.remove(Winston.transports.Console);
Winston.addColors({
	error: "red",
	warn: "yellow",
	info: "cyan",
	debug: "green"
});
Winston.loggers.options.transports = [
	new Winston.transports.Console ({
		level: "debug",
		colorize: true,
		timestamp: tsFormat,
		prettyPrint: true
	})
];

// file loggers
Winston.loggers.add("errorLogger", {
	file: {
		filename: `${errorLogDir}/${dateFormat}-error.log`,			
		level: "error",
		timestamp: tsFormat,
		json: false
	}
});
Winston.loggers.add("queryLogger", {
	file: {
		filename: `${queryLogDir}/${dateFormat}-query.log`,			
		level: "debug",
		timestamp: tsFormat,
		json: false
	}
});
Winston.loggers.add("userLogger", {
	file: {
		filename: `${userLogDir}/${dateFormat}-user.log`,		
		level: "info",
		timestamp: tsFormat,
		json: false
	}
});

module.exports = Winston;