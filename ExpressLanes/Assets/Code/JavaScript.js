
var now;

$(document).ready(function () {
    $("#btnUpdate").click(function () {
        EXPRESSLANES.Controller.changeDate();
    });
    EXPRESSLANES.Controller.initialize(new Date());
});

var EXPRESSLANES = EXPRESSLANES || { //};

    Model: {
        //Define Objects
        Highway: function (name, dir1, dir2, imgUrl) {
            this.Name = name;
            this.ImageUrl = imgUrl;
            this.Direction1 = dir1;
            this.Direction2 = dir2;
            this.Schedule = null;
        },

        TimeRange: function (dir, start, end) {
            this.Direction = dir;
            this.Start = start;
            this.End = end;
        },

        Schedule: function (dayNum, dir1Range, dir2Range) {
            this.DayNum = dayNum;
            this.Dir1Range = dir1Range;
            this.Dir2Range = dir2Range;
        },

        //Assign data
        getI5Data: function () {
            /*
            I-5 Express Lane Schedule
                Monday-Friday 
                Southbound - 5 a.m. to 11:00 a.m. 
                Northbound - 11:15 a.m. to 11 p.m. 
                Closed: 11:00 p.m. - 5 a.m.
                Saturday & Sunday 
                Southbound - 8 a.m. to 1:30 p.m.
                Northbound - 1:45 p.m. to 11 p.m.
                Closed: 11:00 p.m. - 8 a.m.
            */

            var I5 = new EXPRESSLANES.Model.Highway("I5", "Northbound", "Southbound", "Assets/Images/I-5_200x200.png");
            I5.Northbound = I5.Direction1;
            I5.Southbound = I5.Direction2;

            var I5Schedule = [];
            I5Schedule[0] = new EXPRESSLANES.Model.Schedule(0, new EXPRESSLANES.Model.TimeRange(I5.Northbound, getToday("1:45 pm"), getToday("11:00 pm")), new EXPRESSLANES.Model.TimeRange(I5.Southbound, getToday("8:00 am"), getToday("1:30 pm")))
            I5Schedule[1] = new EXPRESSLANES.Model.Schedule(1, new EXPRESSLANES.Model.TimeRange(I5.Northbound, getToday("11:15 am"), getToday("11:00 pm")), new EXPRESSLANES.Model.TimeRange(I5.Southbound, getToday("5:00 am"), getToday("11:00 am")))
            I5Schedule[2] = I5Schedule[1]; I5Schedule[2].DayNum = 2;
            I5Schedule[3] = I5Schedule[1]; I5Schedule[3].DayNum = 3;
            I5Schedule[4] = I5Schedule[1]; I5Schedule[4].DayNum = 4;
            I5Schedule[5] = I5Schedule[1]; I5Schedule[5].DayNum = 5;
            I5Schedule[6] = I5Schedule[0]; I5Schedule[6].DayNum = 6;

            I5.Schedule = I5Schedule;

            return I5;
        },

        getI90Data: function () {
            /*
            I-90 Express Lane Schedule
                Monday-Thursday
                Westbound - 6 a.m. to 12:30 p.m.
                Eastbound - 2 p.m. to 5 a.m.
                Friday
                Westbound - 6 a.m. to 12:30 p.m.
                Eastbound - 2 p.m. to 5 a.m. Monday morning 
                Saturday & Sunday
                Eastbound all weekend beginning at 2 p.m. Friday to 5 a.m. Monday morning
            */

            var I90 = new EXPRESSLANES.Model.Highway("I90", "Eastbound", "Westbound", "Assets/Images/I-90_200x200.png");
            I90.Eastbound = I90.Direction1;
            I90.Westbound = I90.Direction2;

            var I90Schedule = [];
            I90Schedule[0] = new EXPRESSLANES.Model.Schedule(0, new EXPRESSLANES.Model.TimeRange(I90.Eastbound, getToday("12:00 am"), getTomorrow("5:00 am")), null);
            I90Schedule[1] = new EXPRESSLANES.Model.Schedule(1, new EXPRESSLANES.Model.TimeRange(I90.Eastbound, getToday("2:00 pm"), getTomorrow("5:00 am")), new EXPRESSLANES.Model.TimeRange(I90.Westbound, getToday("6:00 am"), getToday("12:30 pm")));
            I90Schedule[2] = I90Schedule[1]; I90Schedule[2].DayNum = 2;
            I90Schedule[3] = I90Schedule[1]; I90Schedule[3].DayNum = 3;
            I90Schedule[4] = I90Schedule[1]; I90Schedule[4].DayNum = 4;
            I90Schedule[5] = new EXPRESSLANES.Model.Schedule(5, new EXPRESSLANES.Model.TimeRange(I90.Eastbound, getToday("2:00 pm"), getNextMonday("5:00 am")), new EXPRESSLANES.Model.TimeRange(I90.Westbound, getToday("6:00 am"), getToday("12:30 pm")));
            I90Schedule[6] = new EXPRESSLANES.Model.Schedule(6, new EXPRESSLANES.Model.TimeRange(I90.Eastbound, getToday("12:00 am"), getNextMonday("5:00 am")), null);

            I90.Schedule = I90Schedule;

            return I90;
        }
    },

    Controller: {
        //Process logic
        initialize: function (datetime) {
            now = datetime;
            setDateTimeSelector(now);

            var I5 = EXPRESSLANES.Model.getI5Data();
            this.getLanes(I5, datetime);

            var I90 = EXPRESSLANES.Model.getI90Data();
            this.getLanes(I90, datetime);
        },

        changeDate: function () {
            var datetime = new Date($("#dateTimeSelect")[0].value);
            datetime.setHours(datetime.getHours() + (datetime.getTimezoneOffset() / 60));
            this.initialize(datetime);
        },

        getLanes: function getLanes(hwy, datetime) {
            var direction, until;

            schedule = hwy.Schedule[datetime.getDay()];

            if (schedule.Dir1Range && (datetime > schedule.Dir1Range.Start && datetime < schedule.Dir1Range.End)) {
                direction = schedule.Dir1Range.Direction;
                until = schedule.Dir1Range.End;
            }
            else if (schedule.Dir2Range && (datetime > schedule.Dir2Range.Start && datetime < schedule.Dir2Range.End)) {
                direction = schedule.Dir2Range.Direction;
                until = schedule.Dir2Range.End;
            }
            else {
                direction = null;
            }

            updatePage(hwy, direction, until);
        },
    
        //PUBLIC.Initialize = initialize,
        //PUBLIC.ChangeDate = initialize
    }
};

