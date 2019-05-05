/*
	Shapping cart request handlers
*/

//Dependencies
var _data = require('../data');
var helpers = require('../helpers');
var config = require('../config');
var _tokens = require('./tokens_handler');
var debug = require('debug')('shopping_cart');

//Private container
_shopping_cart = {};

// Shopping cart - GET
// Required header: token
// Required query string: id
_shopping_cart.get = function (data, callback) {

	debug(`Trying to read an order from:\n${JSON.stringify(data.queryStringObject)}`);

	// Verify that the given token is valid
	_tokens.verifyToken(data.headers.token, function (tokenIsValid, tokenData) {

		if (!tokenIsValid) {
			callback(403, { 'Error': config.messages.invalidToken });
			return;
		}
		else {

			// Get the order id from query string
			const id = helpers.validateString(data.queryStringObject.id);

			if (id) {

				//Read order's data
				_data.read(config.ordersFolder, id, function (err, orderData) {

					if (err || orderData == null) {
						callback(404, { 'Error': config.messages.errorCart });
						return;
					}
					else {
						callback(200, orderData);
					}
				});

			} else {
				callback(400, { 'Error': 'Missing required id field, or field invalid' });
			}
		}
	});
};


// Shopping cart - GET
// Required header: token
// Required data: none
// Optional data: none
// Lists ordered but yet not purchased items
/*_shopping_cart.get = function (data, callback) {

	// Verify that the given token is valid
	_tokens.verifyToken(data.headers.token, function (tokenIsValid, tokenData) {

		if (!tokenIsValid) {
			callback(403, { 'Error': config.messages.invalidToken });
		}
		else {
			var userName = tokenData.email;

			// List all items in the directory containing the userName
			_data.listContaining(config.ordersFolder, userName, function (err, fileList) {

				if (err) {
					callback(500, { 'Error': config.messages.errorCart });
				}
				else {
					//if there were no orders found, notify the cart is empty
					if (fileList.length == 0)
						callback(200, { 'Message': config.messages.emptyCart });

					//create an array to hold all orders
					var orderArray = [];
					//count the files processed
					var count = 0;

					fileList.forEach(function (fileName) {

						_data.read(config.ordersFolder, fileName, function (err, orderData) {

							++count;
							if (err) {
								callback(500, { 'Error': config.messages.errorCart });
								return;
							}
							else if (orderData != null) {
								orderArray.push(orderData);
							}
							//when all orders are processed, return the array
							if (count === fileList.length) {
								debug(`Returning user's orders:\n${JSON.stringify(orderArray)}`);

								callback(200, orderArray);
								return;
							}
						});
					});
				}
			});
		}
	})
};
*/

// Shopping cart - POST
// Required data: token, array of pizza objects (id field is required, amount is optional)
// Optional data: none

_shopping_cart.post = function (data, callback) {

	debug(`Trying to create an order from payload:\n${JSON.stringify(data.payload)}`);

	// Verify that the given token is valid
	_tokens.verifyToken(data.headers.token, function (tokenIsValid, tokenData) {

		if (!tokenIsValid) {
			callback(403, { 'Error': config.messages.invalidToken });
			return;
		}
		else {
			//Lookup the user
			var userEmail = tokenData.email;

			_data.read(config.usersFolder, userEmail, function (err, userData) {

				if (!err && userData) {

					var userOrders = Array.isArray(userData.orders) ? userData.orders : [];

					// Verify that user has less than the number of max-orders per user
					if (userOrders.length < config.maxOrders) {

						//Get input data
						let pizzaId = data.payload.pizzaId;
						let amount = data.payload.amount == undefined ? 1 : data.payload.amount;

						//Validate the input
						const orderArray = helpers.validatePizzas([{ "id": pizzaId, "amount":amount }]);

						debug(`Input validated: ${JSON.stringify(orderArray)}`);

						if (!orderArray) {
							callback(403, { 'Error': (!pizzaId) ? 'Pizza id not valid' : `Invalid amount. Max: ${config.maxAmountPerOrderItem}` });
							return;
						}

						// Create order id
						const orderId = Date.now();

						// Create order object including userEmail
						const orderObject = {
							'id': orderId,
							'userEmail': userEmail,
							'items': orderArray,
							'paid': false,
							'totalPrice': orderArray.reduce((a, b) => a + (b.totalPrice || 0), 0)
						};

						// Save the object
						_data.create(config.ordersFolder, orderId, orderObject, function (err) {
							if (!err) {
								// Add order id to the user's object
								userData.orders = userOrders;
								userData.orders.push(orderId);

								// Save the new user data
								_data.update(config.usersFolder, userEmail, userData, function (err) {
									if (!err) {
										// Return the data about the new order
										callback(200, orderObject);
									} else {
										callback(500, { 'Error': 'Could not update the user with the new order.' });
									}
								});
							} else {
								callback(500, { 'Error': 'Could not create the new order' });
							}
						});
					} else {
						callback(400, { 'Error': 'The user already has the maximum number of orders (' + config.maxOrders + ').' })
					}
				} else {
					callback(403);
				}
			});
		}
	});
};


