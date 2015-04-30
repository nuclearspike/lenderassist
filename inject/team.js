cl("team.js processing");

var matches = location.pathname.match(/\/team\/(.*)\//);
if (matches){
    t_team_id = matches[1];
} else {
    t_team_id = location.pathname.match(/\/team\/(.*)/)[1];
}

get_team(t_team_id).done(short_talk_team);