//UI updates
function updatePage(hwy, direction, until) {
    var $spanDirection = $("#" + hwy.Name + "_direction");
    $spanDirection.text((!direction) ? "Closed" : direction);
    $spanDirection.addClass((!direction) ? "closed" : "open");

    var $spanUntil = $("#" + hwy.Name + "_until");
    var $spanUntilWhen = $("#" + hwy.Name + "_untilWhen");
    if (!direction) {
        $spanUntil.css("visibility", "hidden");
    }
    else {
        $spanUntil.css("visibility", "visible");
        $spanUntilWhen.text(fomatTime(until));
    }

    var $img = $("#" + hwy.Name + "_img");
    $img.attr("src", hwy.ImageUrl);
}

function setDateTimeSelector(datetime) {
    var y = datetime.getFullYear();
    var mon = setLeadingZero(datetime.getMonth() + 1);
    var d = setLeadingZero(datetime.getDate());
    var h = setLeadingZero(datetime.getHours());
    var min = setLeadingZero(datetime.getMinutes());

    var newDateTime = y + "-" + mon + "-" + d + "T" + h + ":" + min;
    $("#dateTimeSelect")[0].value = newDateTime;
}

//Helpers
function fomatTime(datetime) { //returns a time string formatted as hh:mm ampm on a 12-hour clock
    var h_24 = datetime.getHours();
    var h = datetime.getHours() % 12;
    if (h === 0) h = 12;
    var m = datetime.getMinutes();
    m = (m < 10 ? "0" + m : m);
    return (h < 10 ? h : h) + ":" + m + (h_24 < 12 ? ' am' : ' pm');
}

function getToday(time) { //returns a date object representing today at a specified time
    if (!time) time = "12:00 am";
    var theDay = new Date(now.toDateString() + " " + time);
    return theDay;
}

function getTomorrow(time) { //returns a date object representing tomorrow at a specified time
    if (!time) time = "12:00 am";

    var theDay = now;
    var ms = theDay.getTime() + 86400000;
    theDay = new Date(new Date(ms).toDateString() + " " + time);
    return theDay;
}

function getNextMonday(time) { //returns a date object representing the following Monday at a specified time
    if (!time) time = "12:00 am";

    theDay = new Date();
    var monday = 1;
    var safe = 6; //loop breaker
    var safeCheck = 0;
    while (theDay.getDay() != monday && safeCheck < safe) {
        var ms = theDay.getTime() + 86400000;
        theDay = new Date(ms);
        safeCheck++;
    }
    theDay = new Date(theDay.toDateString() + " " + time);
    return theDay;
}

function setLeadingZero(n) { //adds a leading zero to single-digit numbers
    return (!isNaN(n) && n < 10) ? "0" + n : n;
}

