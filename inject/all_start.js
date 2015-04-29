cl("all_start.js processing");

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