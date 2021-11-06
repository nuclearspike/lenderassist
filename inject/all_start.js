'use strict'
cl("all_start.js processing");

//chrome.storage.get(null, function(all){
    //console.log(all);
//});

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
    for (var i = 0; i < arr.length; i++){
        var connector = '';
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
    var result = $('#my-kiva-dropdown').length > 0;
    if (result) {
        chrome.storage.local.set({"was_logged_in": true});
    } else {
        if ($(".xbLegacyNav").length > 0) {
            //test for the login div to really know. opening a lender picture was registering it as not logged in
            chrome.storage.local.set({"was_logged_in": false});
        }
    }
    return result;
}

function get_lender(t_id){
    var def = $.Deferred();

    //does cache ever get set??
    get_cache('lender_' + t_id, def, 10 * minute).done(lender => {
        def.resolve(lender);
    }).fail(()=>{
        $.ajax({
            url: "https://api.kivaws.org/v1/lenders/" + t_id + ".json?app_id=org.kiva.kivalens",
            cache: false,
            fail: def.reject,
            success: function (result) {
                def.resolve(result.lenders[0]);
            }
        });
    });
    return def.promise();
}

function get_lenders(t_ids){
    var def = $.Deferred();

    //in an ideal world, this would look at each one to see if we had a cached result before calling.
    //then would store each result individually in the cache
    //this never gets cached.

    get_cache('lenders_' + t_ids, def, 10 * minute).done(lenders => {
        def.resolve(lenders);
    }).fail(()=>{
        $.ajax({
            url: "http://api.kivaws.org/v1/lenders/" + t_ids.join(',') + ".json?app_id=org.kiva.kivalens",
            cache: false,
            fail: def.reject,
            success: function (result) { def.resolve(result.lenders) }
        });
    });
    return def.promise();
}

function get_team(t_id){
    var def = $.Deferred();

    get_cache('team_'+t_id, def, 1 * hour).done(team=>{
        def.resolve(team);
    }).fail(()=>{
        $.ajax({
            url: "http://api.kivaws.org/v1/teams/using_shortname/" + t_id + ".json?app_id=org.kiva.kivalens",
            cache: false,
            fail: def.reject,
            success: (result) => {
                def.resolve(result.teams[0]);
            }
        });
    })
    return def.promise();
}

function graph_ql(query) {
    // must use https
    return $.post("https://kivalens.herokuapp.com/graphql",{query})
        .then(result => result.data)
}

//get data for lend tab
function get_loans(loan_id_arr){
    //eventually...
    //get_cache on every loan in array
    //for the ones that didn't fail add them to the results array.
    //$.when
    return graph_ql(`{loans(ids:[${loan_id_arr.join(',')}]) {
                id
                final_repayment
                terms { repayment_interval }
                repayments(show_zero_amounts:true) { amount }
                partner { name }
              }
            }`)
        .then(data => {
            var loans = data.loans.where(l=>l); //some come back null.
            loans.forEach(loan => set_cache('loan_graph_' + loan.id, loan));
            return loans;
        })
}

function get_loan_detail(loan_id){
    return graph_ql(`{loan(id:${loan_id}) {
                terms { repayment_interval }
                half_back(format: "MMM yyyy")
                half_back_actual
                three_fourths_back(format: "MMM yyyy")
                three_fourths_back_actual
                final_repayment(format: "MMM yyyy")
                repayments(show_zero_amounts:true) {
                  amount percent display
                }
                partner {
                    atheistScore {
                        commentsOnSecularRating
                        commentsOnSocialRating
                        religiousAffiliation
                        reviewComments
                        secularRating
                        socialRating
                    }
                }
            }}`)
        .then(data => data.loan)
}

function get_loan(t_id){
    if (isNaN(t_id)) return //happens on lend tab
    var def = $.Deferred();

    get_cache('loan_' + t_id, def, 10 * minute).done(loan => {
        def.resolve(loan);
    }).fail(() => {
        $.ajax({
            url:  `http://api.kivaws.org/v1/loans/${t_id}.json?app_id=org.kiva.kivalens`,
            cache: false,
            fail: def.reject,
            success: function (result) {
                def.resolve(result.loans[0]);
            }
        });
    });
    return def.promise();
}

function get_partner(t_id){
    var def = $.Deferred();

    if (!t_id) {
        def.reject()
        return
    }

    get_cache('partner_' + t_id, def, 6 * hour).done(partner=>{
        def.resolve(partner);
    }).fail(()=>{
        $.ajax({
            url: `http://api.kivaws.org/v1/partners/${t_id}.json?app_id=org.kiva.kivalens`,
            cache: false,
            fail: def.reject,
            success: result => def.resolve(result.partners[0]) 
        });
    });

    return def.promise();
}

