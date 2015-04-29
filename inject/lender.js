var t_lender_id = window.location.href.match(/\/lender\/(.*)/)[1];
$.ajax({
    url: "http://api.kivaws.org/v1/lenders/" + t_lender_id + ".json",
    cache: true,
    success: function (result) {
        lenders[t_lender_id] = result.lenders[0];
        short_talk_lender(result.lenders[0]);


        var url = "http://www.kiva.org/ajax/getSuperGraphData?&sliceBy=sector&include=all&measure=count&subject_id=" + t_lender_id + "&type=lender&granularity=cumulative";
        $.ajax({url: url,
            crossDomain: true,
            type: "GET",
            dataType: "json",
            cache: true
        }).success(function(result){
            sectors = []
            for (i = 0; i < Math.min(result.data.length, 3); i++){
                sectors.push(result.lookup[result.data[i].name]);
            }
            sp("Their top sectors are " + sectors.join(', '));

            var teams = "http://api.kivaws.org/v1/lenders/" + t_lender_id + "/teams.json";
            $.ajax({url: teams,
                    cache: true,
                success: function (result) {
                    sp("They belong to " + plural(result.paging.total, "team"));
                }});
        });

    }
});