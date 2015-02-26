/*global applicationContext*/
(function() {
  "use strict";

  var keys = applicationContext.collectionName("keys"),
      plans = applicationContext.collectionName("plans"),
      db = require("org/arangodb").db;

  if (db._collection(keys) === null) {
    db._create(keys);
  }

  if (db._collection(plans) === null) {
    db._create(plans);
  }

}());
