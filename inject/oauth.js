oauth = function setup_oauth(){
    var def = $.Deferred();

    return def;
}

function o_my(path){
    var def = $.Deferred();

    oauth.done(con => {
        con.get({ path: `my/${path}.json` }).done(def.resolve).fail(def.reject);
    }).fail(def.reject);

    return def;
}

function get_account(){
    return o_my('account');
}

function get_email(){
    return o_my('email');
}

get_account().done(res => {
    //
});