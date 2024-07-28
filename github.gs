const GIT_API_URL = 'https://api.github.com/repos/TaiJP119/The-Group';
var urlFetchOptions = {
  "method": "GET",
  "headers": {
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getGitToken()}`
  }
}
var gitResponse = UrlFetchApp.fetch(GIT_API_URL, urlFetchOptions);

function getGitToken() {
    PropertiesService.getScriptProperties().getProperty(AUTH_TOKEN);
}