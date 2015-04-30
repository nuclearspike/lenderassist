cl("lender.js processing");
var t_lender_id = location.pathname.match(/\/lender\/(.*)/)[1];

function get_lender_data(lender, slice_by){
    cl("get_lender_data: " + slice_by);
    var def = $.Deferred();
    var url = location.protocol + "//www.kiva.org/ajax/getSuperGraphData?&sliceBy="+ slice_by +"&include=all&measure=count&subject_id=" + lender.lender_id + "&type=lender&granularity=cumulative";
    $.ajax({url: url,
        crossDomain: true,
        type: "GET",
        dataType: "json",
        cache: true
    }).success(function(result){
        slices = [];
        if (result.data) {
            if (result.data.length > 3) {
                for (i = 0; i < Math.min(result.data.length, 3); i++) {
                    slices.push(result.lookup[result.data[i].name]);
                }
                sp("Their top " + slice_by + "s are " + ar_and(slices));
            }
        }
        def.resolve(lender);
    }).fail(def.reject);
    return def.promise();
}

function get_lender_data_sector(lender){
    return get_lender_data(lender,'sector');
}

function get_lender_data_country(lender){
    return get_lender_data(lender,'country');
}

function get_lender_data_region(lender){
    return get_lender_data(lender,'region');
}

function get_lender_data_activity(lender){
    return get_lender_data(lender,'activity');
}

function get_lender_teams(lender){
    var def = $.Deferred();

    $.ajax({url: location.protocol + "//api.kivaws.org/v1/lenders/" + lender.lender_id + "/teams.json",
        cache: true,
        success: function (result) {
            if (result.paging.total > 0) {
                sp("and belongs to " + plural(result.paging.total, "team"));
            }
            lender['teams_count'] = result.paging.total;
            def.resolve(lender)
        }}).fail(def.reject);

    return def.promise();
}

get_lender(t_lender_id).done([short_talk_lender,get_lender_data_sector,get_lender_data_country]).done(get_lender_teams).done(function(thing){
    console.log(this);
});
