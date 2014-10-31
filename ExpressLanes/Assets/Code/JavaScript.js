
var now;

if (typeof (EXPRESSLANES) == "undefined") {
    EXPRESSLANES = {}
}

$(document).ready(function () {
    $("#btnUpdate").click(function () {
        EXPRESSLANES.Processor.ChangeDate();
    });
    EXPRESSLANES.Processor.Initialize(new Date());
});

//EXPRESSLANES.Model
(function (PUBLIC) { 

    var highway = function (name, dir1, dir2, imgUrl) {
        this.Name = name;
        this.ImageUrl = imgUrl;
        this.Direction1 = dir1;
        this.Direction2 = dir2;
        this.Schedule = null;
    };
    
    var timeRange = function (dir, start, end) {
        this.Direction = dir;
        this.Start = start;
        this.End = end;
    };

    var schedule = function (dayNum, dir1Range, dir2Range) {
        this.DayNum = dayNum;
        this.Dir1Range = dir1Range;
        this.Dir2Range = dir2Range;
    };

    var getI5Data = function () {
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

        var helper = EXPRESSLANES.Helper;

        var I5 = new highway("I5", "Northbound", "Southbound", "Assets/Images/I-5_200x200.png");
        I5.Northbound = I5.Direction1;
        I5.Southbound = I5.Direction2;

        var I5Schedule = [];
        I5Schedule[0] = new schedule(0, new timeRange(I5.Northbound, helper.GetToday("1:45 pm"), helper.GetToday("11:00 pm")), new timeRange(I5.Southbound, helper.GetToday("8:00 am"), helper.GetToday("1:30 pm")))
        I5Schedule[1] = new schedule(1, new timeRange(I5.Northbound, helper.GetToday("11:15 am"), helper.GetToday("11:00 pm")), new timeRange(I5.Southbound, helper.GetToday("5:00 am"), helper.GetToday("11:00 am")))
        I5Schedule[2] = I5Schedule[1]; I5Schedule[2].DayNum = 2;
        I5Schedule[3] = I5Schedule[1]; I5Schedule[3].DayNum = 3;
        I5Schedule[4] = I5Schedule[1]; I5Schedule[4].DayNum = 4;
        I5Schedule[5] = I5Schedule[1]; I5Schedule[5].DayNum = 5;
        I5Schedule[6] = I5Schedule[0]; I5Schedule[6].DayNum = 6;

        I5.Schedule = I5Schedule;

        return I5;
    };
    PUBLIC.GetI5Data = getI5Data;

    var getI90Data = function () {
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

        var helper = EXPRESSLANES.Helper;

        var I90 = new highway("I90", "Eastbound", "Westbound", "Assets/Images/I-90_200x200.png");
        I90.Eastbound = I90.Direction1;
        I90.Westbound = I90.Direction2;

        var I90Schedule = [];
        I90Schedule[0] = new schedule(0, new timeRange(I90.Eastbound, helper.GetToday("12:00 am"), helper.GetTomorrow("5:00 am")), null);
        I90Schedule[1] = new schedule(1, new timeRange(I90.Eastbound, helper.GetToday("2:00 pm"), helper.GetTomorrow("5:00 am")), new timeRange(I90.Westbound, helper.GetToday("6:00 am"), helper.GetToday("12:30 pm")));
        I90Schedule[2] = I90Schedule[1]; I90Schedule[2].DayNum = 2;
        I90Schedule[3] = I90Schedule[1]; I90Schedule[3].DayNum = 3;
        I90Schedule[4] = I90Schedule[1]; I90Schedule[4].DayNum = 4;
        I90Schedule[5] = new schedule(5, new timeRange(I90.Eastbound, helper.GetToday("2:00 pm"), helper.GetNextMonday("5:00 am")), new timeRange(I90.Westbound, helper.GetToday("6:00 am"), helper.GetToday("12:30 pm")));
        I90Schedule[6] = new schedule(6, new timeRange(I90.Eastbound, helper.GetToday("12:00 am"), helper.GetNextMonday("5:00 am")), null);

        I90.Schedule = I90Schedule;

        return I90;
    };
    PUBLIC.GetI90Data = getI90Data;

})(EXPRESSLANES.Model = EXPRESSLANES.Model || {});

