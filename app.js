var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
var indexRouter = require("./routes/index");
var apiRouter = require("./routes/api");
var apiResponse = require("./helpers/apiResponse");
var cors = require("cors");

// DB connection
var MONGODB_URL = process.env.MONGODB_URL;
var mongoose = require("mongoose");

mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
	//don't show the log when it is test
	if(process.env.NODE_ENV !== "test") {
		console.log("Connected to %s", MONGODB_URL);
		console.log("App is running ... \n");
		console.log("Press CTRL + C to stop the process. \n");
	}
})
	.catch(err => {
		console.error("App starting error:", err.message);
		process.exit(1);
	});
	
var connections = {};
var app = express();

//don't show the log when it is test
if(process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(async function (req, res, next) {
	function afterResponse() {
		res.removeListener("finish", afterResponse);
		res.removeListener("close", afterResponse);

		// action after response
	}

	res.on("finish", afterResponse);
	res.on("close", afterResponse);

	if(req.headers["x-access-db"]) {
		if(!connections[req.headers["x-access-db"]]) {
			await mongoose.connect("mongodb://127.0.0.1:27017/" + req.headers["x-access-db"], { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
				if(process.env.NODE_ENV !== "test") {
					console.log("Connected to %s", req.headers["x-access-db"]);
				}
				connections[req.headers["x-access-db"]] = true;
			})
				.catch(err => {
					console.error("App starting error:", err.message);
					process.exit(1);
				});
		}
	}
	// action before request
	// eventually calling `next()`
	next();
});

//To allow cross-origin requests
app.use(cors());

//Route Prefixes
app.use("/", indexRouter);
app.use("/api/", apiRouter);

// throw 404 if URL not found
app.all("*", function(req, res) {
	return apiResponse.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
	if(err.name == "UnauthorizedError"){
		return apiResponse.unauthorizedResponse(res, err.message);
	}
});

module.exports = app;
