var fileId = '1h5PR62-ahwThjcykxVsZcfvKxDLE7NRCgGz20rEMysU'; // Replace with your actual file ID
var ss = SpreadsheetApp.openById(fileId);
var sheet = ss.getSheetByName("Attendance");

function handleFormSubmit(form) {
  // Ensure sheet is defined correctly
  Logger.log('Form data: ' + JSON.stringify(form));

  var employeeID = form.employeeID;
  var name = form.name;
  var clockInOut = form.clockInOut;
  var currentDate = new Date();
  var currentDateString = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var currentTimeString = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'HH:mm:ss');
  Logger.log('ClockInOut: ' + clockInOut + ', CurrentDate: ' + currentDateString + ', CurrentTime: ' + currentTimeString);

  // Find the last row with data
  var lastRow = sheet.getLastRow();

  if (clockInOut === 'Clock In') {
    // Add a new row for Clock In
    sheet.appendRow([employeeID, name, currentDateString, currentTimeString, '', '']);
    Logger.log('Clock In recorded for ' + employeeID);
    return 'Successfully Clock In';
  } else if (clockInOut === 'Clock Out') {
    var found = false;
    var totalHours = 0;
    // Find the last Clock In entry for the employee and update it with Clock Out time
    for (var i = lastRow; i > 1; i--) {
      var row = sheet.getRange(i, 1, 1, 6).getDisplayValues()[0];
      Logger.log('Row data: ' + row);
      var storedID = row[0];
      var storedDate = row[2];
      var storedTime = row[3];

      Logger.log('Row0 = ' + storedID + ' employeeID = ' + employeeID);
      Logger.log('storedDate = ' + storedDate + ' currentDateString = ' + currentDateString);
      Logger.log('storedTime = ' + storedTime);

      if (storedID == employeeID && storedDate == currentDateString && row[4] == '') {
        var clockInTime = new Date(currentDateString + ' ' + storedTime);
        Logger.log('clockInTime: ' + clockInTime);
        var clockOutTime = new Date(currentDateString + ' ' + currentTimeString);
        Logger.log('clockOutTime: ' + clockOutTime);
        totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60); // Convert milliseconds to hours
        Logger.log('Total hours worked: ' + totalHours.toFixed(2));


        sheet.getRange(i, 5).setValue(currentTimeString);
        sheet.getRange(i, 6).setValue(totalHours.toFixed(2));
        Logger.log('Clock Out recorded for ' + employeeID + '. Total Hours: ' + totalHours.toFixed(2));
        found = true;
        // Call function to add to Google Calendar
        addEventToCalendar(employeeID, name, clockInOut, clockInTime, clockOutTime, totalHours);
        break;
      }
    }
    if (!found) {
      Logger.log('No matching Clock In entry found for ' + employeeID);
    }
    return 'Successfully Clock Out';
  }
  return 'Success';
}

// Function to add attendance event to Google Calendar
function addEventToCalendar(employeeID, name, clockInOut, clockInTime, clockOutTime, totalHours) {
  var calendarname = 'Working Attendance';
  var calendar = getOrCreateCalendar(calendarname);

  var startTime = clockInTime;
  var endTime = clockOutTime;
  Logger.log('clockInTime: ' + clockInTime);
  Logger.log('clockOutTime: ' + clockOutTime);
  if (clockInOut == 'Clock Out') {
    var title = `Present: ${name}`;
    calendar.createEvent(title, startTime, endTime, {
      description: `Employee ID: ${employeeID}\nName: ${name}\nTotal Hours: ${totalHours.toFixed(2)}`
    });
  }
}


function getOrCreateCalendar(name) {
  var calendars = CalendarApp.getCalendarsByName(name);
  if (calendars.length > 0) {
    return calendars[0];
  } else {
    return CalendarApp.createCalendar(name);
  }
}

function getCalendarEmbedUrl() {
  var calendarName = 'Working Attendance';
  var calendars = CalendarApp.getCalendarsByName(calendarName);
  if (calendars.length > 0) {
    var calendarId = calendars[0].getId();
    var embedUrl = "https://calendar.google.com/calendar/embed?src=" + encodeURIComponent(calendarId);
    Logger.log(embedUrl);
    return embedUrl;
  } else {
    return '';
  }
}

