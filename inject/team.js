cl("team.js processing");
if_setting(['speech_enabled','speech_enabled_analyze_team']).done(() =>
    api_object.done([short_talk_team, sp_top_3_team_stats])
);