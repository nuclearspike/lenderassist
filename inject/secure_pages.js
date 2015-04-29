console.log("secure_pages.js processing");

//what causes a reset? it'll be the first user to log in forever. something should clear the local storage...
chrome.storage.local.get("lender_id", function(res){
    console.log(res);
    if (res.lender_id == undefined && f_is_logged_in()){
       $.ajax({url: "https://www.kiva.org/myLenderId"}).success(function(data){ //cludgy/brittle way to get it.
           var lender_id = $(data).find("center > div:first").text();
           if (lender_id != ""){
               console.log(lender_id);
               chrome.storage.local.set({"lender_id": lender_id});
               sp("Now I know who you are! When visiting loan pages, I'll relate the loan to your portfolio.");
           }
       });
    }
});
