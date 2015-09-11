cl("lender.js processing");
if_setting(['speech_enabled','speech_enabled_analyze_lender']).done(()=>
    api_object.done([short_talk_lender, sp_top_3_lender_stats, get_lender_teams])
);