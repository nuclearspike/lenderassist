console.log("all_start.js processing");

var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day* 7, month=day*30;
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
var lender_id = undefined;


//speak
function sp(s) {
    if (!s) return;
    console.log(s); //chrome.runtime.sendMessage('dpifkfcmpidflbchcmofhgioeppcjmfm', {utterance: "wowsa"});
    chrome.runtime.sendMessage({utterance: s.toString()}, function (response) {
        if (response) {
            console.log(response);
        }
    });
}

//debug
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.was_logged_in){//present
        if (changes.was_logged_in.oldValue == true && changes.was_logged_in.newValue == false) {
            //if we log out, set the data to wipe out.
            chrome.storage.local.set({"d_countries":null,"d_sectors":null,"lender_id":null,"last_logged_out":Date.now()});
        }
    }
    for (key in changes) {
        var storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
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
    //console.log("is_logged_in called");
    result = $("div.loggedInGreeting").length > 0;
    chrome.storage.local.set({"was_logged_in": result});
    return result;
}

function get_rand_int(max) {
    return Math.floor(Math.random() * (max));
}

//i'd rather use the .success .fail pattern (.figure)
function get_or_figure(key, context, figure_func, result_func){
    console.log("get_or_figure " + key);
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

chrome.storage.local.set({"last_visit":Date.now()});