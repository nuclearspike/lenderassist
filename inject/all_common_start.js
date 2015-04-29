cl("all_common_start.js processing");

var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day* 7, month=day*30, year=12*month;
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
var lender_id = undefined;

//speak
function sp(speak, interrupt) {
    if (!speak) return;
    cl(speak);
    if (interrupt == undefined) {interrupt = false}
    chrome.runtime.sendMessage({utterance: speak, enqueue: interrupt});
}

function sp_once(named_utterance, utterance){
    chrome.storage.local.get(named_utterance, function(res){
        if (is_not_set(res[named_utterance])) {
            sp(utterance);
            obj = {};
            obj[named_utterance] = true;
            chrome.storage.local.set(obj);
        }
    });
}

function cl(s){
    console.log(s);
}

function pick_random(arr){
    return arr[get_rand_int(arr.length)];
}

function get_rand_int(max) {
    return Math.floor(Math.random() * max);
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
        console.log('Storage key "%s" in namespace "%s" changed. ' +
            'Old value was "%s", new value is "%s".',
            key,
            namespace,
            storageChange.oldValue,
            storageChange.newValue);
    }
});

function do_if_awhile(named_process, amount_of_time, check_func, if_ready_func){
    chrome.storage.local.get(named_process, function(res){
        var last_check = res[named_process];
        if (is_not_set(last_check) || (Date.now() -  last_check > amount_of_time)){
            check_func();
            obj = {};
            obj[named_process] = Date.now();
            chrome.storage.local.set(obj);
        } else {
            if_ready_func();
        }
    })
}

//short hand
function is_not_set(ouch){
    return (ouch==undefined || ouch==null || ouch=="");
}