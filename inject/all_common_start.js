"use strict";
cl("all_common_start.js processing");
//this is shared between www, zip, and background pages.

var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day* 7, month=day*30, year=12*month;
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
var monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
var lender_id = undefined;

chrome.runtime.sendMessage({location_icon: true});

function get_settings() {
    var dfd = $.Deferred();
    chrome.runtime.sendMessage({get_settings: true}, dfd.resolve)
    return dfd.promise();
}

//execute .done() IFF the settings are all set to true, then also returns whole settings object
//can use .always() to get the settings object
function if_setting(setting_name){
    var keys = Array.isArray(setting_name) ? setting_name : [setting_name];
    var dfd = $.Deferred();

    get_settings().done(settings => {
        var all_true = function(settings){
            var result = true;
            $.each(keys, function(i, key){
                if (settings[key] === false) {
                    result = false;
                }
            });
            return result;
        };

        if (all_true(settings)){
            dfd.resolve(settings);
        } else {
            dfd.reject(settings);
        }
    });
    
    return dfd.promise();
}

function h_make_date(date){ //ex: March 2015
    return monthNames[date.getMonth()] + " " + date.getFullYear().toString();
}

function h_make_full_date(date){ //ex: Mar 4 2015
    return monthNamesShort[date.getMonth()] + " " + date.getDate() + ', ' + date.getFullYear().toString();
}

function roundedToFixed(_float, _digits){
    var rounder = Math.pow(10, _digits);
    return (Math.round(_float * rounder) / rounder).toFixed(_digits);
}

//speak
function sp(speak, context, follow_up, interrupt) {
    if (!speak) return;
    if (interrupt == undefined) {interrupt = false}
    chrome.runtime.sendMessage({utterance: speak, context: context, follow_up: follow_up, interrupt: interrupt}, function(msg){
        cl(msg);
    });
}

function sp_once(named_utterance, utterance){
    chrome.storage.local.get(named_utterance, function(res){
        if (is_not_set(res[named_utterance])) {
            sp(utterance);
            var obj = {};
            obj[named_utterance] = true; //named_utterance must be a variable, cannot reduce to {named_utterance: true}
            chrome.storage.local.set(obj);
        }
    });
}

function set_cache(key, value){
    chrome.runtime.sendMessage({cache:'set', key: key, value: value});
}

function get_cache(key, calc, max_age){
    var def = $.Deferred();
    var cache_callback = function(result){
        if (result == undefined){ //when missing from the cache
            if (calc){ //wire up interest in watching the (parent) function that can fetch/figure the value
                calc.done(value => {
                    set_cache(key, value); //and set the cache value once calculated
                })
            }
            def.reject();
        } else { //resolve it with the cached value
            def.resolve(result);
        }
    }

    chrome.runtime.sendMessage({cache:'get', key: key, max_age: max_age}, cache_callback);
    return def.promise();
}

function clear_cache(){
    chrome.runtime.sendMessage({cache:'clear'});
}

function date_diff_to_words(date_diff){
    if (date_diff < hour){
        var units = Math.floor(date_diff / minute);
        var uom = ' minute';
    } else if (date_diff < day) {
        units = Math.floor(date_diff / hour);
        uom = ' hour';
    } else if (date_diff < week) {
        units = Math.floor(date_diff / day);
        uom = ' day';
    } else if (date_diff < month) {
        units = Math.floor(date_diff / week);
        uom = ' week';
    } else if (date_diff < 18 * month) {
        units = Math.floor(date_diff / month);
        uom = ' month';
    } else {
        units = Math.floor(date_diff / year);
        uom = ' year';
    }
    if (units > 1) { uom = uom + 's'}
    return {units: units, uom: uom};
}

function cl(s){
    if_setting('debug_output_to_console').done(()=>{
        console.log(s);
    });
}

function sp_rand(arr, context, interrupt){
    sp(pick_random(arr), context, interrupt);
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
            chrome.storage.local.remove(['d_countries','d_sectors']);
            chrome.storage.local.set({"last_logged_out":Date.now()}); //"lender_id":null,
        }
    }
    //debug
    for (var key in changes) {
        var storageChange = changes[key];
        console.log(`Storage key "${key}" in namespace "${namespace}" changed. Old value was "${storageChange.oldValue}", new value is "${storageChange.newValue}".`)
    }
});

//make this Deferred?
function do_if_awhile(named_process, amount_of_time, check_func, if_ready_func){
    chrome.storage.local.get(named_process, function(res){
        var last_check = res[named_process];
        if (is_not_set(last_check) || (Date.now().getTime() -  last_check > amount_of_time)){
            check_func();
            var obj = {};
            obj[named_process] = Date.now().getTime();
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
