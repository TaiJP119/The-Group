var fileId = '1h5PR62-ahwThjcykxVsZcfvKxDLE7NRCgGz20rEMysU'; // Extract the file ID from the URL
var ss = SpreadsheetApp.openById(fileId);
var as = ss.getSheetByName("Announcement");
var lastRow = as.getLastRow();

function getAnnouncements() {
  if (lastRow < 2) {
    return []; // No announcements if less than 2 rows
  }

  var announcements = as.getRange(2, 1, lastRow - 1, 2).getValues(); // Adjusted to get 3 columns

  return announcements.map(function(row) {
    return {
      text: row[0],
      imageUrl: row[1] ? convertToPreviewLink(row[1]) : ''
    };
  });
}

function addAnnouncement(text, imageUrl) {
  as.appendRow([
    text,
    imageUrl, // Add image URL to the spreadsheet
    new Date()
  ]);
}

function uploadImage(base64Image, fileName) {
  var folderId = '17Dxsv-RoYOJTxROGRu2aZHZr46VyP-Ek';
  var folder = DriveApp.getFolderById(folderId);
  var contentType = base64Image.match(/data:([^;]+);/)[1];
  var bytes = Utilities.base64Decode(base64Image.match(/base64,(.+)/)[1]);
  var blob = Utilities.newBlob(bytes, contentType, fileName);
  var file = folder.createFile(blob);
  return file.getUrl(); // Return the file URL
}

// Function to convert Google Drive view link to preview link
function convertToPreviewLink(viewLink) {
  return viewLink.replace('/view?usp=drivesdk', '/preview');
}