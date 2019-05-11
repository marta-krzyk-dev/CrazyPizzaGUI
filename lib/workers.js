///*
// * Worker-related tasks
// *
// */

// // Dependencies
//var path = require('path');
//var fs = require('fs');
//var _data = require('./data');
//var https = require('https');
//var http = require('http');
//var helpers = require('./helpers');
//var url = require('url');
//var _logs = require('./logs');
//var util = require('util');
//var debug = util.debuglog('workers');

//// Instantiate the worker module object
//var workers = {};

//// Lookup all orders, get their data, send to validator
//workers.gatherAllOrders = function(){
//  // Get all the orders
//  _data.list('orders',function(err,orders){
//    if(!err && orders && orders.length > 0){
//      orders.forEach(function(order){
//        // Read in the order data
//        _data.read('orders',order,function(err,originalOrderData){
//          if(!err && originalOrderData){
//            // Pass it to the order validator, and let that function continue the function or log the error(s) as needed
//            workers.validateOrderData(originalOrderData);
//          } else {
//            debug("Error reading one of the order's data: ",err);
//          }
//        });
//      });
//    } else {
//      debug('Error: Could not find any orders to process');
//    }
//  });
//};

//// Sanity-order the order-data,
//workers.validateOrderData = function(originalOrderData){
//  originalOrderData = typeof(originalOrderData) == 'object' && originalOrderData !== null ? originalOrderData : {};
//  originalOrderData.id = typeof(originalOrderData.id) == 'string' && originalOrderData.id.trim().length == 20 ? originalOrderData.id.trim() : false;
//  originalOrderData.userEmail = typeof(originalOrderData.userEmail) == 'string' && originalOrderData.userEmail.trim().length == 10 ? originalOrderData.userEmail.trim() : false;
//  originalOrderData.protocol = typeof(originalOrderData.protocol) == 'string' && ['http','https'].indexOf(originalOrderData.protocol) > -1 ? originalOrderData.protocol : false;
//  originalOrderData.url = typeof(originalOrderData.url) == 'string' && originalOrderData.url.trim().length > 0 ? originalOrderData.url.trim() : false;
//  originalOrderData.method = typeof(originalOrderData.method) == 'string' &&  ['post','get','put','delete'].indexOf(originalOrderData.method) > -1 ? originalOrderData.method : false;
//  originalOrderData.successCodes = typeof(originalOrderData.successCodes) == 'object' && originalOrderData.successCodes instanceof Array && originalOrderData.successCodes.length > 0 ? originalOrderData.successCodes : false;
//  originalOrderData.timeoutSeconds = typeof(originalOrderData.timeoutSeconds) == 'number' && originalOrderData.timeoutSeconds % 1 === 0 && originalOrderData.timeoutSeconds >= 1 && originalOrderData.timeoutSeconds <= 5 ? originalOrderData.timeoutSeconds : false;
//  // Set the keys that may not be set (if the workers have never seen this order before)
//  originalOrderData.state = typeof(originalOrderData.state) == 'string' && ['up','down'].indexOf(originalOrderData.state) > -1 ? originalOrderData.state : 'down';
//  originalOrderData.lastOrdered = typeof(originalOrderData.lastOrdered) == 'number' && originalOrderData.lastOrdered > 0 ? originalOrderData.lastOrdered : false;

//  // If all orders pass, pass the data along to the next step in the process
//  if(originalOrderData.id &&
//  originalOrderData.userEmail &&
//  originalOrderData.protocol &&
//  originalOrderData.url &&
//  originalOrderData.method &&
//  originalOrderData.successCodes &&
//  originalOrderData.timeoutSeconds){
//    workers.performOrder(originalOrderData);
//  } else {
//    // If orders fail, log the error and fail silently
//    debug("Error: one of the orders is not properly formatted. Skipping.");
//  }
//};

//// Perform the order, send the originalOrder data and the outcome of the order process to the next step in the process
//workers.performOrder = function(originalOrderData){

//  // Prepare the intial order outcome
//  var orderOutcome = {
//    'error' : false,
//    'responseCode' : false
//  };

//  // Mark that the outcome has not been sent yet
//  var outcomeSent = false;

