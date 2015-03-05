/*jshint esnext: true*/
/*global require, applicationContext*/
(function() {
  "use strict";

  let Foxx = require("org/arangodb/foxx"),
    joi = require("joi"),
    _ = require("underscore"),
    controller = new Foxx.Controller(applicationContext),
    keyType = joi.string().required(),
    keys = applicationContext.collection("keys"),
    plans = applicationContext.collection("plans"),
    crypto = require("org/arangodb/crypto"),
    refillsSchema = joi.object().pattern(/\.*/, joi.object().keys({
      hour: joi.number().integer().optional().description("Hourly refill rate"),
      day: joi.number().integer().optional().description("Daily refill rate"),
      month: joi.number().integer().optional().description("Monthly refill rate")
    }).unknown(false)).description("Definition of buckets"),
    planSchema = {
      refills: refillsSchema,
      name: joi.string().required().description("Name of the plan")
    },
    utils = require("./lib.js");

  /** Define new base plan
   *
   * This functions is used to define a baseplan for
   * api key definitions.
   * This plan contains  default refresh rates and
   * new apikeys can be spawned from existing plans
   */
  controller.post("/plan", function(req, res) {
    let plan = req.params("plan");
    let save = plans.save({
      refills: plan.refills,
      name: plan.name
    });
    res.json({
      id: save._key,
      name: plan.name
    });
  }).bodyParam("plan", {
    type: planSchema
  });

  /** List all plans
   *
   * Lists all available plans
   */
  controller.get("/plan", function(req, res) {
    let result = [];
    let cursor = plans.all();
    while (cursor.hasNext()) {
      let doc = cursor.next();
      result.push({key: doc._key, name: doc.name});
    }
    res.json(result);
  });

  /** Load base plan
   *
   * Show the basic information contained in this
   * plan. 
   */
  controller.get("/plan/:plan", function(req, res) {
    res.json(plans.document(req.params("plan")));
  }).pathParam("plan", {type: keyType.description("The id of a plan")});

  /** Change base plan
   *
   * Change the refill plan.
   */
  controller.put("/plan/:plan", function(req, res) {
    let plan = req.params("plan");
    let refills = req.params("refills");
    res.json(plans.update(plan, {
      refills: refills
    }, {mergeObjects: false}));
  }).pathParam("plan", {type: keyType.description("The id of a plan")})
  .bodyParam("refills", {
    type: refillsSchema
  });

  /** Create a new apikey
   *
   * Creates a new apikey using the
   * given plan.
   */
  controller.post("/key/:plan", function(req, res) {
    let plan = req.params("plan");
    let newKey = keys.save({
      _key: crypto.genRandomAlphaNumbers(32),
      plan: plan
    });
    res.json({
      apikey: newKey._key
    });
  }).pathParam("plan", {type: keyType.description("The id of a plan")});

  /** List all apikeys
   *
   * Returns the list of all apikeys and their
   * attached plan.
   */
  controller.get("/key", function(req, res) {
    let result = [];
    let cursor = keys.all();
    while (cursor.hasNext()) {
      let doc = cursor.next();
      result.push({key: doc._key, plan: doc.plan, active: !doc.disabled});
    }
    res.json(result);
  });

  /** Show details of one apikey
   *
   * Lists the details of one specific apikey.
   * Includes it's current buckets and refill rates.
   */
  controller.get("/key/:key", function(req, res) {
    let key = req.params("key");
    let apikey = _.clone(keys.document(key));
    let plan = plans.document(apikey.plan);
    utils.refillBuckets(apikey, plan.refills);
    keys.update(key, apikey);
    res.json({
      apikey: apikey._key,
      buckets: apikey.buckets,
      refill: plan.refills,
      active: !apikey.disabled,
      lastUpdate: apikey.lastUpdate
    });
  }).pathParam("key", {type: keyType.description("An apikey.")});

  /** Change plan of apikey
   *
   * Changes the plan used for an api key.
   * Reactivates this apikey also.
   */
  controller.put("/key/:key/:plan", function(req, res) {
    let key = req.params("key");
    let plan = req.params("plan");
    let refills = plans.document(plan).refills;
    keys.update(key, {
      plan: plan,
      bucket: refills,
      disabled: false,
      lastUpdate: (new Date()).toISOString()
    }, {
      keepNull: false
    });
    res.json({
      plan: plan,
      bucket: refills,
      active: true,
      key: key
    });
  }).pathParam("key", {type: keyType.description("An apikey.")})
  .pathParam("plan", {type: keyType.description("The id of a plan")});

  /** Deactivate apikey
   *
   * Deactivates this apikey.
   */
  controller.delete("/key/:key", function(req, res) {
    let key = req.params("key");
    keys.update(key, {
      disabled: true
    });
    res.json({
      active: false,
      key: key
    });
  }).pathParam("key", {type: keyType.description("An apikey.")});

}());