function get_partner_from_loan(loan){
    var def = $.Deferred();
    if (!loan.partner){
        get_partner(loan.partner_id)
            .done(p => loan.partner = p)
            .done(def.resolve);
    } else {
        def.resolve(loan.partner);
    }
    return def.promise();
}

function get_verse_data(subject_type, subject_id, slice_by, all_active, min_count, max_count){
    var def = $.Deferred();
    var granularity = 'cumulative'; //for now
    var url = "https://www.kiva.org/ajax/getSuperGraphData?&sliceBy="+ slice_by +"&include="+ all_active +"&measure=count&subject_id=" + subject_id + "&type=" + subject_type + "&granularity=" + granularity;
    var cache_key = `get_verse_data_${subject_type}_${subject_id}_${slice_by}_${all_active}_${min_count}_${max_count}_${granularity}`;

    get_cache(cache_key, def).done(result => {
        cl(result);
        def.resolve(result);
    }).fail(() => {
        cl(`cache_miss: ${cache_key}`);
        $.ajax({
            url: url,
            crossDomain: true,
            type: "GET",
            dataType: "json",
            cache: true
        }).success(result => {
            var slices = [];
            var totals = {};
            var total_sum = 0;

            if (result.data) {
                if (max_count == -1) {
                    max_count = result.data.length
                } else {
                    max_count = Math.min(max_count, result.data.length);
                }

                for (var i = 0; i < result.data.length; i++){
                    total_sum += parseInt(result.data[i].value);
                }

                for (var i = 0; i < max_count; i++) {
                    slices.push(result.lookup[result.data[i].name]);
                    totals[result.lookup[result.data[i].name]] = parseInt(result.data[i].value); //todo: store object for slice {value: 12, percent: 25.0}
                }
            }
            if (slices.length >= min_count) {
                result = {ordered: slices, totals: totals, total_sum: total_sum};
                def.resolve(result);
            } else {
                def.reject();
            }
        }).fail(def.reject)
    });
    return def
}

function combine_all_and_active_verse_data(subject_type, subject_id, slice_by){
    var def = $.Deferred();

    $.when(get_verse_data(subject_type, subject_id, slice_by, 'all', 0, -1),
        get_verse_data(subject_type, subject_id, slice_by, 'active', 0, -1))
        .then((all_results, active_results)=>{
            var result = { all: all_results, active: active_results};
            //set_cache(cache_key, result);
            def.resolve(result);
        }).fail(def.reject);

    return def.promise();
}

function sp_top_3_lender_sectors(lender){ //used on /live
    get_verse_data('lender', lender.lender_id,'sector', 'all', 3, 3).then(sp_top_3_lender_sectors_from_slices);
}

function sp_top_3_lender_countries(lender){ //not in use anymore
    get_verse_data('lender', lender.lender_id,'country', 'all', 3, 3).done(slices => {
        sp(`Their top countries are ${ar_and(slices.ordered.slice(0,3))}`, lender);
    });
}

function sp_top_3_lender_regions(lender){ //not in use anymore
    get_verse_data('lender', lender.lender_id,'region', 'all', 3,3).done(slices => {
        sp(`Their top regions are ${ar_and(slices.ordered.slice(0,3))}`, lender);
    });
}

function percent_portfolio(slices, over_perc){
    var def = $.Deferred();
    if (!over_perc) { over_perc = 20; }
    var total = 0;
    for (var key in slices.totals) {
        total += slices.totals[key];
    }
    var percent = Math.floor(100 * total / slices.total_sum);
    if (percent >= over_perc){
        def.resolve(ar_and(slices.ordered.slice(0,3)), percent);
    } else {
        def.reject(ar_and(slices.ordered.slice(0,3)));
    }
    return def.promise();
}

function sp_top_3_lender_sectors_from_slices(slices){
    percent_portfolio(slices).then((top_3, percent) => {
        sp(`${top_3} account for ${percent} percent of their portfolio`);
    }).fail(top_3 => {
        sp(`Their most popular sectors are ${top_3}`);
    });
}

function sp_top_3_lender_stats(lender){ //on lender page
    get_verse_data('lender', lender.lender_id,'country', 'all', 3,3).then(sp_top_3_lender_sectors_from_slices);

    get_verse_data('lender', lender.lender_id,'sector', 'all', 3,3).then(percent_portfolio).then((top_3, percent)=>{
        sp(`Wow, they really love ${top_3}. Those sectors account for ${percent} percent of their portfolio`, lender);
    }).fail(top_3 => {
        sp(`They like lending ${top_3}`, lender);
    });
}