//EXPRESSLANES.Processor
(function (PUBLIC) { 

    var initialize = function (datetime) {
        model = EXPRESSLANES.Model;
        controler = EXPRESSLANES.Controller;
        now = datetime;

        var I5 = model.GetI5Data();
        getLanes(I5, datetime);

        var I90 = model.GetI90Data();
        getLanes(I90, datetime);

        controler.SetDateTimeSelector(now);
    };
    PUBLIC.Initialize = initialize;

    var changeDate = function () {
        var datetime = new Date($("#dateTimeSelect")[0].value);
        datetime.setHours(datetime.getHours() + (datetime.getTimezoneOffset() / 60));
        initialize(datetime);
    };
    PUBLIC.ChangeDate = changeDate;

    var getLanes = function getLanes(hwy, datetime) {
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

        EXPRESSLANES.Controller.UpdatePage(hwy, direction, until);
    };


})(EXPRESSLANES.Processor = EXPRESSLANES.Processor || {});

//EXPRESSLANES.Controller
(function (PUBLIC) { 

    var updatePage = function (hwy, direction, until) {
        var helper = EXPRESSLANES.Helper;

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
            $spanUntilWhen.text(helper.FormatTime(until));
        }

        var $img = $("#" + hwy.Name + "_img");
        $img.attr("src", hwy.ImageUrl);
    };
    PUBLIC.UpdatePage = updatePage;

    var setDateTimeSelector = function (datetime) {
        var helper = EXPRESSLANES.Helper;

        var y = datetime.getFullYear();
        var mon = EXPRESSLANES.Helper.SetLeadingZero(datetime.getMonth() + 1);
        var d = EXPRESSLANES.Helper.SetLeadingZero(datetime.getDate());
        var h = EXPRESSLANES.Helper.SetLeadingZero(datetime.getHours());
        var min = EXPRESSLANES.Helper.SetLeadingZero(datetime.getMinutes());

        var newDateTime = y + "-" + mon + "-" + d + "T" + h + ":" + min;
        $("#dateTimeSelect")[0].value = newDateTime;
    }
    PUBLIC.SetDateTimeSelector = setDateTimeSelector;

})(EXPRESSLANES.Controller = EXPRESSLANES.Controller || {});

//EXPRESSLANES.Helper
(function (PUBLIC) { 
    //returns a time string formatted as hh:mm ampm on a 12-hour clock
    var formatTime = function (datetime) { 
        var h_24 = datetime.getHours();
        var h = datetime.getHours() % 12;
        if (h === 0) h = 12;
        var m = datetime.getMinutes();
        m = (m < 10 ? "0" + m : m);
        return (h < 10 ? h : h) + ":" + m + (h_24 < 12 ? ' am' : ' pm');
    };
    PUBLIC.FormatTime = formatTime;

    //returns a date object representing today at a specified time
    var getToday = function (time) { 
        if (!time) time = "12:00 am";
        var theDay = new Date(now.toDateString() + " " + time);
        return theDay;
    };
    PUBLIC.GetToday = getToday;

    //returns a date object representing tomorrow at a specified time
    var getTomorrow = function (time) { 
        if (!time) time = "12:00 am";

        var theDay = now;
        var ms = theDay.getTime() + 86400000;
        theDay = new Date(new Date(ms).toDateString() + " " + time);
        return theDay;
    };
    PUBLIC.GetTomorrow = getTomorrow;

    //returns a date object representing the following Monday at a specified time
    var getNextMonday = function (time) { 
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
    };
    PUBLIC.GetNextMonday = getNextMonday;

    //adds a leading zero to single-digit numbers
    var setLeadingZero = function (n) {
        return (!isNaN(n) && n < 10) ? "0" + n : n;
    };
    PUBLIC.SetLeadingZero = setLeadingZero;

})(EXPRESSLANES.Helper = EXPRESSLANES.Helper || {});
