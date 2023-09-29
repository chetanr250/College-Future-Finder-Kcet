function lastPage(data){

  var sID = "" // Spreadsheet ID
  var sName = "" // Sheet Name
  var dataSheet = SpreadsheetApp.openById(sID).getSheetByName(sName);
  Logger.log(data);
  dataSheet.appendRow([new Date, data.email, data.rank, data.branch, data.address]);
  var clgList = getColleges(data.rank,data.branch,data.address);
  return clgList;
}
function getColleges(rank, branch,address){
  var branchSheet = SpreadsheetApp.openById("1EZ8Ow7Ou0CDNP63IL9KsVjr3ypYtFDkgPmESVFvGHz8").getSheetByName(branch);
  var lastLine = branchSheet.getRange(branchSheet.getLastRow(),1,1,branchSheet.getLastColumn()).getValues()[0];
  if(lastLine[2]<rank){
    // error
    return [lastLine[2],branch];
  }
  else{
    // do something
    var vals = branchSheet.getRange(2,1,branchSheet.getLastRow()-2,3).getValues();
    for(var a = 0; a<branchSheet.getLastRow()-1;a++){
      if(vals[a][2] > rank){
        var minNum = Math.min(5,branchSheet.getLastRow()-a);
        var clgListData = branchSheet.getRange(a+2,1,minNum,branchSheet.getLastColumn()).getValues();
        for(var i = 0; i<clgListData.length; i++){
          var dist = distanceFinder(address,clgListData[i][1]);
          Logger.log(dist)
          clgListData[i].push(dist[0]);
          clgListData[i].push(dist[1]);
        }
        return clgListData;
      }
    }
  }
}
function timeFunction(){
  var d = new Date();
  try{
    d.setHours(8);
    d.setMinutes(0);
    d.setDate(d.getDate()+1);
  }
  catch(error){
    Logger.log('will not work bro!')
  }
  return d;
}
function distanceFinder(origin,destination) {
  try{
  // var destination = 'dayananda sagar college of engineering'
  var mp = Maps.newDirectionFinder()
      .setOrigin(origin)
      .setDestination(destination)
      .setMode(Maps.DirectionFinder.Mode.DRIVING)
      .setDepart(timeFunction())
      .getDirections();
    var s = mp['routes'][0]['legs'][0];
    var duration = s.duration.text;
    var distance = s.distance.text;
    Logger.log([duration,distance])
    return [duration,distance];
  }
  catch(error){
    Logger.log(error);
    return ["-","-"]
  }
}
function main(){
  var s = SpreadsheetApp.openById("1EZ8Ow7Ou0CDNP63IL9KsVjr3ypYtFDkgPmESVFvGHz8")
  var str = "";
  var sheets = s.getSheets();
  for(var a=0; a<sheets.length; a++){
    str += "\"" + sheets[a].getName() + "\", ";
  }
  Logger.log(str);
}

function askAI(prompt){
    var apiur1 = ""; //API Key
    var headers = {
    "Content-Type": "application/json"};
    var requestBody = {
    "prompt": {
    "text": prompt}}
    var options = {
    "method" : "POST",
    "headers": headers,
    "payload": JSON.stringify(requestBody)}
    var response = UrlFetchApp.fetch(apiur1, options);
    var data = JSON.parse(response.getContentText());
    var output = data.candidates[0].output ;
    // Logger.log (output);
    return output ;
}

function strReplaceAll(subject, search, replacement) {
  function escapeRegExp(str) { return str.toString().replace(/[^A-Za-z0-9_]/g, '\\$&'); }
  search = search instanceof RegExp ? search : new RegExp(escapeRegExp(search), 'g');
  return subject.replace(search, replacement);
}
// tell me about '{branch}' branch in engineering colleges in karnataka in short. how much scope we have in the future?
function sendMailTo(table,email,data,branch){
  // var email = 'chetan250204@gmail.com';
  var aiHtmlText = table;
  var branchAI = askAI(`tell me about '${branch}' branch in engineering colleges in karnataka in short. how much scope we have in the future?`);
        branchAI = strReplaceAll(branchAI,'* **',"<br><b>");
      branchAI = strReplaceAll(branchAI,'.**',"</b><br>");
      branchAI = strReplaceAll(branchAI,':**',"</b><br>");
      branchAI = strReplaceAll(branchAI,'**',"<br><b>");
      branchAI = strReplaceAll(branchAI,'*',"<br>");
  aiHtmlText += `<h2>Why choose ${branch}?</h2>
    <p>${branchAI}</p> `;
  for(var a = 0; a<data.length; a++){
      var answer = askAI('How is '+data[a][1]+'in karnataka for engineers?');
      if(answer == 'Good')
      answer = askAI('What advantage we have '+data[a][1]+' over other colleges in karnataka?');
      answer = strReplaceAll(answer,"* **","<br><br><b>");
      answer = strReplaceAll(answer,".**","</b><br>");
      answer = strReplaceAll(answer,":**","</b><br>");
      answer = strReplaceAll(answer,"**","<br><br><b>");
      answer = strReplaceAll(answer,"*","<br>");

      aiHtmlText+=`<h2>${a+1.} ${data[a][1]}</h2>
    <h5 style="color: gray;">Distance: ${data[a][4]}<br>Duration: ${data[a][3]}</h5>
    <p>${answer}</p>`
  }
aiHtmlText+='<p style="color: gray";>This content is AI-generated and may not be entirely accurate. </p>';
      ht = HtmlService.createHtmlOutput(aiHtmlText).getContent();
    MailApp.sendEmail({
  to: email,
  subject: "College you can get for your Rank",
  htmlBody: ht}); 
}
function doGet() {  
  var ht = HtmlService.createTemplateFromFile("new");
  ht = ht.evaluate();
  return ht;
}
function include(e){
 return HtmlService.createHtmlOutputFromFile(e).getContent();
}
