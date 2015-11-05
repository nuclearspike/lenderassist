var zip_logged_in = $("li.dropdown > a.user-menu").length > 0;
chrome.storage.local.set({'zip_logged_in': zip_logged_in, 'check_zip_logged_in': Date.now().getTime()});
if (zip_logged_in) {
    chrome.storage.local.set({'zip_logged_in_ever': true});
}