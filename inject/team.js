cl("team.js processing");
var t_team_id = location.pathname.split('/')[2];
get_team(t_team_id).done(short_talk_team);