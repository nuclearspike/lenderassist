cl("lender.js processing");
var t_lender_id = location.pathname.match(/\/lender\/(.*)/)[1];

get_lender(t_lender_id).done([short_talk_lender,get_lender_data_sector,get_lender_data_country,get_lender_teams]).done(function(thing){
    console.log(this);
});
