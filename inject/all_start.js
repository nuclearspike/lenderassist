cl("all_start.js processing");
//functions used all over

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

function ar_and(arr){
    var result = "";
    for (i = 0; i < arr.length; i++){
        connector = '';
        if (i > 0) {
            if (i == arr.length - 1) {
                connector = ' and ';
            } else {
                connector = ', ';
            }
        }
        result +=  connector + arr[i];
    }
    return result;
}

function f_is_logged_in(){
    result = $("div.loggedInGreeting").length > 0;
    chrome.storage.local.set({"was_logged_in": result});
    return result;
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

//var lenders = {};
function get_resource(t_id, path, api_array){
    var def = $.Deferred();

    lenders = localStorage.lenders;
    if (lenders[t_id]){
        def.resolve(lenders[t_id]);
    }

    $.ajax({
        url: window.location.protocol + "//api.kivaws.org/v1/lenders/" + t_id + ".json",
        cache: true,
        fail: def.reject,
        success: function (result) {
            lender = result.lenders[0];
            lenders[t_id] = lender;
            def.resolve(lender);
            localStorage.lenders = lenders; //todo: use this
        }
    });

    return def.promise();
}

var lenders = {};
function get_lender(t_id){
    var def = $.Deferred();

    lenders = localStorage.lenders;
    if (lenders[t_id]){
        def.resolve(lenders[t_id]);
    }

    $.ajax({
        url: window.location.protocol + "//api.kivaws.org/v1/lenders/" + t_id + ".json",
        cache: true,
        fail: def.reject,
        success: function (result) {
            lender = result.lenders[0];
            lenders[t_id] = lender;
            def.resolve(lender);
            localStorage.lenders = lenders; //todo: use this
        }
    });

    return def.promise();
}

var teams = {};
function get_team(t_id){
    var def = $.Deferred();

    teams = localStorage.teams || teams;
    if (teams[t_id]){
        def.resolve(lenders[t_id]);
    }

    $.ajax({url: window.location.protocol + "//api.kivaws.org/v1/teams/using_shortname/" + t_id + ".json",
        cache: true,
        fail: def.reject,
        success: function (result) {
            team = result.teams[0];
            teams[t_id] = teams;
            def.resolve(team);
            localStorage.teams = teams; //todo: use this
        }
    });

    return def.promise();
}

function plural(count, word, plural_word){
    if (count != 1){
        if (!plural_word){
            plural_word = word + 's';
        }
        return count + " " + plural_word;
    } else {
        return "1 " + word;
    }
}

function figure_lender_id(dom) {
    old_lender_id = lender_id;
    var lender_id = $(dom).find("center > div:first").text();
    if (lender_id != "") {
        cl(lender_id);
        chrome.storage.local.set({"lender_id": lender_id});
        if (old_lender_id == undefined && !is_not_set(lender_id) ) {
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