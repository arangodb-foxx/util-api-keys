/*global angular*/
(function() {
  "use strict";
  var app = angular.module("keyManager", []);

  app.controller("manager", function ($scope, $http) {

    $http.get("plan")
    .success(function(response) {
      $scope.planMap = {};
      $scope.planList = response || [];
      for (var i = 0; i < $scope.planList.length; ++i) {
        $scope.planMap[$scope.planList[i].key] = $scope.planList[i].name;
      }
      console.log($scope.planMap);
    });

    $scope.clearInfo = function() {
      delete $scope.error;
      delete $scope.success;
    };

    $scope.showKeys = function() {
      $scope.clearInfo();
      $scope.view = "keys";
      $scope.tab = "keys";
      $http.get("key")
      .success(function(response) {
        $scope.keyList = response;
      })
      .error(function(response) {
        $scope.keyList = $scope.keyList || [];
        $scope.error = "Could not refresh apikeys. Reason: " + response.errorMessage;
      });
    };

    $scope.showPlans = function() {
      $scope.clearInfo();
      $scope.view = "plans";
      $scope.tab = "plans";
      $http.get("plan")
      .success(function(response) {
        $scope.planMap = {};
        $scope.planList = response;
        for (var i = 0; i < $scope.planList.length; ++i) {
          $scope.planMap[$scope.planList[i].key] = $scope.planList[i].name;
        }
      })
      .error(function(response) {
      $scope.planMap = {};
        $scope.planList = $scope.planList || [];
        for (var i = 0; i < $scope.planList.length; ++i) {
          $scope.planMap[$scope.planList[i].key] = $scope.planList[i].name;
        }
        $scope.error = "Could not refresh plans. Reason: " + response.errorMessage;
      });
    };

    $scope.createNewKey = function(plan) {
      $scope.clearInfo();
      $http.post("key/" + plan)
      .success(function(response) {
        $scope.success = "New Api Key created: " + response.apikey;
      })
      .error(function(response) {
        $scope.error = "Could not create Api Key. Reason: " + response.errorMessage;
      });
    };

    $scope.deletePlan = function(plan) {
      $scope.clearInfo();
      $http.delete("plan/" + plan)
      .success(function() {
        $scope.success = "Deleted Plan: " + plan;
      })
      .error(function(response) {
        $scope.error = "Could not delete plan. Reason: " + response.errorMessage;
      });
    };

    $scope.disableKey = function(key) {
      $scope.clearInfo();
      $http.delete("key/" + key.key)
      .success(function(response) {
        key.active = false;
        $scope.success = "Api Key deactivated: " + response.key;
      })
      .error(function(response) {
        $scope.error = "Could not deactivate Api Key. Reason: " + response.errorMessage;
      });
    };

    $scope.showSelectPlan = function(key) {
      $scope.clearInfo();
      $scope.currentKey = key;
      $scope.view = "selectPlan";
      $http.get("plan")
      .success(function(response) {
        $scope.planMap = {};
        $scope.planList = response;
        for (var i = 0; i < $scope.planList.length; ++i) {
          $scope.planMap[$scope.planList[i].key] = $scope.planList[i].name;
        }
      })
      .error(function(response) {
        $scope.planMap = {};
        $scope.planList = $scope.planList || [];
        for (var i = 0; i < $scope.planList.length; ++i) {
          $scope.planMap[$scope.planList[i].key] = $scope.planList[i].name;
        }
        $scope.error = "Could not refresh plans. Reason: " + response.errorMessage;
      });
    };

    $scope.changePlan = function(key, plan) {
      $scope.clearInfo();
      $http.put("key/" + key + "/" + plan)
      .success(function(response) {
        $scope.success = "Changed plan for Api Key: " + response.key;
        $scope.showKeys();
      })
      .error(function(response) {
        $scope.error = "Could not change plan for Api Key. Reason: " + response.errorMessage;
      });
    };

    $scope.showDetails = function(plan) {
      $scope.clearInfo();
      $http.get("plan/" + plan)
      .success(function(response) {
        $scope.currentPlan = response;
        $scope.view = "planDetails";
      })
      .error(function(response) {
        $scope.error = "Could not load plan details. Reason: " + (response.errorMessage || response.error);
      });
    };

    $scope.addRow = function() {
      $scope.editPlan.buckets.push({});
    };

    $scope.removeRow = function(i) {
      $scope.editPlan.buckets.splice(i, 1);
    };

    $scope.showNewPlan = function() {
      $scope.clearInfo();
      $scope.editPlan = {
        name: "",
        buckets: []
      };
      $scope.view = "newPlan";
    };

    $scope.createNewPlan = function() {
      var plan = {
        name: $scope.editPlan.name
      };
      plan.refills = {};
      var tmp, t;
      var bu = $scope.editPlan.buckets;
      var list = ["hour", "day", "month"];
      var l;
      for (t = 0; t < bu.length; ++t) {
        tmp = {};
        for (l = 0; l < list.length; ++l) {
          if (bu[t].hasOwnProperty(list[l])) {
            tmp[list[l]] = bu[t][list[l]];
          }
        }
        plan.refills[bu[t].name] = tmp;
      }
      $http.post("plan", plan)
      .success(function(response) {
        $scope.success = "New Plan created: " + response.name;
        $scope.showPlans();
      })
      .error(function(response) {
        $scope.error = "Could not create Plan. Reason: " + response.errorMessage;
      });
    };

    $scope.showKeys();
  });

}());
