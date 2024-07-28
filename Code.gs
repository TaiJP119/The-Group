var fileId = '1h5PR62-ahwThjcykxVsZcfvKxDLE7NRCgGz20rEMysU'; // Extract the file ID from the URL
var ss = SpreadsheetApp.openById(fileId);
var ws = ss.getSheetByName("Employee");

function doGet(e) {
  // Safely get the 'v' parameter or default to 'Login'
  var page = (e && e.parameter && e.parameter.v) ? e.parameter.v : 'Login';

  if (page == 'Index') {
    return loadIndex();
  } else if (page == 'attendanceform') {
    return loadAttendanceForm();
  } else {
    var template = HtmlService.createTemplateFromFile('Login');
    template.message = ''; // Ensure message is initialized
    return template.evaluate();
  }
}

function doPost(e) {
  var userData = ws.getDataRange().getValues();
  var isAuthenticated = false;
  var userRole = '';
  Logger.log(e);
  // Handle logout
  if (e.parameter.LogoutButton == 'Logout') {
    Logger.log("User is Logged Out");
    var template = HtmlService.createTemplateFromFile('Login');
    template.message = 'Logged out successfully';
    return template.evaluate();
  }

  // Check if it's admin
  if (e.parameter.email === 'admin@gmail.com' && e.parameter.password === 'password123') {
    return HtmlService.createHtmlOutputFromFile('HRHome');
  }

  // Check user credentials
  for (var i = 0; i < userData.length; i++) {
    if (userData[i][2] === e.parameter.email && userData[i][9] === e.parameter.password) {
      isAuthenticated = true;
      userRole = userData[i][5];
      break;
    }
  }

  // Handle authentication
  if (isAuthenticated) {
    //return HtmlService.createHtmlOutputFromFile('Index');

    var employeeInfo = searchEmployeeInfo(e.parameter.email);
    var template;

    if (userRole === 'HR') {
      template = HtmlService.createTemplateFromFile('HRHome');
    } else {
      template = HtmlService.createTemplateFromFile('EmployeeHome');
    }
    // Create and return the home.html template with employee data
    // var template = HtmlService.createTemplateFromFile('Home');
    template.employee = employeeInfo;
    return template.evaluate();
  } else {
    var template = HtmlService.createTemplateFromFile('Login');
    template.message = 'E-mail or password wrong'; // Ensure this line is present
    return template.evaluate();
  }
}

// function doLogout() {
//   var template = HtmlService.createTemplateFromFile('Login');
//   template.message = 'Logged out successfully';
//   return template.evaluate();
// }

function loadIndex() {
  return HtmlService.createHtmlOutputFromFile('Index');
}

function loadAttendanceForm() {
  return HtmlService.createHtmlOutputFromFile('attendanceform').getContent();
}

function loadDisplay() {
  return HtmlService.createHtmlOutputFromFile('Display').getContent();
}

function loadInterviewForm() {
  return HtmlService.createHtmlOutputFromFile('interviewscheduling').getContent();
}

function loadAnalyticsPage() {
  return HtmlService.createHtmlOutputFromFile('analytics').getContent();
}

function getUrl() {
  var url = ScriptApp.getService().getUrl();
  Logger.log('Base URL: ' + url); // Log the base URL for debugging
  return url;
}


function addEmployee(employee) {
  try {
    if (!ws) {
      return 'Sheet "Employee" not found';
    }

    var currentDate = new Date();
    ws.appendRow([
      employee.employeeID,
      employee.name,
      employee.email,
      employee.phonenumber,
      employee.age,
      employee.role,
      employee.salary,
      employee.benefits,
      employee.performance,
      employee.password,
      currentDate
    ]);

    return 'Employee data added successfully!';
  } catch (e) {
    Logger.log('Error: ' + e.message);
    return 'Error: ' + e.message;
  }
}