//  // Parse the hostname and path out of the originalOrderData
//  var parsedUrl = url.parse(originalOrderData.protocol+'://'+originalOrderData.url, true);
//  var hostName = parsedUrl.hostname;
//  var path = parsedUrl.path; // Using path not pathname because we want the query string

//  // Construct the request
//  var requestDetails = {
//    'protocol' : originalOrderData.protocol+':',
//    'hostname' : hostName,
//    'method' : originalOrderData.method.toUpperCase(),
//    'path' : path,
//    'timeout' : originalOrderData.timeoutSeconds * 1000
//  };

//  // Instantiate the request object (using either the http or https module)
//  var _moduleToUse = originalOrderData.protocol == 'http' ? http : https;
//  var req = _moduleToUse.request(requestDetails,function(res){
//      // Grab the status of the sent request
//      var status =  res.statusCode;

//      // Update the orderOutcome and pass the data along
//      orderOutcome.responseCode = status;
//      if(!outcomeSent){
//        workers.processOrderOutcome(originalOrderData,orderOutcome);
//        outcomeSent = true;
//      }
//  });

//  // Bind to the error event so it doesn't get thrown
//  req.on('error',function(e){
//    // Update the orderOutcome and pass the data along
//    orderOutcome.error = {'error' : true, 'value' : e};
//    if(!outcomeSent){
//      workers.processOrderOutcome(originalOrderData,orderOutcome);
//      outcomeSent = true;
//    }
//  });

//  // Bind to the timeout event
//  req.on('timeout',function(){
//    // Update the orderOutcome and pass the data along
//    orderOutcome.error = {'error' : true, 'value' : 'timeout'};
//    if(!outcomeSent){
//      workers.processOrderOutcome(originalOrderData,orderOutcome);
//      outcomeSent = true;
//    }
//  });

//  // End the request
//  req.end();
//};

//// Process the order outcome, update the order data as needed, trigger an alert if needed
//// Special logic for accomodating a order that has never been tested before (don't alert on that one)
//workers.processOrderOutcome = function(originalOrderData,orderOutcome){

//  // Decide if the order is considered up or down
//  var state = !orderOutcome.error && orderOutcome.responseCode && originalOrderData.successCodes.indexOf(orderOutcome.responseCode) > -1 ? 'up' : 'down';

//  // Decide if an alert is warranted
//  var alertWarranted = originalOrderData.lastOrdered && originalOrderData.state !== state ? true : false;

//  // Log the outcome
//  var timeOfOrder = Date.now();
//  workers.log(originalOrderData,orderOutcome,state,alertWarranted,timeOfOrder);

//  // Update the order data
//  var newOrderData = originalOrderData;
//  newOrderData.state = state;
//  newOrderData.lastOrdered = timeOfOrder;

//  // Save the updates
//  _data.update('orders',newOrderData.id,newOrderData,function(err){
//    if(!err){
//      // Send the new order data to the next phase in the process if needed
//      if(alertWarranted){
//        workers.alertUserToStatusChange(newOrderData);
//      } else {
//        debug("Order outcome has not changed, no alert needed");
//      }
//    } else {
//      debug("Error trying to save updates to one of the orders");
//    }
//  });
//};

//// Alert the user as to a change in their order status
//workers.alertUserToStatusChange = function(newOrderData){
//  var msg = 'Alert: Your order for '+newOrderData.method.toUpperCase()+' '+newOrderData.protocol+'://'+newOrderData.url+' is currently '+newOrderData.state;
//  helpers.sendTwilioSms(newOrderData.userEmail,msg,function(err){
//    if(!err){
//      debug("Success: User was alerted to a status change in their order, via sms: ",msg);
//    } else {
//      debug("Error: Could not send sms alert to user who had a state change in their order",err);
//    }
//  });
//};

//// Send order data to a log file
//workers.log = function(originalOrderData,orderOutcome,state,alertWarranted,timeOfOrder){
//  // Form the log data
//  var logData = {
//    'order' : originalOrderData,
//    'outcome' : orderOutcome,
//    'state' : state,
//    'alert' : alertWarranted,
//    'time' : timeOfOrder
//  };

//  // Convert the data to a string
//  var logString = JSON.stringify(logData);

//  // Determine the name of the log file
//  var logFileName = originalOrderData.id;

