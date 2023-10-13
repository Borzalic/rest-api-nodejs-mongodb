var mongoose = require("mongoose");

exports.databaseConnection = function(uri) {
	mongoose.connection.useDb(uri);
};

