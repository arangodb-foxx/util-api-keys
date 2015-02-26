/*jshint esnext:true*/
/*global require, applicationContext*/
(function() {
  "use strict";

  let utils = require("./lib.js");
  let joi = require("joi");
  let db = require("internal").db;
  let apikey = "apiKey";
  let keys = db._collection(
    applicationContext.collectionName("keys")
  );
  let plans = db._collection(
    applicationContext.collectionName("plans")
  );
  let InvalidAPIKeyError = function(key) {
    this.errorNum = "1";
    this.errorMessage = "invalid key: " + key;
  };
  InvalidAPIKeyError.prototype = new Error();
  InvalidAPIKeyError.toString = function() {
    return "[InvalidAPIKey " + this.errorMessage + "]";
  };

  let TooManyRequestsError = function(key, type) {
    this.errorNum = "2";
    this.errorMessage = "No " + type + " requests left for key: " + key;
  };
  TooManyRequestsError.prototype = new Error();
  TooManyRequestsError.toString = function() {
    return "[TooManyRequestsError " + this.errorMessage + "]";
  };

  let apiKey = joi.string().required().description("The api-key this request should be associated with");

  let payTransaction = function(params) {
    let key = params.apiKey;
    let cost = params.cost;
    let type = params.type;
    let account;
    try {
      account = keys.document(key); 
    } catch (err) {
      // Could not read the account info.
      // It is invalid
      throw new InvalidAPIKeyError(key);
    }
    if (account.disabled) {
      // The account is disabled
      throw new InvalidAPIKeyError(key);
    }
    let update = { };
    if (account.hasOwnProperty("lastUpdate")) {
      update.lastUpdate = account.lastUpdate;
    }
    if (account.hasOwnProperty("buckets")) {
      update.buckets = account.buckets;
    }
    let refills = plans.document(account.plan).refills;
    utils.refillBuckets(update, refills);
    if (!update.buckets.hasOwnProperty(type)) {
      // This bucket is not defined for this user
      throw new TooManyRequestsError(key, type);
    }
    if (cost === undefined) {
      cost = 1;
    }
    if (cost <= 0) {
      // Free route
      return;
    }
    let current = update.buckets[type];
    for (let p in current) {
      if(current.hasOwnProperty(p)) {
        if (current[p] < cost) {
          throw new TooManyRequestsError(key, type);
        }
        if (current[p] !== Infinity) {
          current[p] -= cost;
        }
      }
    }
    require("console").log(update);
    keys.update(key, update);
  };

  let payForRoute = function(type, cost) {
    this.queryParam(apikey, {type: apiKey});
    this.onlyIf(function(req) {
      let key = req.params(apikey);
      db._executeTransaction({
        collections: {
          write: [keys.name()],
          load: [plans.name()]
        },
        action: payTransaction,
        params: {
          apiKey: key,
          type: type,
          cost: cost
        }
      });
    });
    this.errorResponse(InvalidAPIKeyError, 400, "Invalid apikey.");
    this.errorResponse(TooManyRequestsError, 400, "The apikey has issued too many requests of this type");
  };

  exports.payForRoute = payForRoute;
}());
