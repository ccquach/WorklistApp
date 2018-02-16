'use strict';
const Winston = require("winston");
const WinstonRotateFile = require("winston-daily-rotate-file");
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

// file loggers
Winston.loggers.add("errorLogger", {
	transports: [
		new(WinstonRotateFile) ({
			filename: `${errorLogDir}/-error.log`,
			prepend: true,
			datePattern: "yyyy-MM-dd-HH",		
			level: "error",
			timestamp: tsFormat,
			json: false
		})
	]
});
Winston.loggers.add("queryLogger", {
	transports: [
		new(WinstonRotateFile) ({
			filename: `${queryLogDir}/-query.log`,	
			prepend: true,
			datePattern: "yyyy-MM-dd-HH",		
			level: "debug",
			timestamp: tsFormat,
			json: false
		})
	]
});
Winston.loggers.add("userLogger", {
	transports: [
		new(WinstonRotateFile) ({
			filename: `${userLogDir}/-user.log`,	
			prepend: true,
			datePattern: "yyyy-MM-dd-HH",		
			level: "info",
			timestamp: tsFormat,
			json: false
		})
	]
});

module.exports = Winston;