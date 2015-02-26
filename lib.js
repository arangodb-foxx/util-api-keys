/*jshint esnext: true*/
/*global exports*/
(function() {
  "use strict";

  let refillBuckets = function (update, refills) {
    let now = (new Date()).toISOString();
    if (!update.hasOwnProperty("lastUpdate")) {
      update.buckets = refills;
    } else {
      let lastUpdate = update.lastUpdate;
      let updateVals = [];
      if (lastUpdate.substr(0,7) < now.substr(0,7)) {
        // One Month ago: totalReset
        update.buckets = refills;
      } else if (lastUpdate.substr(0,10) < now.substr(0,10)) {
        // One Day ago
        updateVals = ["day", "hour"];
      } else if (lastUpdate.substr(0,13) < now.substr(0,13)) {
        // One Hour ago
        updateVals = ["hour"];
      }
      let l = updateVals.length;
      if (l > 0) {
        for (let bucket in refills) {
          if (refills.hasOwnProperty(bucket)) {
            update.buckets[bucket] = {};
            for(let i = 0; i < l; ++i) {
              if (refills[bucket].hasOwnProperty(updateVals[i])) {
                update.buckets[bucket][updateVals[i]] = refills[bucket][updateVals[i]];
              }
            }
          }
        }
      }
    }
    update.lastUpdate = now;
  };

  exports.refillBuckets = refillBuckets;
  
}());
