function sendEmail(e) {
  // Get the form responses
  var responses = e.values;
  
  // Extract individual responses if necessary
  var timestamp = responses[0];
  var email = responses[1];  // Assuming email is in the second column
  var name = responses[2];
  var reasonsForLeave = responses[3]; 
  var typeOfLeave = responses[4];  
  var fromDate = responses[5];  
  var toDate = responses[6];  
 
  
  // Generate a unique ID for the leave request
  var leaveRequestId = Utilities.getUuid();

  // Email details for the respondent
  var subject = "Thank you for your response";
  var message = "Dear employee,\n\nThank you for filling out the form. Kindly wait for the approval.\n\nBest regards,\n[Your Name/Organization]";

  // Send the email to the respondent
  MailApp.sendEmail(email, subject, message);

 // Get the active spreadsheet and the sheet where responses are stored
  var sheet = SpreadsheetApp.openById('1h5PR62-ahwThjcykxVsZcfvKxDLE7NRCgGz20rEMysU').getSheetByName("leave requests");  // Replace with the actual sheet name

  // Get all data from the sheet
  var data = sheet.getDataRange().getValues();

  // Initialize remaining leave
  var remainingLeave = 10; // Default value if no previous entries are found

  // Iterate through the spreadsheet to find the most recent entry for the given email address
  for (var i = data.length - 1; i >= 1; i--) {  // Start from the end to get the most recent entry
    if (data[i][1] == email && data[i][8] == "") {  // Assuming email is in the second column
      continue;
    }else if (data[i][1] == email){
      remainingLeave = data[i][8];  // Assuming remaining leave is in the 9th column
      break;
    }
  }

  // Find the row where the new data is appended
  var lastRow = sheet.getLastRow();
  

  // Update the last row with the unique ID and remaining leave
  sheet.getRange(lastRow, 8).setValue(leaveRequestId);  // Assuming the unique ID column is the 8th column
  sheet.getRange(lastRow, 9).setValue(remainingLeave);  // Assuming the remaining leave column is the 9th column
  
  var leave = sheet.getRange(lastRow, 9).getValue();

  // Organizer's email address
  var organizerEmail = "mmspam42@gmail.com";  // Replace with the actual organizer's email address
  // Approval form link (replace with the actual link)
  var approvalFormLink = "https://docs.google.com/forms/d/e/1FAIpQLSfmIf-PT60sePIueaAZmYlrqrxv3jl3aSo8qpgPyRvRUsS12g/viewform?usp=pp_url&entry.1396339528=" + leaveRequestId;

  var subject2 = "Leave Request";

  var message2 = "Hi,\n\nA new leave request has been submitted with the following details:\n\n" +
                 "Name: " + name + "\n" +
                 "Type of Leave: " + typeOfLeave + "\n" +
                 "Remaining Leave: " + leave + "\n" +
                 "From Date: " + fromDate + "\n" +
                 "To Date: " + toDate + "\n" +
                 "Reasons: " + reasonsForLeave + "\n\n" +
                 "Please review and approve or reject the leave request by clicking the link below:\n" +
                 approvalFormLink + "\n\n" +
                 "Best regards,\n[Your Name/Organization]";

  // Send the email to the organizer
  MailApp.sendEmail({
    to: organizerEmail,
    subject: subject2,
    body: message2
  });

 
}

function createSendEmailTrigger() {
  // Replace with your actual Spreadsheet ID
  var spreadsheetId = '1h5PR62-ahwThjcykxVsZcfvKxDLE7NRCgGz20rEMysU';
  
  // Get the spreadsheet by its ID
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  ScriptApp.newTrigger("sendEmail")
    .forSpreadsheet(spreadsheet)
    .onFormSubmit()
    .create();
}

function onFormSubmit(e) {
  // Get the form responses
  var resp = e.values;
  
  // Extract individual responses
  var leaveRequestId = resp[1];  // Assuming Leave Request ID is in the first column
  var decision = resp[2];  // Assuming Organizer's Decision is in the second column
  var comments = resp[3] || "none";  // Assuming Comments is in the third column

  // Update the new sheet with approval response
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("approval responses");  // Replace with the actual sheet name

  // Fetch the original leave request details using the leaveRequestId
  var originalSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("leave requests");  // Replace with the actual sheet name
  var data = originalSheet.getDataRange().getValues();
  
  var respondentEmail;
  for (var i = 1; i < data.length; i++) {
    if (data[i][7] == leaveRequestId) {  // Assuming the leaveRequestId is in the first column
      respondentEmail = data[i][1];  // Assuming respondent's email is in the second column
      rowIndex = i;
      break;
    }
  }

   if (decision === "approve") {
    // Assuming the leave remaining is in the 9th column
    var leaveRemaining = data[rowIndex][8];
    if (leaveRemaining > 0) {
      leaveRemaining -= 1;
      originalSheet.getRange(rowIndex + 1, 9).setValue(leaveRemaining);
    }
  }

  // Email details for respondent
  var subject = "Leave Request Decision";
  var message = "Dear employee,\n\n" +
                "Your leave request has been " + decision + ".\n\n" +
                "Comments: " + comments + "\n\n" +
                "Best regards,\n[Your Name/Organization]";

  // Send the email to respondent
  MailApp.sendEmail(respondentEmail, subject, message);

}

function createOnFormSubmitTrigger() {
  // Replace with your actual Spreadsheet ID
  var spreadsheetId = '1h5PR62-ahwThjcykxVsZcfvKxDLE7NRCgGz20rEMysU';
  
  // Get the spreadsheet by its ID
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(spreadsheet)
    .onFormSubmit()
    .create();
}




