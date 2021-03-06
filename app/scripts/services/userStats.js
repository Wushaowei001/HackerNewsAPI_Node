'use strict';
angular.module('hnlyticsApp')
.service('UserStatsService', function($firebase, $timeout, $http, getSubsService, $q, $rootScope){
	var average, 
	thisYearsSubs, 
	lastYearsSubs, 
	thisMonthsSubs, 
	lastMonthsSubs, 
	thisWeeksSubs,
	lastWeeksSubs,
	thisYearsTot,
	lastYearsTot,
	thisMonthsTot,
	lastMonthsTot,
	thisWeeksTot,
	lastWeeksTot,
	yearsDiff,
	monthsDiff,
	weeksDiff,
	averageTimes,
	timesOfTheDay;
	

	var matchesYear = function(obj, year){
		return year === obj;
	};
	var matchesMonth = function(obj, month){
		return month === obj;
	};
	var matchesWeek = function(obj, week){
		return week === obj;
	};

	var getUserData = function(user, cb){
		var ref = new Firebase('https://hacker-news.firebaseio.com/v0/');
		var items = ref.child('item');
		var userRef = ref.child('user').child(user);
		var userSync = $firebase(userRef);
		var userObj = userSync.$asObject();
		getSubsService.subs(user).then(function(data){
			var stories = data[1];
			var comments = data[2];
			var submissions = data[0];
			// AVERAGE POINTS PER POST
			average = Math.round((function(){
				var totalPts = 0;
				for (var i = 0; i < submissions.length; i++) {
					if(submissions[i].score){
						totalPts += submissions[i].score;
					} else if (submissions[i].kids){
						totalPts += submissions[i].kids.length;
					}
				}
				return totalPts/submissions.length;
			})());


			var lastPost = stories[0]

			var lastPostCommentDates = function(cb){
				var results = []
				function recurse(kids){
					for(var i = 0; i < kids.length ; i++){
						if(results.length < 1000){
						$http({
							method: "GET",
							url: "https://hacker-news.firebaseio.com/v0/item/"+ lastPost.kids[i] + ".json"
						}).then(function(data){
							results.push(data.data.time);
							if(data.data.kids && data.data.kids.length > 0){
								recurse(data.data.kids);
							}
							return;
						});
						}

					}
				};
				recurse(lastPost.kids);
				cb(results);
			}
			
			var sortedComments = lastPostCommentDates(function(results){
				var byDay = {}
				for (var i = 0; i < results.length; i++) {
					var date = new Date(results[i]*1000);
					var day = date.getDay();
					if(byDay[day]){
						byDay[day]++;
					} else {
						byDay[day] = 1;
					}
				};
				console.log(byDay)
				return byDay
			});

			// POST FREQUENCY BY TIME
			timesOfTheDay = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
			var averageTimes = submissions
			  .map(function(sub) {
			  	var subTime = new Date(sub.time*1000);
			    return subTime.getHours();
			  })
			  .reduce(function(last, now) {
			    var index = last[0].indexOf(now);
			    if (index === -1) {
			      last[0].push(now);
			      last[1].push(1);
			    } else {
			      last[1][index] += 1;
			    }
			    return last;
			  }, [[], []])
			  .reduce(function(last, now, index, context) {
			    var zip = [];
			    last.forEach(function(word, i) {
			      zip.push([word, context[1][i]]);
			    });
			    return zip;
			  });

			for (var i = 0; i < averageTimes.length; i++) {
			  	timesOfTheDay[averageTimes[i][0]]= averageTimes[i][1];
			};


			// SUBMISSIONS BY YEAR
			thisYearsSubs = _.filter(submissions, function(obj){
				var now = new Date();
				var year = now.getFullYear();
				var objDate = new Date(obj.time*1000)
				var objYear = objDate.getFullYear()
				return matchesYear(objYear, year);
			});
			lastYearsSubs = _.filter(submissions, function(obj){
				var now = new Date();
				var year = now.getFullYear()-1;
				var objDate = new Date(obj.time*1000)
				var objYear = objDate.getFullYear()
				return matchesYear(objYear, year);
			});

			// SUBMISSIONS BY MONTH
			thisMonthsSubs = _.filter(submissions, function(obj){
				var now = new Date();
				var month = now.getMonth();
				var objDate = new Date(obj.time*1000)
				var objMonths = objDate.getMonth()
				return matchesMonth(objMonths, month);
			});
			lastMonthsSubs = _.filter(submissions, function(obj){
				var now = new Date();
				var month = now.getMonth()-1;
				var objDate = new Date(obj.time*1000)
				var objMonths = objDate.getMonth()
				return matchesMonth(objMonths, month);
			});

			// SUBMISSIONS BY WEEK
			thisWeeksSubs = _.filter(submissions, function(obj){
				var now = new Date();
				var week = now.getWeek();
				var objDate = new Date(obj.time)
				var objWeek = objDate.getWeek()
				return matchesWeek(objWeek, week);
			});
			lastWeeksSubs = _.filter(submissions, function(obj){
				var now = new Date();
				var week = now.getWeek()-1;
				var objDate = new Date(obj.time)
				var objWeek = objDate.getWeek()
				return matchesWeek(objWeek, week);
			});

			// TOTAL SUBMISSIONS BY PERIOD
			thisYearsTot = thisYearsSubs.length;
			lastYearsTot = lastYearsSubs.length;
			thisMonthsTot = thisMonthsSubs.length;
			lastMonthsTot = lastMonthsSubs.length;
			thisWeeksTot = thisWeeksSubs.length;
			lastWeeksTot = lastWeeksSubs.length;

			// DIFFERENCE PERCENTAGES BY PERIOD
			yearsDiff = thisYearsTot - lastWeeksTot / lastWeeksTot;
			monthsDiff = thisMonthsTot - lastMonthsTot / lastMonthsTot;
			weeksDiff =	thisWeeksTot - lastWeeksTot / lastWeeksTot;
			
			cb({average: average,
			comments: comments,
			stories: stories,
			lastPost: lastPost,
			lastPostComments: sortedComments, 
			thisYearsTot: thisYearsTot,
			lastYearsTot: lastYearsTot,
			thisMonthsTot: thisMonthsTot,
			lastMonthsTot: lastMonthsTot,
			thisWeeksTot: thisWeeksTot,
			lastWeeksTot: lastWeeksTot,
			yearsDiff: yearsDiff,
			monthsDiff: monthsDiff,
			weeksDiff: weeksDiff,
			timesOfTheDay: timesOfTheDay});
		});
	}
	return {
		results: function(user, scope){
			var deferred = $q.defer(); 
			getUserData(user, function(data){
				$timeout(function() {
					$rootScope.$apply(function(){
		        		deferred.resolve(data);
		       		});
				});
			});
			return deferred.promise;
		}
	};
});


// APPEND GET WEEK METHOD TO THE PROTOTYPE

Date.prototype.getWeek = function (dowOffset) {
	/*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

	    dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero
	    var newYear = new Date(this.getFullYear(),0,1);
	    var day = newYear.getDay() - dowOffset; //the day of week the year begins on
	    day = (day >= 0 ? day : day + 7);
	    var daynum = Math.floor((this.getTime() - newYear.getTime() - 
	    (this.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
	    var weeknum;
	    //if the year starts before the middle of a week
	    if(day < 4) {
	        weeknum = Math.floor((daynum+day-1)/7) + 1;
	        if(weeknum > 52) {
	            nYear = new Date(this.getFullYear() + 1,0,1);
	            nday = nYear.getDay() - dowOffset;
	            nday = nday >= 0 ? nday : nday + 7;
	            /*if the next year starts before the middle of
	              the week, it is week #1 of that year*/
	            weeknum = nday < 4 ? 1 : 53;
	        }
	    }
	    else {
	        weeknum = Math.floor((daynum+day-1)/7);
	    }
	    return weeknum;
	};