/**
function getEmployees() {
  try {
    if (!ws) {
      return 'Sheet "Employee" not found';
    }

    var data = ws.getDataRange().getValues();
    return data.slice(1); // Remove header row
  } catch (e) {
    Logger.log('Error: ' + e.message);
    return 'Error: ' + e.message;
  }
}
 */

function searchEmployeeInfo(email) {
  try {
    var employeeData = ws.getDataRange().getValues();
    for (var i = 0; i < employeeData.length; i++) {
      if (employeeData[i][2] === email) { // Assuming the email is in the second column
        return {
          employeeID: employeeData[i][0],
          name: employeeData[i][1],
          email: employeeData[i][2],
          phonenumber: employeeData[i][3],
          age: employeeData[i][4],
          role: employeeData[i][5],
          salary: employeeData[i][6],
          benefits: employeeData[i][7],
          performance: employeeData[i][8],
          date: employeeData[i][10]
        }; // Return the matching row as an object
      }
    }
    return 'No employee info found for the given email';
  } catch (e) {
    Logger.log('Error: ' + e.message);
    return 'Error: ' + e.message;
  }
}

function createSendEmailTrigger() {
  ScriptApp.newTrigger("sendEmail")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
}

function createOnFormSubmitTrigger() {
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
}

// Function to setup both triggers
function setupTriggers() {
  createSendEmailTrigger();
  createOnFormSubmitTrigger();
}

function scheduleInterview(form) {
  Logger.log('Form data: ' + JSON.stringify(form));
  var sheet = ss.getSheetByName("Interview");

  var candidateName = form.candidateName;
  var candidateEmail = form.candidateEmail;
  var position = form.position;
  var interviewer = form.interviewer;
  var date = form.date;
  var time = form.time;

  // Find the last row with data
  var lastRow = sheet.getLastRow();

  // Add a new row for Clock In
  sheet.appendRow([candidateName, candidateEmail, position, interviewer, date, time]);
  Logger.log('Added to Excel');

  var calendar = getOrCreateCalendar('Interviews');
  var startTime = new Date(date + ' ' + time);
  // Assume interviews are 1 hour long
  var endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  var event = calendar.createEvent(form.candidateName + ' Interview', startTime, endTime, {
    description: `Interview with ${form.candidateName}\nPosition: ${form.position}\nInterviewer: ${form.interviewer}`
  });
  // Send email to the candidate if sendEmail is true
  if (form.sendEmail) {
    sendInterviewEmail(form);
  }

  return 'Interview scheduled successfully!';
}

function sendInterviewEmail(form) {
  var emailBody = `Hi ${form.candidateName},
  
  Congratulations! Your interview for the position of ${form.position} has been scheduled by our company.
  
  Interview Details:
  Date: ${form.date}
  Time: ${form.time}
  Interviewer: ${form.interviewer}

  Please be available at the scheduled time.Thank You.

  Best regards,
  The Group Company
  `;

  MailApp.sendEmail({
    to: form.candidateEmail,
    subject: 'Interview Scheduled For The Group Company',
    body: emailBody
  });
}

function getMetrics() {
  var employeeSheet = ss.getSheetByName("Employee");
  var attendanceSheet = ss.getSheetByName("Attendance");

  if (!employeeSheet || !attendanceSheet) {
    throw new Error('Employee or Attendance sheet not found');
  }

  var totalEmployees = employeeSheet.getLastRow() - 1; // Assuming first row is the header
  var attendanceData = attendanceSheet.getDataRange().getDisplayValues();
  var presentCount = 0;
  var currentDate = new Date();
  var currentDateString = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  Logger.log("Date= " + currentDateString);

  for (var i = 1; i < attendanceData.length; i++) {
    var storedTime = attendanceData[i][2]
    Logger.log(i + ": " + storedTime);
    if (storedTime == currentDateString) {
      presentCount++;
    }
  }

  return {
    totalEmployees: totalEmployees,
    present: presentCount,
    absent: totalEmployees - presentCount
  };
}

// function goToHRHome() {
//   return HtmlService.createHtmlOutputFromFile('HRHome').getContent();
// }