function sp_top_3_team_stats(team){ //on team page
    //get_verse_data('team', team.shortname,'region', 'all', 3,3).then(function(slices){
    //    sp("This team's top regions are " + ar_and(slices.ordered.slice(0,3)), team);
    //});

    get_verse_data('team', team.shortname,'country', 'all', 3,3).then(percent_portfolio).then((top_3, percent)=> {
        sp(top_3 + " account for " + percent + " percent of this team's loans", team);
    }).fail(top_3 =>{
        sp("Their most popular countries are " + top_3, team);
    });

    get_verse_data('team', team.shortname,'sector', 'all', 3,3).then(percent_portfolio).then((top_3, percent)=>{
        sp(top_3 + " account for " + percent + " percent of their loans", lender_id);
    }).fail(top_3 => {
        sp("The members of this team love loans for " + top_3, team);
    });
}

//todo: make this use the other pattern
function get_lender_teams(lender){ //this doesn't really get their teams, just the count (won't page if they have a bunch
    var def = $.Deferred();

    $.ajax({url: location.protocol + "//api.kivaws.org/v1/lenders/" + lender.lender_id + "/teams.json",
        cache: true,
        success: function (result) {
            if (result.paging.total > 0) {
                sp("They belong to " + plural(result.paging.total, "team"), lender);
            }
            lender.teams_count = result.paging.total;
            def.resolve(lender);
        }}).fail(def.reject);

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

//used when you nave to the myLenderId page directly or during ajax calls if it doesn't know who you are and you're logged in.
function figure_lender_id(dom) {
    var old_lender_id = lender_id; //hmm.
    var lender_id = $(dom).find("center > div:first").text(); //brittle!
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

function short_talk_loan(loan){
    sp(loan.sector + ' loan for ' + loan.name + ' in ' + loan.location.country, loan);
}

function short_talk_team(team){
    var speak = [team.name];

    var ago = date_diff_to_words(Date.now() - new Date(team.team_since));
    speak.push("team has been around for " + ago.units + ago.uom);

    if (team.member_count > 500) {
        speak.push("with more than " + plural(Math.floor(team.member_count / 100) * 100, 'member'));
    } else {
        speak.push("with " + plural(team.member_count, 'member'));
    }
    if (team.loan_count > 1000) {
        speak.push("and has made over " + plural(Math.floor(team.loan_count/1000)*1000, 'loan'));
    } else {
        speak.push("and has made " + plural(team.loan_count, 'loan'));
    }
    sp(speak.join(' '), team, false, true);
}

function short_talk_lender(lender){
    if (Date.now() - lender.last_spoke < 10 * second){
        return;
    }
    var speak = [];
    if (lender.whereabouts.length > 0) {
        speak.push("lives in " + lender.whereabouts);
    }
    if (lender.loan_count > 0) {
        speak.push("has made " + plural(lender.loan_count, "loan"));
    }
    var ago = date_diff_to_words(Date.now() - new Date(lender.member_since));
    speak.push("has been lending for " + ago.units + ago.uom);
    if (lender.invitee_count > 0){
        speak.push("has made " + plural(lender.invitee_count, "successful invitation"));
    }

    sp(lender.name + " " + ar_and(speak), lender);
    lender.last_spoke = Date.now(); //if these values aren't getting pushed back to the cache, it only helps on that page.
}

function short_talk_partner(partner){
    sp(partner.name);
}

function wire_intent(selector, name, on_intent_funct){
    $(document).on('mouseenter', selector, function(e){
        var $elem = $(e.target).closest('a');
        //console.log($elem);
        $elem.data(name + '_entered', Date.now());
        setTimeout(function(){
            if ($elem.data(name + '_entered')){ //if still over it.
                on_intent_funct($elem);
            }
        }, 500);
    }).on('mouseleave', selector, function(e){
        var $elem = $(e.target).closest('a');
        $elem.removeData(name + '_entered');
    });
}

function url_to_parts(url){
    //I DO NOT LIKE THIS METHOD.
    var matches = url.match(/\.org\/(?:lend|partners|team|lender)\/(\w+)/gi);
    if (!matches){ return { reject: true }; }
    var parts = matches[0].split('/');
    if (parts.length == 0){ return { reject: true }; }
    return {path: parts[1], id: parts[2]};
}

function url_to_api_object(url){
    var def = $.Deferred()
    var parts = url_to_parts(url)
    if (parts.reject) {
        def.reject()
        return def.promise()
    } else {
        var funcs = {
            team: get_team,
            lend: get_loan,
            lender: get_lender,
            partners: get_partner
        }
    }
    return funcs[parts.path](parts.id); //promise
}

var api_object = url_to_api_object(window.location.href); //promise

//CODE TO RUN
chrome.storage.local.get("lender_id", result => lender_id = result.lender_id);

chrome.storage.local.set({"last_visit": Date.now()});

//chrome.storage.local.set({"lender_id": null});

