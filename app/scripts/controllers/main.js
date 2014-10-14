'use strict';

/**
 * @ngdoc function
 * @name hnlyticsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the hnlyticsApp
 */
angular.module('hnlyticsApp')
  .controller('MainCtrl', function ($scope, $firebase, $sce, UserStatsService) {
  	var ref = new Firebase('https://hacker-news.firebaseio.com/v0/');
  	var items = ref.child('item');
	var userRef = ref.child('user').child('pg');
	var userSync = $firebase(userRef);
	var userObj = userSync.$asObject();
	var timesOfTheDay = UserStatsService.timesOfTheDay;
	$scope.thisWeeksTot = UserStatsService.thisWeeksTot;
	$scope.lastWeeksTot = UserStatsService.lastWeeksTot;
	$scope.thisMonthsTot = UserStatsService.thisMonthsTot;
	$scope.lastMonthsTot = UserStatsService.lastMonthsTot;
	$scope.thisYearsTot = UserStatsService.thisYearsTot;
	$scope.lastYearsTot = UserStatsService.lastYearsTot;

	console.log(timesOfTheDay)
    $scope.chart = {
	    labels : ["midnight", "1am", "2am", "3am", "4am", "5am", "6am","7am", "8am", "9am", "10am", "11am", "Noon", "1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm"],
	    datasets : [
	        {
	            fillColor : "rgba(151,187,205,0)",
	            strokeColor : "#e67e22",
	            pointColor : "rgba(151,187,205,0)",
	            pointStrokeColor : "#e67e22",
	            data : timesOfTheDay
	        }
	    ], 
	};
	$scope.averageScore = UserStatsService.average
	userObj.$loaded().then(function() {
		var created = new Date(userObj.created*1000);
		$scope.karma = userObj.karma;
		$scope.createdAt = created.getMonth().toString()+ '/' + created.getFullYear().toString();
		$scope.about = userObj.about;
		$scope.submitted = userObj.submitted;

		var latestRef = items.child(userObj.submitted[0]);
		var latestSync = $firebase(latestRef);
		var latestObj = latestSync.$asObject();
		latestObj.$loaded().then(function(){
			console.log(latestObj);
			$scope.latestPost = _.unescape(latestObj.text);
			var parent = $firebase(items.child(latestObj.parent)).$asObject();
			parent.$loaded().then(function(){
				console.log(parent, 'parent');
				$scope.latestParent = _.unescape(parent.text);
				// if is a comment, recursively find the parent story through the parents chain
			});
		});
	});
  });
