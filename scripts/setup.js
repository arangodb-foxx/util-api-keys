/*global applicationContext*/
(function() {
  "use strict";

  var collection = applicationContext.collectionName("account"),
      db = require("org/arangodb").db;

  if (db._collection(collection) === null) {
    db._create(collection);
  }
}());
