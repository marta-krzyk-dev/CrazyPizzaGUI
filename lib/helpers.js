/*
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require('./config');
var crypto = require('crypto');
var path = require('path');
var fs = require('fs');
var debug = require('debug')('helpers');

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    var str = '';
    for(i = 1; i <= strLength; i++) {
        // Get a random charactert from the possibleCharacters string
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str+=randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

// Get the string content of a template, and use provided data for string interpolation
helpers.getTemplate = function (templateName, data, callback) {

    debug(`Trying to get template ${templateName} with data:\n${JSON.stringify(data)}`);

  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof(data) == 'object' && data !== null ? data : {};
  if(templateName){
    var templatesDir = path.join(__dirname,'/../templates/');
    fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err,str){
      if(!err && str && str.length > 0){
        // Do interpolation on the string
        var finalString = helpers.interpolate(str,data);
        callback(false,finalString);
      } else {
        callback('No template could be found');
      }
    });
  } else {
    callback('A valid template name was not specified');
  }
};

// Add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = function(str,data,callback){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};
  // Get the header
  helpers.getTemplate('_header',data,function(err,headerString){
    if(!err && headerString){
      // Get the footer
      helpers.getTemplate('_footer',data,function(err,footerString){
        if(!err && headerString){
          // Add them all together
          var fullString = headerString+str+footerString;
          callback(false,fullString);
        } else {
          callback('Could not find the footer template');
        }
      });
    } else {
      callback('Could not find the header template');
    }
  });
};

// Take a given string and data object, and find/replace all the keys within it
helpers.interpolate = function(str,data){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};

  // Add the templateGlobals to the data object, prepending their key name with "global."
  for(var keyName in config.env.templateGlobals){
     if(config.env.templateGlobals.hasOwnProperty(keyName)){
       data['global.'+keyName] = config.env.templateGlobals[keyName]
     }
  }
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for(var key in data){
     if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
        var replace = data[key];
        var find = '{'+key+'}';
        str = str.replace(find,replace);
     }
  }
  return str;
};

// Get the contents of a static (public) asset
helpers.getStaticAsset = function(fileName,callback){
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if(fileName){
    var publicDir = path.join(__dirname,'/../public/');
    fs.readFile(publicDir+fileName, function(err,data){
      if(!err && data){
        callback(false,data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('A valid file name was not specified');
  }
};

//MY HELPERS


//Get menu as a JSON array
helpers.getMenu = function () {

    var menuText = fs.readFileSync(config.menuFile, 'utf8');
    return JSON.parse(menuText);
}

helpers.getOrderFileName = function (orderId, userName) {
    return `order_${orderId}_for_${userName}`;
}

// Create a SHA256 hash
helpers.hash = function (str) {

    if (typeof (str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.env.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string into an object without throwing
helpers.parseJsonToObject = function (str) {

    try {
        var object = JSON.parse(str);
        return object;
    }
    catch (e) {
        return {};
    }
};

helpers.validateArrayAndFields = function (input, requiriedFields = []) {

    //Check if input is an array
    const isValid = helpers.validateArray(input);
    if (!isValid)
        return false;

    //Check if all elements have the required fields
    input.forEach(function (element) {

        var elementIsValid = helpers.hasAllProperties(element, requiriedFields);

        if (!elementIsValid)
            return false;
    });

    return input;
};


helpers.validateArray = function (input) {

    return typeof (input) == 'object' && input instanceof Array && input.length > 0 ? input : false;
};

helpers.validateArrayOfNumbers = function (input) {

    var isValid = helpers.validateArray(input);
    if (isValid) {
        input.forEach(function (element) {
            if (!validateInteger(element))
                return false;
        });
        return true;
    }
    else
        return false;
};

helpers.validateArrayOrEmpty = function (input) {

    return typeof (input) == 'object' && input instanceof Array && input.length > 0 ? input : [];
};

//Validate string
helpers.validateString = function (input, minLength = 1, maxLength = Number.MAX_SAFE_INTEGER) {

    minLength = typeof (minLength) == 'number' && minLength > 0 ? minLength : 1;
    maxLength = typeof (maxLength) == 'number' && maxLength > 0 ? maxLength : Number.MAX_SAFE_INTEGER;

    if (typeof (input) != 'string')
        return false;
    else {
        input = input.trim();
        return input.length >= minLength && input.length <= maxLength ? input : false;
    }
};

helpers.validateString = function (input, possibleValues, defaultOutput = false) {

    var result = typeof (input) == 'string' ? input.trim() : false;

    if (possibleValues instanceof Array && possibleValues != null)
        result = possibleValues.indexOf(result) > -1 ? result : false;

    if (result == false)
        return defaultOutput;
    else
        return result;
};

helpers.validateStringLength = function (input, exactLength) {
    if (typeof (exactLength) != 'number')
        return false;

    return typeof (input) == 'string' && input.trim().length == exactLength ? input.trim() : false;
};

helpers.validateEmail = function (input) {

    input = typeof (input) == 'string' ? input.trim() : false;
    const regex = /(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/;

    if (input && regex.test(String(input).toLowerCase())) {
        return input;
    } else {
        return false;
    }
};

helpers.getBoolean = function (input) {

    return typeof (input) == 'boolean' ? input : false;
};

helpers.validateInteger = function (input, minValue = false, maxValue = false) {

    var result = typeof (input) == 'number' && input % 1 === 0 ? input : false;

    if (typeof (minValue) == 'number')
        result = input >= minValue ? input : false;

    if (typeof (maxValue) == 'number')
        result = input <= maxValue ? input : false;

    return result;
};

helpers.validateObject = function (input) {

    return typeof (input) == 'object' && input != null ? input : false;
};

helpers.createRandomString = function (strLength) {
    strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;

    if (strLength) {
        var possibleCharacters = 'abcdefghijklmnoprstuvwxyz0123456789';
        var str = '';
        for (i = 1; i <= strLength; ++i) {
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomCharacter;
        }
        return str;
    }
    else {
        return false;
    }
};

helpers.hasAllProperties = function (element, fields) {
    if (fields == 'undefined' || fields == null)
        return false;

    fields.forEach(function (field) {

        if (!element.hasOwnProperty(field))
            return false;
    });
    return true;
};

helpers.printWelcomeMessage = function () {

    console.log('\n---Welcome to CRAZY PIZZA API---\n');
    console.log(fs.readFileSync(config.logoTextFile, 'utf8') + '\n');
};


helpers.validatePizzas = function (pizzaArray) {

    //Check if array is valid
    var isValid = helpers.validateArrayAndFields(pizzaArray, ["id"]);
    if (!isValid)
        return false;

    if (pizzaArray.length > config.maxOrderItems)
        return false;

    var menu = helpers.getMenu();

    //Check if field values are valid
    pizzaArray.forEach(function (element) {

        if (!menu.some(pizza => pizza.Id == element.id)) //the id doesn't exist
        {
            pizzaArray = false;
            return;
        }
        if (('amount' in element) && (element.amount < 1 || element.amount > config.maxAmountPerOrderItem)) {
            pizzaArray = false;
            return;
        }
        if (!helpers.validateInteger(element.amount))
            element.amount = 1;
    });

    return pizzaArray;
};

// Export the module
module.exports = helpers;