//  // Append the log string to the file
//  _logs.append(logFileName,logString,function(err){
//    if(!err){
//      debug("Logging to file succeeded");
//    } else {
//      debug("Logging to file failed");
//    }
//  });

//};

//// Timer to execute the worker-process once per minute
//workers.loop = function(){
//  setInterval(function(){
//    workers.gatherAllOrders();
//  },1000 * 60);
//};

//// Rotate (compress) the log files
//workers.rotateLogs = function(){
//  // List all the (non compressed) log files
//  _logs.list(false,function(err,logs){
//    if(!err && logs && logs.length > 0){
//      logs.forEach(function(logName){
//        // Compress the data to a different file
//        var logId = logName.replace('.log','');
//        var newFileId = logId+'-'+Date.now();
//        _logs.compress(logId,newFileId,function(err){
//          if(!err){
//            // Truncate the log
//            _logs.truncate(logId,function(err){
//              if(!err){
//                debug("Success truncating logfile");
//              } else {
//                debug("Error truncating logfile");
//              }
//            });
//          } else {
//            debug("Error compressing one of the log files.",err);
//          }
//        });
//      });
//    } else {
//      debug('Error: Could not find any logs to rotate');
//    }
//  });
//};

//// Timer to execute the log-rotation process once per day
//workers.logRotationLoop = function(){
//  setInterval(function(){
//    workers.rotateLogs();
//  },1000 * 60 * 60 * 24);
//}

//// Init script
//workers.init = function(){

//  // Send to console, in yellow
//  console.log('\x1b[33m%s\x1b[0m','Background workers are running');

//  // Execute all the orders immediately
//  workers.gatherAllOrders();

//  // Call the loop so the orders will execute later on
//  workers.loop();

//  // Compress all the logs immediately
//  workers.rotateLogs();

//  // Call the compression loop so orders will execute later on
//  workers.logRotationLoop();

//};


// // Export the module
// module.exports = workers;

/*
 * Worker-related tasks
 *
 */

//Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var util = require('util');
var debug = util.debuglog('workers');
var config = require('./config');

var workers = {};

// Init script
workers.init = function () {

    //Send to console in yellow
    console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');

    //Delete expired tokens
    workers.deleteExpiredFiles();

    //Call the loop so deleteExpiredFiles() will be executed later on too
    workers.loop();
};

workers.deleteExpiredFiles = function () {

    debug("\n\nStarting to delete expired tokens...\n");

    workers.gatherAll(config.tokensFolder, "expires", function (date) {
        return (date && date <= Date.now()) ? true : false;
    });
};

//Timer to execute the deletion once time set in config
workers.loop = function () {
    setInterval(function () {
        workers.deleteExpiredFiles();
    }, config.workersLoopTime);
};

//Lookup files and send them to validator
workers.gatherAll = function (folder, fieldToValidate, validationFunction) {

    //Get all the files that exist in the folder
    _data.list(folder, function (err, fileNames) {

        if (!err && fileNames && fileNames.length > 0) {

            fileNames.forEach(function (fileName) {
                //Read in the data
                _data.read(folder, fileName, function (err, data) {

                    //Remove all the files where the field exceed maxValue
                    if (!err && data) {
                        workers.validateData(folder, fileName, data, fieldToValidate, validationFunction);
                    } else {
                        debug("Error reading from file: " + fileName);
                    }
                });
            });

        } else {
            debug("Error: Could not find any orders to process.");
        }
    });
};

workers.validateData = function (folder, fileName, data, fieldToValidate, validationFunction) {

    data = helpers.validateObject(data);
    var fieldValue = data[fieldToValidate];

    debug("Field value as date: " + (new Date(fieldValue)).toString());
    debug("File " + fileName + " should be deleted: " + validationFunction(fieldValue));

    //If the orderDate is invalid or it exceeds its lifespan, delete the file
    //If the token 'expires' is greater than Date.now(), delete the file
    if (fieldValue == null || validationFunction(fieldValue)) {
        _data.delete(folder, fileName, function (err) {

            if (!err) {
                    debug("Successfully deleted file by workers: " + fileName);
            } else {
                    debug("Error deleting one of files by workers.");
            }
        });
    }
};

module.exports = workers;