(function () {
    var app = angular.module("ExpressLanes", []);

    app.controller("HighwayController", ['$scope', '$http', function ($scope, $http) {
        $scope.highways = null;
        var now = new Date();
        $scope.now = new Date(now.getFullYear(), now.getMonth(), now.getDay(), now.getHours(), now.getMinutes());


        $http.get("Assets/Data/HighwayData.json").success(function (data) {
            $scope.highways = data;
            $scope.update();
        });

        $scope.update = function () {
            for (x = 0; x < $scope.highways.length; x++) {
                $scope.getExpressLanes($scope.highways[x], $scope.now);
            }
        };

        $scope.getExpressLanes = function getExpressLanes(hwy, datetime) {
            schedule = hwy.Schedule[datetime.getDay()];
            var dtStart1 = $scope.parseScheduleDay(schedule.Direction1.Start, datetime);
            var dtEnd1 = $scope.parseScheduleDay(schedule.Direction1.End, datetime);
            var dtStart2 = $scope.parseScheduleDay(schedule.Direction2.Start, datetime);
            var dtEnd2 = $scope.parseScheduleDay(schedule.Direction2.End, datetime);

            //During direction 1
            if (dtStart1 && dtEnd1 && (datetime > dtStart1 && datetime < dtEnd1)) {
                hwy.Status.Direction = schedule.Direction1.Description;
                hwy.Status.Until = $scope.formatTime(schedule.Direction1.End);
            }
                //During direction 2
            else if (dtStart2 && dtEnd2 && (datetime > dtStart2 && datetime < dtEnd2)) {
                hwy.Status.Direction = schedule.Direction2.Description;
                hwy.Status.Until = $scope.formatTime(schedule.Direction2.End);
            }
                //Closed
            else {
                hwy.Status.Direction = "Closed";
                hwy.Status.Until = $scope.getNextOpen(schedule, datetime);
            }
        };

        $scope.getNextOpen = function (schedule, datetime) {
            var until = null;
            var strStart1 = schedule.Direction1.Start;
            var strStart2 = schedule.Direction2.Start;
            var dtStart1 = $scope.parseScheduleDay(strStart1, datetime);
            var dtStart2 = $scope.parseScheduleDay(strStart2, datetime);
            var starts = [dtStart1, dtStart2].sort();

            //Figure out when it opens again
            if ($scope.now > starts[0] && $scope.now > starts[1]) {
                var tomorrowIndex = datetime.getDay() + 1;
                if (tomorrowIndex > 6) tomorrowIndex = 0;
                schedule = hwy.Schedule[tomorrowIndex];
                var strStart1 = schedule.Direction1.Start.replace("Today", "Tomorrow");
                var strStart2 = schedule.Direction2.Start.replace("Today", "Tomorrow");
                dtStart1 = $scope.parseScheduleDay(strStart1, datetime);
                dtStart2 = $scope.parseScheduleDay(strStart2, datetime);
                until = (dtStart1 < dtStart2) ? dtStart1 : dtStart2;
            } else if ($scope.now < starts[0] && $scope.now < starts[1]) {
                until = starts[0];
            } else if ($scope.now > starts[0] && $scope.now < starts[1]) {
                until = starts[1];
            } else if ($scope.now < starts[0] && $scope.now > starts[1]) {
                until = starts[0];
            }

            //Add the direction when it opens again
            var direction = (until == dtStart1) ? schedule.Direction1.Description : schedule.Direction2.Description;

            return $scope.formatTime((until == dtStart1) ? strStart1 : strStart2) + " (" + direction + ")"
        }

        //returns a time string formatted as hh:mm ampm on a 12-hour clock
        $scope.formatTime = function (dayTimeString) {
            var daytime = $scope.splitDayTimeString(dayTimeString);
            var day = daytime[0];
            var time = daytime[1].replace(" ", "");
            return time + " " + day;
        };

        $scope.splitDayTimeString = function (dayTimeString) {
            //TODO: update to regex validation: (Today|Tomorrow|Monday@hh:mm am|pm)
            if (dayTimeString && dayTimeString.indexOf("@") > 0) {
                return dayTimeString.split("@");
            }
            else {
                return null;
            }
        };

        $scope.parseScheduleDay = function (dayTimeString, now) {
            var daytime = $scope.splitDayTimeString(dayTimeString);
            var properDateTime = null;

            if (daytime) {
                var day = daytime[0];
                var time = daytime[1];
                var datetime = null;
                var msInOneDay = 86400000;

                switch (day) {
                    case "Today":
                        datetime = new Date(now.toDateString() + " " + time);
                        break;
                    case "Tomorrow":
                        var tomorrow = now.getTime() + msInOneDay;
                        datetime = new Date(new Date(tomorrow).toDateString() + " " + time);
                        break;
                    case "Monday":
                        var theDay = new Date();
                        var monday = 1;
                        var safeCheck = 0;
                        while (theDay.getDay() != monday) {
                            var ms = theDay.getTime() + msInOneDay;
                            theDay = new Date(ms);
                        }
                        datetime = new Date(theDay.toDateString() + " " + time);
                        break;
                    default:
                        console.log("Bad schedule format: '" + daytime[0] + "'.");
                }

                var properDateTime = datetime;
                if (properDateTime == "Invalid Date") {
                    console.log("Bad schedule format: '" + dayTimeString + "'.");
                }
                else {
                    return properDateTime;
                }
            }
        };
    }])
    .directive("highway", function () {
        return {
            restrict: "E",
            templateUrl: "Assets/Templates/Highway.html"
        };
    });
})();