//_shopping_cart.post = function(data, callback){

//	debug(`Trying to create an order from:\n${JSON.stringify(data)}`);

//	// Verify that the given token is valid
//	_tokens.verifyToken(data.headers.token, function(tokenIsValid, tokenData){
	
//		if (!tokenIsValid)
//		{
//			callback(403, {'Error' : config.messages.invalidToken });
//		}
//		else
//		{
//			// validate order
//			var orders = helpers.validatePizzas(data.payload);

//			if (!orders) {
//				callback(403, {'Error' : config.messages.invalidOrder });
//				return;
//			}

//			const orderId = Date.now();
//			const orderFileName = helpers.getOrderFileName(orderId, tokenData.email);
//			const orderData = { 'orderId': orderId, 'items': orders, 'paid': false };

//			//Create a JSON file for the order
//			_data.create(config.ordersFolder, orderFileName, orderData, function(err){
//				if (err){
//					if (config.showMessagesInCommandLine)
//						console.log('Error: ' + err);
//					callback(500, {'Error' : 'Error adding order to the shopping cart.'});				
//				}
//				else{
//					if (config.showMessagesInCommandLine)
//						console.log(`Order ${orderId} was saved to file: ` + JSON.stringify(orderData));
//					callback(200, {'Message' : 'The order was received', 'orderId' : orderId });
//				}
//			});
//		}
//	});
//};


// Orders - PUT
// Required data: id
// Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
_shopping_cart.put = function (data, callback) {
	// Check for required field
	var id = helpers.validateString(data.payload.id);

	// Check for optional fields
   /* var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
	var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
	var method = typeof (data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
	var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
	var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;*/

	// Error if id is invalid
	if (id) {
		// Error if nothing is sent to update
		if (true) {
			// Lookup the order
			_data.read(config.ordersFolder, id, function (err, orderData) {
				if (!err && orderData) {
					// Get the token that sent the request
					var token = helpers.validateString(data.headers.token);
					// Verify that the given token is valid and belongs to the user who created the order
						_tokens.verifyTokenAndEmail(token, orderData.userEmail, function (tokenIsValid) {
						if (tokenIsValid) {
							// Update order data where necessary
							if (protocol) {
								orderData.protocol = Date.now().toLocaleString();
							}
							/*if (url) {
								orderData.url = url;
							}
							if (method) {
								orderData.method = method;
							}
							if (successCodes) {
								orderData.successCodes = successCodes;
							}
							if (timeoutSeconds) {
								orderData.timeoutSeconds = timeoutSeconds;
							}*/

							// Store the new updates
							_data.update(config.ordersFolder, id, orderData, function (err) {
								if (!err) {
									callback(200);
								} else {
									callback(500, { 'Error': 'Could not update the order.' });
								}
							});
						} else {
							callback(403);
						}
					});
				} else {
					callback(400, { 'Error': 'Order ID does not exist.' });
				}
			});
		} else {
			callback(400, { 'Error': 'Missing fields to update.' });
		}
	} else {
		callback(400, { 'Error': 'Missing required id field.' });
	}
};


// Shopping cart - DELETE
// Required data: token, orderId
// Optional data: none
_shopping_cart.delete = function(data, callback){

	debug(`Trying to delete order ${data.queryStringObject.id}`);

	// Verify that the given token is valid
	_tokens.verifyToken(data.headers.token, function(tokenIsValid, tokenData){
	
		if (tokenIsValid){
			
			var orderId = data.queryStringObject.id;

			if (!orderId) {
				callback(403, {'Error' : 'Order id is missing or not a number.' });
				return;
			}

			// Delete the order data
			_data.delete(config.ordersFolder, orderId, function (err) {
				if (!err) {
					// Lookup the user's object to get all their orders
					_data.read(config.usersFolder, tokenData.userEmail, function (err, userData) {
						if (!err) {
							var userOrders = Array.isArray(userData.orders) ? userData.orders : [];

							// Remove the deleted order from their list of orders
							var orderPosition = userOrders.indexOf(id);
							if (orderPosition > -1) {
								userOrders.splice(orderPosition, 1);
								// Re-save the user's data
								userData.orders = userOrders;
								_data.update(config.usersFolder, orderData.userEmail, userData, function (err) {
									if (!err) {
										callback(200);
									} else {
										callback(500, { 'Error': 'Could not update the user.' });
									}
								});
							} else {
								callback(500, { "Error": "Could not find the order on the user's object, so could not remove it." });
							}
						} else {
							callback(500, { "Error": "Could not find the user who created the order, so could not remove the order from the list of orders on their user object." });
						}
					});
				} else {
					callback(500, { "Error": "Could not delete the order data." });
				}
			});
		} else {
			callback(403, {'Error' : config.messages.invalidToken });
			return;
		}
	});
};

//Export the module
module.exports = _shopping_cart;