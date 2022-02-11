$(document).on("click", "#verify_sheet_url", verifyGoogleSheet);

function verifyGoogleSheet(update=true) {

	document.getElementById('verify_sheet_url').style.display = 'block';
	document.getElementById('verified_sheet_url').style.display = 'none';

	var spreadSheetId = getSpreadSheetId($('input[name="google_sheet_url"]').val());
	if(!spreadSheetId){
		// $('.msg').text("Fill in a copy of official google sheet");
		// message_animation('alert-danger');
		messageToast('error',"Fill in a copy of official google sheet")

	} else {
		chrome.identity.getAuthToken({
			interactive: true
		}, function(token) {			
			if ( token == "undefined" || typeof token == "undefined") {
				// $('.msg').text("bad client id: APP_ID_OR_ORIGIN_NOT_MATCH");
				// message_animation('alert-danger');
				messageToast('error',"bad client id: APP_ID_OR_ORIGIN_NOT_MATCH")
			} else {
				if (token) {
					if(update){
						// $.ajax({
						// 	type: "POST",
						// 	url: apiBaseUrl + "?action=updateSheetUrl",
						// 	dataType: 'json',
						// 	data: { google_sheet_url: $("#google_sheet_url").val() , userId : $(".userId").val()}
						// }). done(function(response) {

						// 	chrome.storage.local.get(["user"], function(result) {
						// 		var temp = result.user;
						// 		temp.google_sheet_url = $("#google_sheet_url").val();
						// 		chrome.storage.local.set({'user': temp});
						// 	});
							
						// });
					}
					var init = {
						method: 'GET',
						async: true,
						headers: {
							Authorization: 'Bearer ' + token,
							'Content-Type': 'application/json'
						},
						'contentType': 'json'
					};
					var sheetApi = "https://sheets.googleapis.com/v4/spreadsheets/" +spreadSheetId+ "?&includeGridData=false";
					// console.log(sheetApi)
					fetch(sheetApi,init).then(function(response) {	
								if(response.status == 404){
									// $('.msg').text("Invalid GoogleSheet Url");
									// message_animation('alert-danger');
									messageToast('error',"Invalid GoogleSheet Url")

									document.getElementById('verify_sheet_url').style.display = 'block';
									document.getElementById('verified_sheet_url').style.display = 'none';
									// document.getElementById('is_verified_sheet_url').textContent = selected_lang_locale.settings_per_group.google_sheet_url.verify
									$('.view_data_link').attr('href','#');
								} else {
									// document.getElementById('is_verified_sheet_url').textContent = selected_lang_locale.settings_per_group.google_sheet_url.verified
									$('.view_data_link').attr('href',$("#google_sheet_url").val());
									document.getElementById('verify_sheet_url').style.display = 'none';
									document.getElementById('verified_sheet_url').style.display = 'block';
								}
							})
							.then(function(data) {
							
							});
				} else {
					document.getElementById('verify_sheet_url').style.display = 'block';
					document.getElementById('verified_sheet_url').style.display = 'none';
				}
			}
		});
	}
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
	var spreadSheetId = getSpreadSheetId($('input[name="google_sheet_url"]').val());
	console.log(spreadSheetId);
	if(!spreadSheetId){
		$('.msg').text("Invalid GoogleSheet Url");
		message_animation('alert-danger');
	} else {
		chrome.identity.getAuthToken({
			interactive: true
		}, function(token) {
			var init = {
				method: 'GET',
				async: true,
				headers: {
					Authorization: 'Bearer ' + token,
					'Content-Type': 'application/json'
				},
				'contentType': 'json'
			};
			var sheetApi = "https://sheets.googleapis.com/v4/spreadsheets/" +spreadSheetId+  "?&includeGridData=false";
			fetch(sheetApi,init).then(function(response) {
						if(response.status != 200){
							$('.msg').text("Invalid GoogleSheet Url");
							message_animation('alert-danger');
						}
					})
					.then(function(data) {
						console.log("Else")
						console.log(data)
					});
		});
	}
}

function handleAuthClick1(event) {
    chrome.identity.getAuthToken({
        interactive: true
    }, function(token) {
        var init = {
            method: 'POST',
            async: true,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            'contentType': 'json',
            body: JSON.stringify({
                range: "Sheet1!A:A",
                "majorDimension": "ROWS",
                values: [
                    ["Door", "$15", "2", "3/15/2016"],
                    ["Engine", "$100", "1", "3/20/2016"]
                ]
            })
        };
        var spreadSheetId = getSpreadSheetId($('input[name="google_sheet_url"]').val());
        var sheetApi = "https://sheets.googleapis.com/v4/spreadsheets/" +
                spreadSheetId +
                "/values/Sheet1!A:A:append?valueInputOption=USER_ENTERED";
        fetch(sheetApi,
                init)
                .then(function(response) {
                    console.log(response.json())
                })
                .then(function(data) {
                    console.log(data)
                });
    });
}

function message_animation(addClass) {
    $('.msg').addClass("alert " + addClass);
    setTimeout(function() {
        $('.msg').removeClass("alert alert-danger alert-success");
        $('.msg').text('');
        //adjustPopUpHeight();
    }, 2000);
}

function getSpreadSheetId(url) {
    var matches = /\/([\w-_]{15,})\/(.*?gid=(\d+))?/.exec(url);
	if(matches == null){
		return false;
	} else {
		return matches[1];
	}
}
