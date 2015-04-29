cl("all_start.js processing");

var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day* 7, month=day*30, year=12*month;
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
var lender_id = undefined;

//speak
function sp(s) {
    if (!s) return;
    cl("Spoken: " + s);
    chrome.runtime.sendMessage({utterance: s.toString()});
}

function cl(s){
    console.log(s);
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.was_logged_in){//present
        if (changes.was_logged_in.oldValue == true && changes.was_logged_in.newValue == false) {
            //if we log out, set the data to wipe out.
            chrome.storage.local.set({"d_countries":null,"d_sectors":null,"lender_id":null,"last_logged_out":Date.now()});
        }
    }
    //debug
    for (key in changes) {
        var storageChange = changes[key];
        cl('Storage key "%s" in namespace "%s" changed. ' +
            'Old value was "%s", new value is "%s".',
            key,
            namespace,
            storageChange.oldValue,
            storageChange.newValue);
    }
});

//hmm.
function fetch_value( key ) {
    var dfd = $.Deferred();

    chrome.storage.local.get(key, function(result){
        if (result[key] == undefined){
            dfd.reject();
        } else {
            dfd.resolve(result);
        }
    });

    return dfd.promise();
}

function f_is_logged_in(){
    result = $("div.loggedInGreeting").length > 0;
    chrome.storage.local.set({"was_logged_in": result});
    return result;
}

function get_rand_int(max) {
    return Math.floor(Math.random() * max);
}

//i'd rather use the .success .fail pattern (.figure)
function get_or_figure(key, context, figure_func, result_func){
    cl("get_or_figure " + key);
    chrome.storage.local.get(key, function(result){
      if (result[key] == undefined){
          figure_func(context, result_func, function(result){
              chrome.storage.local.set({key: result});
          });
      } else {
          result_func(context, result[key]);
      }
    });
}

//short hand
function is_not_set(ouch){
    return (ouch==undefined || ouch==null || ouch=="");
}

function figure_lender_id(dom) {
    old_lender_id = lender_id;
    var lender_id = $(dom).find("center > div:first").text();
    if (lender_id != "") {
        cl(lender_id);
        chrome.storage.local.set({"lender_id": lender_id});
        if (old_lender_id == undefined) {
            sp("Now I know who you are! When visiting loan pages, I'll relate the loan to your portfolio.");
        } else if (old_lender_id != lender_id){
            sp("You changed to a different account. Got it.");
        }
    }
}

//CODE TO RUN
chrome.storage.local.get("lender_id", function(result){
    lender_id = result.lender_id;
});

chrome.storage.local.set({"last_visit": Date.now()});

//chrome.storage.local.set({"lender_id": null});