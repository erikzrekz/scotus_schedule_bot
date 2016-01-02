var cheerio = require('cheerio');
var TwitterBot = require('node-twitterbot').TwitterBot;
var moment = require('moment');
var request = require('request');
var _ = require('underscore');

var Bot = new TwitterBot({
    "consumer_secret": "",
    "consumer_key": "",
    "access_token": "",
    "access_token_secret": ""
});

var currentMonth = moment().format('MMMM');
var currentDay = moment().format('dddd, MMMM D, YYYY');
var monthlyUrl = 'http://www.supremecourt.gov/oral_arguments/calendars/MonthlyArgumentCal'+currentMonth+'2016.html';
var options = {
  url: monthlyUrl,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36',
    'Referer': monthlyUrl ,
    'Cache-Control': 'max-age=0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  }
};

request(options, function(error, response, html){
  if(!error){
      var $ = cheerio.load(html);

      var dates = $('table.MsoTableGrid td table.MsoTableGrid td table.MsoTableGrid tr:nth-child(odd) td > p.MsoNormal:nth-child(2) span');

      var data = $('table.MsoTableGrid td table.MsoTableGrid td table.MsoTableGrid tr td table.MsoTableGrid tr:nth-child(even) td p').children();

      var scotusSessionDates = [];
      var scotusSessionLinks = [];
      var scotusSessionNames = [];
      var patt = /LEGAL HOLIDAY/g;

      for (var x in dates) {
        if (typeof dates[x].parent !== 'undefined' &&
            dates[x].type === 'tag' &&
            dates[x].parent.type === 'tag' &&
            dates[x].parent.name === 'b') {

            if (dates[x].children[0].data !== null) {
              scotusSessionDates.push(dates[x].children[0].data.split(',')[1].replace( /^\D+/g, ''));
            }

        }
      }

      for (var x in data) {
        if (data[x].type === 'tag' &&
            data[x].name === 'a') {
            scotusSessionLinks.push(data[x].attribs.href);
        } else if (data[x].type === 'tag' &&
            data[x].name === 'span' &&
            data[x].children[0].data.length > 20 &&
            !patt.test(data[x].children[0].data)) {
          scotusSessionNames.push(data[x].children[0].data);
        }
      }

      Bot.addAction("tweetMonthlySchedule", function(twitter, action, tweet) {
        Bot.tweet('SCOTUS has sessions on ' + scotusSessionDates.join(', ') + ' of ' + currentMonth + '.');
      });
  }
});


process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
  console.log("Enter was pressed. Closing script...");
  process.exit();
});

// Warn the user we are entering an infinite loop
console.log("Starting SCOTUS Scheduler loop. Press Enter to stop.");

var date = new Date();

// //  (2 minutes = 120 seconds = 120000 milliseconds)
// setInterval(function() {
//   Bot.now('tweetMonthlySchedule');
//   console.log("Log: Sent a tweet -- " + date.toISOString(Date.now() ) );
// }, 120000);