cl("secure_pages.js processing");

//what causes a reset? it'll be the first user to log in forever. something should clear the local storage...
chrome.storage.local.get("lender_id", function(res){
    if (is_not_set(res.lender_id) && f_is_logged_in() && location.href.indexOf(".org/myLenderId") == -1){
       $.ajax({url: "https://www.kiva.org/myLenderId"}).success(figure_lender_id);
    }
});