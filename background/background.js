var window_height = 0;
var window_width = 0;
chrome.windows.getAll({populate : true}, function (list) {

    window_height = list[0].height;
    window_width = list[0].width;
});
var optionPageTabId = 0;

chrome.storage.sync.set({facebookWindowOpened: false});
// The ID of the extension we want to talk to.
var chatsiloExtensionId = "jhiieidladgdfpmflejiiiafjlddgaki";
// Make a simple request:
var custom_data = {
    "baseUrl": baseUrl
};
var startCall = '';
var id = randomIdForNotificaton(5);
var declineTabId = 0;
var declineMessageText = '';
var welcomeMessageText = '';
var commentText = '';
var welcomeTabId = 0;
var selfTabId = 0;
var declineSheetTitle = '';
var taggingTabId = 0;
var selected_lang_locale = null;
var opt = {
    type: "basic",
    title: "GroupLeads",
    message: "",
    iconUrl: "../icon128.png"
}
//// var uniqueHash = null;
var jwtToken = null;
var currentLoggedInFBId = false;
var randomDelayCheckArray = [1, 2, 3, 4, 5, 6];
var sendWelComeMessageArrayOfTabIdsWithMsgText = [];
var allDeclineMessageArray = [];
var googleSheetDataAlreadyInserted = [];

var autoSettingsOfGroupGlobal = '';


chrome.tabs.onUpdated.addListener(function
  (tabId, changeInfo, tab) {
    if (changeInfo.url) {
        if(tab.url.indexOf('/groups/') > 0){
            chrome.tabs.sendMessage(tab.id,{type:'getActiveGroupIds', from: 'background'});
        }
    }
  }
);

function getRedirectUrl(currentUrl) {
    return currentUrl.replace("?_rdc=1&_rdr", "");
}

function requestHandler(details) {
    return {
        redirectUrl: getRedirectUrl(details.url)
    };
}
// Listen for message to reload current page
chrome.runtime.onMessage.addListener(function(message, sender, send_response) {
    if (message.reloadFbPage == 'yes') {
        console.log('message 1');
        custom_data = message;
        setTimeout(()=>{
            clearAutomaticIntervals();
        },2000);
        getCurrentTab().then(function(tab){
            console.log(tab.id);
            console.log(tab.url);
            chrome.tabs.update(tab.id, {
                url: tab.url
            });
        });
    } else if (message.auto_approve_settings_updated) {
        console.log('message 2');

        console.log('automation call from popup');
       setTimeout(()=>{
            clearAutomaticIntervals();
        },2000);
    } else if (message.connect_app) {
        chrome.tabs.create({
            url: message.app_url,
            active: true
        });
    }else if(message.action == "remove_automation_tab"){
        chrome.tabs.remove(message.tabId);
    }else if(message.from == "optionPage" && message.type == "openTab"){
        console.log('message from optionPage to open openTab');
       var item = message.item;
        openTab(item);
    }else if(message.from == "optionPage" && message.type == "openTabWithInterval"){
        console.log('message from optionPage to open openTabWithInterval');
       var item = message.item;
       var invervalId = message.invervalId;
        openTab(item, invervalId);
    }else if(message.from == "option" && message.type == "activeBackground"){
        console.log('activeBackground msg');
    }else if(message.from == "contenscript" && message.type == "activateMsg"){
        console.log('activateMsg get');
    }else if(message.type == "optionWindowClose"){
        console.log(message.type);
        if(optionPageTabId != 0){
            chrome.tabs.remove(optionPageTabId);
        }
    }
})

// Oninstall though window.open can be blocked by popup blockers
chrome.runtime.onInstalled.addListener(function() {
    chrome.alarms.create('forActiveState', {periodInMinutes:1/60});
    chrome.storage.local.set({
        'groupleadsBaseUrl': custom_data.baseUrl,
        'groupConfig': [],
        'fbGroupIds': [],
        'credentialEdit': false
    });
    initialize();
    // installPageUrlLogic();
    chrome.cookies.set({
        url: baseUrl,
        name: "groupleads_language",
        value: 'en',
        expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
    });
});

chrome.runtime.onStartup.addListener(function() {
    console.log('here on startup');
    initialize();
});

// Uninstall
chrome.runtime.setUninstallURL(custom_data.baseUrl + '/uninstalled');
// Listen for port messages
chrome.runtime.onConnect.addListener(function(port) {
    var sender = port.sender
    port.onMessage.addListener(function(message) {
        // get-form-data --- To send form data to script
        if (message.type == 'get-form-data') {
            port.postMessage({
                'data': custom_data
            })
        }
        if (message.type == 'verifyGoogleSheet') {
            console.log('verifyGoogleSheet');
            google_sheet_not_valid = 'Google sheet is not valid'; // selected_lang_locale.background_script_message.google_sheet_not_valid
            var message = message;
            chrome.identity.getAuthToken({
                interactive: true
            }, function(token) {
                if (token) {
                    var matches = /\/([\w-_]{15,})\/(.*?gid=(\d+))?/.exec(message.google_sheet_url);
                    if (matches == null) {
                        console.log('sheet null')
                        notifyClient(google_sheet_not_valid);
                    } else {
                        var spreadSheetId = matches[1];
                        var init = {
                            method: 'GET',
                            async: true,
                            headers: {
                                Authorization: 'Bearer ' + token,
                                'Content-Type': 'application/json'
                            },
                            'contentType': 'json'
                        };
                        var sheetApi = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadSheetId + "?&includeGridData=false";
                        fetch(sheetApi, init).then(function(response) {
                            if (response.status == 404) {
                                //Sheet Error
                                notifyClient(google_sheet_not_valid);
                            } else {
                                //Valid Sheet
                                //console.log(message.memberId);
                                getCurrentTab().then(function(tab){
                                    //console.log(tabs);
                                    if (message.memberId == null) {
                                        //console.log('if');
                                        chrome.tabs.sendMessage(tab.id, {
                                            type: 'start_scraping',
                                            from: 'background'
                                        });
                                    } else {
                                        console.log('approveOne else');
                                        chrome.tabs.sendMessage(tab.id, {
                                            type: 'approveOne',
                                            from: 'background',
                                            memberId: message.memberId
                                        });
                                    }
                                });
                            }
                        });
                    }
                } else {
                    console.log('else sheeturl not found')
                    //Invalid Token
                    notifyClient(google_sheet_not_valid);
                }
            });
        }
        if (message.type == 'verifyGoogleSheetfordecline') {
            console.log('verifyGoogleSheetfordecline');
            google_sheet_not_valid = 'Google sheet is not valid'; // 
            var message = message;
            if (message.google_sheet_url != null && message.google_sheet_url != undefined) {
                chrome.identity.getAuthToken({
                    interactive: true
                }, function(token) {
                    if (token) {
                        var matches = /\/([\w-_]{15,})\/(.*?gid=(\d+))?/.exec(message.google_sheet_url);
                        if (matches == null) {
                            notifyClient(google_sheet_not_valid);
                        } else {
                            var spreadSheetId = matches[1];
                            var init = {
                                method: 'GET',
                                async: true,
                                headers: {
                                    Authorization: 'Bearer ' + token,
                                    'Content-Type': 'application/json'
                                },
                                'contentType': 'json'
                            };
                            var sheetApi = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadSheetId;
                            fetch(sheetApi, init).then(function(response) {
                                return response.json();
                            }).then(function(sheetsObj) {
                                if (sheetsObj.error != undefined) {
                                    if (sheetsObj.error.message == "The caller does not have permission") {
                                        declineSheetTitle = '';
                                        var autodecline = message.autodecline;
                                        if (autodecline) {
                                            console.log('if')
                                            chrome.tabs.sendMessage(selfTabId, {
                                                type: 'declineOne',
                                                from: 'background',
                                                memberId: message.memberId,
                                                autodecline: message.autodecline,
                                                declineSheetFlag: false
                                            });
                                        } else {
                                            console.log('elssssse');
                                            getCurrentTab().then(function(tab){
                                                chrome.tabs.sendMessage(tabs.id, {
                                                    type: 'declineOne',
                                                    from: 'background',
                                                    memberId: message.memberId,
                                                    autodecline: message.autodecline,
                                                    declineSheetFlag: false
                                                });
                                            });
                                        }
                                    } else {
                                        notifyClient(sheetsObj.error.message);
                                    }
                                } else {
                                    var declineSheet = false;
                                    if (sheetsObj.sheets.length == 0) {
                                        notifyClient('sheet not created');
                                    }
                                    declineSheet = false;
                                    var declinSheetFind = false;
                                    //console.log(sheetsObj.sheets);
                                    sheetsObj.sheets.forEach(function(item, i) {
                                        if (i == 1) {
                                            declinSheetFind = true;
                                            declineSheetTitle = item.properties.title;
                                        }
                                    });
                                    //console.log(declinSheetFind);
                                    if (declinSheetFind) {
                                        //console.log('if');
                                        var autodecline = message.autodecline;
                                        //console.log(autodecline);
                                        if (autodecline) {
                                            console.log('if')
                                            chrome.tabs.sendMessage(selfTabId, {
                                                type: 'declineOne',
                                                from: 'background',
                                                memberId: message.memberId,
                                                autodecline: message.autodecline,
                                                declineSheetFlag: true
                                            });
                                        } else {
                                            console.log('elssssse');
                                            console.log(message.memberId);
                                            getCurrentTab().then(function(tab){
                                                console.log(tab);
                                                chrome.tabs.sendMessage(tab.id, {
                                                    type: 'declineOne',
                                                    from: 'background',
                                                    memberId: message.memberId,
                                                    autodecline: message.autodecline,
                                                    declineSheetFlag: true
                                                });
                                            });
                                        }
                                    } else {
                                        console.log('else');
                                        declineSheetTitle = '';
                                        var autodecline = message.autodecline;
                                        if (autodecline) {
                                            console.log('if')
                                            chrome.tabs.sendMessage(selfTabId, {
                                                type: 'declineOne',
                                                from: 'background',
                                                memberId: message.memberId,
                                                autodecline: message.autodecline,
                                                declineSheetFlag: false
                                            });
                                        } else {
                                            console.log('elssssse');
                                            getCurrentTab().then(function(tab){
                                                chrome.tabs.sendMessage(tab.id, {
                                                    type: 'declineOne',
                                                    from: 'background',
                                                    memberId: message.memberId,
                                                    autodecline: message.autodecline,
                                                    declineSheetFlag: false
                                                });
                                            });
                                        }
                                    }
                                }
                            });
                        }
                    } else {
                        //Invalid Token
                        notifyClient(google_sheet_not_valid);
                    }
                });
            } else {
                notifyClient('Please enter google sheet');
            }
        }
        if (message.type == 'callGoogleSheet') {
            googleSheetDataArray = [];
            d = new Date();
            message.fbGroupData.forEach(function(oneItem, oneItemIndex) {
                var tmp = [];
                oneItem.forEach(function(y, l) {
                    if (l == 5) {
                        if (localDateFormat(y) == 'Invalid Date') {
                            tmp.push(y);
                        } else {
                            tmp.push(localDateFormat(y));
                        }
                    } else if (l == 12) {
                        tmp.push(localDateFormat(d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()));
                    } else {
                        tmp.push(y);
                    }
                });
                foundM = googleSheetDataArray.filter((oneM) => {
                    return oneM[1] == tmp[1]
                })
                if (foundM.length == 0) {
                    if (restrictMultipleEntries) {
                        var profile_url = tmp[1];
                        var FbGroupId = message.currentGroupDetails[0].groupFbId;
                        if (googleSheetDataAlreadyInserted[FbGroupId] != undefined) {
                            var index = googleSheetDataAlreadyInserted[FbGroupId].indexOf(profile_url);
                            if (index < 0) {
                                googleSheetDataArray.push(tmp);
                            }
                        } else {
                            googleSheetDataArray.push(tmp);
                        }
                    } else {
                        googleSheetDataArray.push(tmp);
                    }
                }
            });
            // console.log(googleSheetDataArray)
            google_sheet_url_invalid = 'Invalid google sheet'; // selected_lang_locale.background_script_message.google_sheet_url_invalid
            google_sheet_not_valid_for = 'Invalid google sheet'; // selected_lang_locale.background_script_message.google_sheet_not_valid_for
            chrome.storage.local.get(["user"], function(result) {
                if (typeof result.user != "undefined" && result.user.id != "") {
                    if (message.currentGroupDetails[0].google_sheet_url != "") {
                        chrome.identity.getAuthToken({
                            interactive: true
                        }, function(token) {
                            if (token) {
                                var matches = /\/([\w-_]{15,})\/(.*?gid=(\d+))?/.exec(message.currentGroupDetails[0].google_sheet_url);
                                if (matches == null) {
                                    if (typeof message.groupCurrentName != "undefined") {
                                        notifyClient(google_sheet_not_valid_for + " " + message.groupCurrentName);
                                    } else {
                                        notifyClient(google_sheet_url_invalid);
                                    }
                                } else {
                                    var spreadSheetId = matches[1];
                                    var init = {
                                        method: 'GET',
                                        async: true,
                                        headers: {
                                            Authorization: 'Bearer ' + token,
                                            'Content-Type': 'application/json'
                                        },
                                        'contentType': 'json'
                                    };
                                    var sheetApi = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadSheetId + "?&includeGridData=false";
                                    fetch(sheetApi, init).then(function(response) {
                                        if (response.status == 404) {
                                            if (typeof message.groupCurrentName != "undefined") {
                                                notifyClient(google_sheet_not_valid_for + " " + message.groupCurrentName);
                                            } else {
                                                notifyClient(google_sheet_url_invalid);
                                            }
                                        } else {
                                            /********* Write to google Sheet******************/
                                            var init1 = {
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
                                                    values: googleSheetDataArray
                                                })
                                            };
                                            var sheetApiUrl = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadSheetId + "/values/Sheet1!A:A:append?valueInputOption=USER_ENTERED";
                                            fetch(sheetApiUrl, init1).then(function(response) {
                                                if (response.status == 200) {
                                                    var FbGroupId = message.currentGroupDetails[0].groupFbId;
                                                    var user_profile_urls = [];
                                                    googleSheetDataArray.forEach(function(oneItem, oneItemIndex) {
                                                        user_profile_urls.push(oneItem[1])
                                                    });
                                                    if (googleSheetDataAlreadyInserted[FbGroupId] == undefined) {
                                                        googleSheetDataAlreadyInserted[FbGroupId] = user_profile_urls;
                                                    } else {
                                                        user_profile_urls.forEach(function(item, ind) {
                                                            googleSheetDataAlreadyInserted[FbGroupId].push(item);
                                                        });
                                                    }
                                                    // console.log(googleSheetDataAlreadyInserted); 
                                                }
                                            }).then(function(data) {});
                                            console.log(message);
                                            members = message.fbGroupData;
                                            saveMemberToDatabase(message.currentGroupDetails[0], members)
                                            subscribers = new Array();
                                            var questionOne = '';
                                            var questionTwo = '';
                                            var questionThree = '';
                                            members.forEach(function(item, i) {
                                                if (item.length > 6) {
                                                    temp = new Object();
                                                    temp.first_name = item[3];
                                                    temp.last_name = item[4];
                                                    temp.groupId = message.currentGroupDetails[0].groupId;
                                                    if (extractEmails(item[7]) != null) {
                                                        temp.email = extractEmails(item[7])[0];
                                                    } else if (extractEmails(item[9]) != null) {
                                                        temp.email = extractEmails(item[9])[0];
                                                    } else if (extractEmails(item[11]) != null) {
                                                        temp.email = extractEmails(item[11])[0];
                                                    }
                                                    temp.location = item[13].trim();
                                                    if (temp.email != null && temp.email != "" && message.currentGroupDetails[0].sendAllFields == 0) {
                                                        subscribers.push(temp);
                                                    }
                                                    if (message.currentGroupDetails[0].sendAllFields == 1) {
                                                        if (item[6] != '' && questionOne == '') {
                                                            questionOne = item[6];
                                                        }
                                                        if (item[8] != '' && questionTwo == '') {
                                                            questionTwo = item[8];
                                                        }
                                                        if (item[10] != '' && questionThree == '') {
                                                            questionThree = item[10];
                                                        }
                                                        temp.ans_one = item[7];
                                                        temp.ans_two = item[9];
                                                        temp.ans_three = item[11];
                                                        if (temp.email != null && temp.email != "") {
                                                            subscribers.push(temp);
                                                        }
                                                    }
                                                }
                                            })
                                            if (subscribers.length > 0 && enableAutoResponderAPICall && message.currentGroupDetails[0].sendAllFields == 0) {

                                                console.log(jwtToken);
                                                fetch(apiBaseUrl + "add-subscribers", {
                                                    method: "POST",
                                                    body: {
                                                        subscribers: JSON.stringify(subscribers),
                                                        user: result.user.id,
                                                        groupId: message.currentGroupDetails[0].groupId
                                                    },
                                                    headers: {
                                                        "Content-type": "application/json; charset=UTF-8",
                                                        'Authorization': "Bearer " + jwtToken
                                                    }
                                                }).then(response => response.json()).then(data => {
                                                    if (data.status == 200) {}
                                                });
                                            } else if (subscribers.length > 0 && enableAutoResponderAPICall && message.currentGroupDetails[0].sendAllFields == 1) {
                                                var questionObj = {};
                                                questionObj.questionOne = questionOne
                                                questionObj.questionTwo = questionTwo
                                                questionObj.questionThree = questionThree
                                                console.log(questionObj);

                                                console.log(jwtToken);
                                                console.log(JSON.stringify(subscribers));

                                                fetch(apiBaseUrl + "add-subscribers", {
                                                    method: "POST",
                                                    body: JSON.stringify({
                                                        subscribers: JSON.stringify(subscribers),
                                                        user: result.user.id,
                                                        groupId: message.currentGroupDetails[0].groupId,
                                                        questionObj: questionObj
                                                    }),
                                                    headers: {
                                                        "Content-type": "application/json; charset=UTF-8",
                                                        'Authorization': "Bearer " + jwtToken
                                                    }
                                                }).then(response => response.json()).then(data => {
                                                    if (data.status == 200) {}
                                                });
                                            }
                                            console.log(message.currentGroupTabId);
                                            if (typeof message.currentGroupTabId != "undefined") {
                                                console.log('background in')
                                                chrome.tabs.sendMessage(message.currentGroupTabId, {
                                                    type: 'auto_start_scraping_complete',
                                                    from: 'background'
                                                });
                                            }
                                        }
                                    }).then(function(data) {});
                                }
                            }
                        });
                    } else {
                        notifyClient(google_sheet_url_invalid);
                    }
                }
            });
        }
        if (message.type == 'callGoogleSheetforDecline') {
            //console.log(message);
            googleSheetDataArraydecline = [];
            d = new Date();
            message.fbGroupData.forEach(function(oneItem, oneItemIndex) {
                var tmp = [];
                oneItem.forEach(function(y, l) {
                    if (l == 5) {
                        if (localDateFormat(y) == 'Invalid Date') {
                            tmp.push(y);
                        } else {
                            tmp.push(localDateFormat(y));
                        }
                    } else if (l == 12) {
                        tmp.push(localDateFormat(d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()));
                    } else {
                        tmp.push(y);
                    }
                });
                foundM = googleSheetDataArraydecline.filter((oneM) => {
                    return oneM[1] == tmp[1]
                })
                if (foundM.length == 0) {
                    googleSheetDataArraydecline.push(tmp);
                }
            });
            //console.log(googleSheetDataArraydecline);
            google_sheet_url_invalid = 'Invalid google sheet'; // selected_lang_locale.background_script_message.google_sheet_url_invalid
            google_sheet_not_valid_for = 'Invalid google sheet'; // selected_lang_locale.background_script_message.google_sheet_not_valid_for
            chrome.storage.local.get(["user"], function(result) {
                if (typeof result.user != "undefined" && result.user.id != "") {
                    if (message.currentGroupDetails[0].google_sheet_url != "") {
                        chrome.identity.getAuthToken({
                            interactive: true
                        }, function(token) {
                            if (token) {
                                var matches = /\/([\w-_]{15,})\/(.*?gid=(\d+))?/.exec(message.currentGroupDetails[0].google_sheet_url);
                                if (matches == null) {
                                    if (typeof message.groupCurrentName != "undefined") {
                                        notifyClient(google_sheet_not_valid_for + " " + message.groupCurrentName);
                                    } else {
                                        notifyClient(google_sheet_url_invalid);
                                    }
                                } else {
                                    var spreadSheetId = matches[1];
                                    var init = {
                                        method: 'GET',
                                        async: true,
                                        headers: {
                                            Authorization: 'Bearer ' + token,
                                            'Content-Type': 'application/json'
                                        },
                                        'contentType': 'json'
                                    };
                                    var sheetApi = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadSheetId + "?&includeGridData=false";
                                    fetch(sheetApi, init).then(function(response) {
                                        //console.log(response);
                                        if (response.status == 404) {
                                            if (typeof message.groupCurrentName != "undefined") {
                                                notifyClient(google_sheet_not_valid_for + " " + message.groupCurrentName);
                                            } else {
                                                notifyClient(google_sheet_url_invalid);
                                            }
                                        } else {
                                            /********* Write to google Sheet******************/
                                            //console.log(declineSheetTitle+"!A:A");
                                            var init1 = {
                                                method: 'POST',
                                                async: true,
                                                headers: {
                                                    Authorization: 'Bearer ' + token,
                                                    'Content-Type': 'application/json'
                                                },
                                                'contentType': 'json',
                                                body: JSON.stringify({
                                                    range: declineSheetTitle + "!A:A",
                                                    "majorDimension": "ROWS",
                                                    values: googleSheetDataArraydecline
                                                })
                                            };
                                            var sheetApiUrl = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadSheetId + "/values/" + declineSheetTitle + "!A:A:append?valueInputOption=USER_ENTERED";
                                            fetch(sheetApiUrl, init1).then(function(response) {
                                                if (response.status == 200) {
                                                    var FbGroupId = message.currentGroupDetails[0].groupFbId;
                                                    //console.log(FbGroupId);
                                                    //console.log(googleSheetDataArraydecline);
                                                }
                                            }).then(function(data) {});
                                            members = message.fbGroupData;
                                        }
                                    }).then(function(data) {});
                                }
                            }
                        });
                    } else {
                        notifyClient(google_sheet_url_invalid);
                    }
                }
            });
        }
        if(message.type == 'inactiveToActive'){
            console.log('inactiveToActive');
            facebookWindowClose();
        }
        /*if(message.type == "beginfromOption"){
            console.log('port oj');
        }*/
        if(message.type == "begin"){
            console.log('port cs');
        }
    })
});
// Listen for message to reload current page
chrome.runtime.onMessage.addListener(function(message, sender, send_response) {
    // add group 
    if (message.type == 'closeSenderTab') {
        chrome.tabs.remove(sender.tab.id);
    } else if (message.type == 'addGroup') {
        fetch(apiBaseUrl + "add-group-v2", {
            method: "POST",
            body: JSON.stringify({
                userId: message.userId,
                groupId: message.groupId,
                groupName: message.groupName
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                'Authorization': "Bearer " + jwtToken
            }
        }).then(response => response.json()).then(response => {
            console.log(response);
            if (response.status == 200) {
                chrome.runtime.sendMessage({
                    'action': 'refresh_groups',
                    userId: message.userId
                });
            } else {
                chrome.runtime.sendMessage({
                    'action': 'already_added',
                    'msg': response.msg
                });
            }
        });
    } else if (message.type == 'jwtForBackground') {
        //console.log(message)
        jwtToken = message.jwtToken;
        chrome.cookies.set({
            url: baseUrl,
            name: "jwt_token",
            value: jwtToken,
            expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
        });
        checkUserActivation();
    } else if (message.type == 'sendDeclineMessage') {
        declineMessageText = message.declineMessageText;
        sendDeclineMeesage(message.threadId);
    } else if (message.type == 'sendWelcomeMessage') {
        welcomeMessageText = message.welcomeMessageText;
        console.log('sendWelcomeMessage');
        console.log(welcomeMessageText);
        sendWelcomeMessage(message.threadId, message.welcomeMessageText);
    } else if (message.type == 'commentTagging') {
        console.log('commentTagging url');
        commentText = message.commentText;
        console.log(commentText);
        commentTagging(message.welcomePostUrl);
    } else if (message.type == 'declineMsgPlacedAndTriggerClick') {
        var declineTabIdCopy = sender.tab.id;
        setTimeout(() => {
            isTabLoadedAgain = setInterval(function() {
                chrome.tabs.get(declineTabIdCopy, function(tab) {
                    if (tab.status === "complete") {
                        clearInterval(isTabLoadedAgain);
                        chrome.tabs.sendMessage(declineTabIdCopy, {
                            type: 'triggerClickToSendChat',
                            from: 'background',
                            declineTabIdCopy: declineTabIdCopy
                        });
                    }
                })
            }, 200);
        }, 3000);
    } else if (message.type == 'declineMessageSendCloseTab') {
        chrome.tabs.remove(message.declineTabIdCopy);
    } else if (message.type == 'welcomeMessageSendCloseTab') {
        setTimeout(() => {
            chrome.tabs.remove(sender.tab.id);
        }, 2000)
    } else if (message.type == 'getNumericFbIds') {
        getNumericFbIds(message.data, sender.tab.id);
    } else if (message.type == 'getNumericFbIdSingle') {
        console.log(message);
        console.log('getNumericFbIdSingle');
        console.log('https://m.facebook.com/' + message.alphaId);
        if (isNaN(message.alphaId)) {
            fetch('https://m.facebook.com/' + message.alphaId).then(response => response.text()).then(data => {
                var str = data;
                var mySubString = str.substring(str.lastIndexOf('&quot;profile_id&quot;:') + 1, str.lastIndexOf('&quot;profile_id&quot;:') + 50);
                tmp = mySubString.split(',');
                var tmpUserId = tmp[0].split(':')[1];
                chrome.tabs.sendMessage(sender.tab.id, {
                    type: 'startSingleTag',
                    from: 'background',
                    numericId: tmpUserId
                });
            });
        } else {
            chrome.tabs.sendMessage(sender.tab.id, {
                type: 'startSingleTag',
                from: 'background',
                numericId: message.alphaId
            });
        }
    } else if (message.type == 'getLoginFBId') {
        currentFBLogin();
    } else if (message.type == 'getMessageText') {
        var foundMTab = sendWelComeMessageArrayOfTabIdsWithMsgText.findIndex((oneM) => {
            return oneM.mTabId == sender.tab.id
        });
        console.log(foundMTab);
        if (foundMTab > -1) {
            chrome.tabs.sendMessage(sender.tab.id, {
                type: 'triggerWelcomeMessage',
                from: 'background',
                welcomeMessageText: sendWelComeMessageArrayOfTabIdsWithMsgText[foundMTab].msgText
            });
        }
    } else if (message.type == 'syncQuestions') {
        syncQuestions(message.groupId, message.fbGroupId);
    } else if (message.type == 'saveSyncQuestions') {
        //console.log(message)
        chrome.tabs.remove(sender.tab.id)
        saveSyncQuestions(message.tempSync);
    }/*else if(message.type == 'inactiveToActive' && message.from == 'contenscript'){
        facebookWindowClose();
    }*/
});
var membersToTagArray = [];

function getNumericFbIds(membersToTagArrayq, workingTabId) {
    membersToTagArray = membersToTagArrayq;
    getNumericFbIdOne(0, workingTabId)
}

function getNumericFbIdOne(currentIndex, workingTabId) {
    var threadIdArray = membersToTagArray[currentIndex][1].split('/');
    var alphaFBid = threadIdArray[threadIdArray.length - 1];
    if (/[a-zA-Z]/.test(alphaFBid)) {
        fetch('https://m.facebook.com/' + alphaFBid).then(response => response.text()).then(data => {
            var str = data;
            var mySubString = str.substring(str.lastIndexOf('&quot;profile_id&quot;:') + 1, str.lastIndexOf('&quot;profile_id&quot;:') + 50);
            tmp = mySubString.split(',');
            var tmpUserId = tmp[0].split(':')[1];
            membersToTagArray[currentIndex][1] = "https://www.facebook.com/" + tmpUserId;
            randomDelayCheckArrays = [1, 2, 3];
            randomNum = randomDelayCheckArrays[Math.floor(Math.random() * randomDelayCheckArrays.length)];
            randomDealySec = randomNum * 1000;
            setTimeout(() => {
                if (currentIndex == membersToTagArray.length - 1) {
                    chrome.tabs.sendMessage(workingTabId, {
                        type: 'getNumericFbIdsStartTagging',
                        from: 'background',
                        data: membersToTagArray
                    });
                } else {
                    currentIndex = currentIndex + 1;
                    getNumericFbIdOne(currentIndex, workingTabId);
                }
            }, randomDealySec);
        });
    } else {
        if (currentIndex == membersToTagArray.length - 1) {
            console.log('if');
            chrome.tabs.sendMessage(workingTabId, {
                type: 'getNumericFbIdsStartTagging',
                from: 'background',
                data: membersToTagArray
            });
        } else {
            console.log('else');
            currentIndex = currentIndex + 1;
            getNumericFbIdOne(currentIndex, workingTabId);
        }
    }
}

function saveMemberToDatabase($currentGroupSettings, $googleSheetMembers) {
    var $groupId = $currentGroupSettings.groupId;
    var $groupFbId = $currentGroupSettings.groupFbId;
    var $chatsilo_tags_status = $currentGroupSettings.chatsilo_tag_status;
    var $chatsilo_tagIds = [$currentGroupSettings.chatsilo_tag_ids];
    if ($currentGroupSettings.chatsilo_tag_ids.indexOf(',') > -1) {
        $chatsilo_tagIds = $currentGroupSettings.chatsilo_tag_ids.split(',');
    }
    chrome.storage.local.get(["user"], function(result) {
        if (typeof result.user.email != "undefined") {
            var allMembersArray = [];
            chrome.storage.local.get(["user"], function(result) {
                var user_id = result.user.id;
                members.forEach(function(item, i) {
                    temp = {};
                    temp.profile_url = item[1];
                    temp.full_name = item[2];
                    temp.first_name = item[3];
                    temp.last_name = item[4];
                    temp.joined_date = item[5];
                    temp.ques_one = item[6];
                    temp.ans_one = item[7];
                    temp.ques_two = item[8];
                    temp.ans_two = item[9];
                    temp.ques_three = item[10];
                    temp.ans_three = item[11];
                    temp.location = item[13];
                    temp.works_at = item[14];
                    temp.user_id = user_id;
                    temp.group_id = $groupId;
                    temp.fb_group_id = $groupFbId
                    allMembersArray.push(temp);
                });
                $postData = {
                    all_leads: allMembersArray
                };
                if ($chatsilo_tags_status == 1 && $currentGroupSettings.isNewLayout && $chatsilo_tagIds != 0 && currentLoggedInFBId) {
                    $postData = {
                        all_leads: allMembersArray,
                        email: result.user.email,
                        tagIds: JSON.stringify($chatsilo_tagIds),
                        fb_id: currentLoggedInFBId
                    };
                }
                if (allMembersArray.length > 0) {
                    console.log(jwtToken);
                    fetch(apiBaseUrl + "save-all-leads", {
                        method: "POST",
                        body: JSON.stringify($postData),
                        headers: {
                            "Content-type": "application/json; charset=UTF-8",
                            "Authorization": "Bearer " + jwtToken
                        }
                    }).then(response => response.json()).then(data => {
                        if (data.status == 200) {
                            chrome.runtime.sendMessage(chatsiloExtensionId, {
                                triggerTaggingFromGL: true
                            });
                        }
                    });
                }
            });
        }
    })
}

function declineTabListener(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete" && tabId === declineTabId) {
        chrome.tabs.sendMessage(declineTabId, {
            type: 'triggerDeclineMessage',
            from: 'background',
            declineMessageText: declineMessageText
        });
        chrome.tabs.onUpdated.removeListener(declineTabListener);
    }
}

function sendDeclineMeesage(threadId) {
    var sendDeclineMeesageUrl = 'https://web.facebook.com/messages/t/' + threadId;
    chrome.tabs.create({
        url: sendDeclineMeesageUrl,
        active: false
    }, function(tabs) {
        declineTabId = tabs.id;
        chrome.tabs.onUpdated.addListener(declineTabListener);
    });
}
var arrayOfTabIdsWithMessageText = [];

function sendWelcomeMessage(threadId, mesg) {
    threadId = threadId.replace('/', '');
    var mesg1 = mesg;
    if (/[a-zA-Z]/.test(threadId)) { /// having alphabets id
        fetch('https://m.facebook.com/' + threadId).then(response => response.text()).then(data => {
            var str = data;
            var mySubString = str.substring(str.lastIndexOf('&quot;profile_id&quot;:') + 1, str.lastIndexOf('&quot;profile_id&quot;:') + 50);
            tmp = mySubString.split(',');
            var tmpUserId = tmp[0].split(':')[1];
            //console.log(tmpUserId)
            if (typeof tmpUserId != 'undefined' && tmpUserId.length > 0) {
                var sendWelcomeMeesageUrl = 'https://m.facebook.com/messages/compose/?ids=' + tmpUserId;
                chrome.windows.create({
                    url: sendWelcomeMeesageUrl,
                    focused: false,
                    type: "popup",
                    top: Math.floor(window_height / 4 * 3),
                    left: Math.floor(window_width / 4 * 3),
                    height: Math.floor(window_height / 4),
                    width: Math.floor(window_width / 4)
                }, function(tabs) {
                    var t = {};
                    t.mTabId = tabs.tabs[0].id;
                    t.msgText = mesg1;
                    sendWelComeMessageArrayOfTabIdsWithMsgText.push(t);
                });
            } else {
                console.log('else')
            }
        });
    } else {
        console.log('else');
        var sendWelcomeMeesageUrl = 'https://m.facebook.com/messages/compose/?ids=' + threadId;
        chrome.windows.create({
            url: sendWelcomeMeesageUrl,
            focused: false,
            type: "popup",
            top: Math.floor(window_height / 4 * 3),
            left: Math.floor(window_width / 4 * 3),
            height: Math.floor(window_height / 4),
            width: Math.floor(window_width / 4)
        }, function(tabs) {
            var t = {};
            t.mTabId = tabs.tabs[0].id;
            t.msgText = mesg1;
            sendWelComeMessageArrayOfTabIdsWithMsgText.push(t);
        });
    }
}

function taggingTabListener(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete" && tabId === taggingTabId) {
        console.log(commentText);
        chrome.tabs.sendMessage(taggingTabId, {
            type: 'triggerTagging',
            from: 'background',
            commentText: commentText
        });
        chrome.tabs.onUpdated.removeListener(taggingTabListener);
    }
}

function commentTagging(url) {
    console.log('commentTagging : ' + url);
    chrome.windows.create({
        url: url,
        focused: false,
        type: "popup",
        top: Math.floor(window_height / 4 * 3),
        left: Math.floor(window_width / 4 * 3),
        height: Math.floor(window_height / 4),
        width: Math.floor(window_width / 4)
    }, function(tabs) {
        taggingTabId = tabs.tabs[0].id;
        chrome.tabs.onUpdated.addListener(taggingTabListener);
    });
}

function extractEmails(text) {
    if (text.indexOf('@') > -1) {
        text = text.replace(' @', '@');
        text = text.replace('@ ', '@');
    }
    return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}

function notifyClient(message) {
    opt.message = message;
    chrome.notifications.create("GroupLeads" + id, opt, function(result) {
        id++
    });
}
///// get automatic approve group settings ///////
//initiateFBGroups();
automationTabIds = [];
chrome.tabs.onRemoved.addListener(function(tabId) {
    if (automationTabIds.length) {
        var foundMTab1 = automationTabIds.findIndex((oneM) => {
            return oneM.tabid == tabId
        });
        if (foundMTab1 > -1) {
            automationTabIds.splice(foundMTab1, 1)
            //console.log(automationTabIds)
        }
    }
});

function openTab(autoSettingsOfGroup, invervalId = 0) {
    //console.log('openTab');
    var isValidToRun = true;
    autoSettingsOfGroupGlobal = autoSettingsOfGroup;
    //console.log(automationTabIds);
    if (automationTabIds.length) {
        var foundMTab = automationTabIds.findIndex((oneM) => {
            return oneM.groupid == autoSettingsOfGroup.fb_group_id
        });
        if (foundMTab > -1) {
            isValidToRun = false;
        }
    }
    if (isValidToRun) {
        updateNextInterval(autoSettingsOfGroup.group_id);
        groupUrl = 'https://www.facebook.com/groups/' + autoSettingsOfGroup.fb_group_id;
        chrome.windows.create({
            url: groupUrl,
            focused: false,
            type: "popup",
            top: Math.floor(window_height - 10),
            left: Math.floor(window_width - 10),
            height: 10,
            width: 10

            //For Testing
            // top:Math.floor(window_height/4*3),
            // left:Math.floor(window_width/4*3),
            // height:Math.floor(window_height/1),
            // width:Math.floor(window_width/4)


        }, function(tabs) {

            console.log('group tab opened');
            //console.log(tabs);
            selfTabId = tabs.tabs[0].id;
            chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                if (changeInfo.status === "complete" && tabId === selfTabId) {
                    let fullSObject = {
                        top: 100,
                        left: Math.floor(window_width),
                        height: Math.floor(window_height - 100),
                        width: Math.floor(window_width - 200)

                        //For Testing
                        // top:Math.floor(window_height/4*3),
                        // left:Math.floor(window_width/4*3),
                        // height:Math.floor(window_height/1),
                        // width:Math.floor(window_width/4)
                    }
                    chrome.windows.update(tabs.id, fullSObject)
                    console.log(autoSettingsOfGroupGlobal);
                    chrome.tabs.sendMessage(selfTabId, {
                        type: 'auto_start_scraping',
                        from: 'background',
                        tabId: selfTabId,
                        autoSettingsOfGroup: autoSettingsOfGroupGlobal
                    });
                    /***************/
                    
                    //console.log(autoSettingsOfGroupGlobal.fb_group_id);

                    chrome.storage.local.get(["automaticGroupSettings"], function(result) {
                        automaticGroupSettings = result.automaticGroupSettings;
                        var groupIndex = automaticGroupSettings.findIndex(function(item) {
                            if (item.groupId == autoSettingsOfGroupGlobal.fb_group_id) {
                                return item;
                            }
                        });
    
                        if (groupIndex >= 0) {
                            automaticGroupSettings[groupIndex].tabId = selfTabId;
                        }
                    })

                    
                    /***************/
                    var tem = {};
                    tem.tabid = selfTabId;
                    tem.groupid = autoSettingsOfGroupGlobal.fb_group_id
                   /* console.log(automationTabIds)*/
                    if (automationTabIds.length) {
                        var foundMTab = automationTabIds.findIndex((oneM) => {
                            return oneM.groupid == autoSettingsOfGroupGlobal.fb_group_id
                        });
                        if (foundMTab == -1) {
                            automationTabIds.push(tem);
                        }
                    } else {
                        automationTabIds.push(tem);
                    }
                }
            })
        });   
    }
}

chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (typeof changes.user != "undefined") {
        if (changes.user.newValue == '') {
            console.log('clearAutomaticIntervals on change user')
            clearAutomaticIntervals();
        }
    } else if (typeof changes.selectedLanuage != "undefined") {
        chrome.storage.local.get(["selectedLanuage"], function(result) {
            selected_lang_locale = result.selectedLanuage;
        });
    }else if (typeof changes.autoApproveSettings != "undefined") {
        checkAutomationOn();
    }
});

function clearAutomaticIntervals(){
    chrome.storage.local.set({'autoApproveSettings': ''});
    getFBGroupsSettings().then(function(){
        setTimeout(()=>{
            console.log('in setTimeout');
            chrome.windows.getAll({populate:true},function(windows){
                windows.filter((window)=>{
                    window.tabs.forEach(function(tab) {
                        if (tab.url.indexOf('option.html') > 0) {
                            var optionTabId = tab.id;
                            console.log('send msg form back')
                            chrome.tabs.sendMessage(optionTabId,{"from":"background","type":"automationUpdateSettings"})
                        }
                    });
                })
            });
        },1000);  
    });
}

function randomIdForNotificaton(length) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function updateNextInterval(group_id) { ///inlinked table////
    var dateTime = getCurrentDateTime();
    chrome.storage.local.get(["user","jwtToken"], function(result) {
        jwtToken = result.jwtToken;
        fetch(apiBaseUrl + "update-next-interval", {
            method: "POST",
            body: JSON.stringify({
                groupId: group_id,
                dateTime: dateTime
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                'Authorization': "Bearer " + jwtToken
            }
        }).then(response => response.json()).then(response => {
            if (response.status == 200) {
                //
            }
        });
    });
    
}

var automation_interval_min = 5;

function getCurrentDateTime() { /// unix timestamp
    return Math.floor(Date.now() / 1000);
}
var groupAutomationIntervalDelay = [10, 20, 30, 40, 50, 60];
groupAutomationIntervalDelay[Math.floor(Math.random() * groupAutomationIntervalDelay.length)];

// function initiateFBGroups() {
//     startCall = setInterval(function() {
//         chrome.storage.local.get(["user", "autoApproveSettings"], function(result) {
//             if (typeof result.user != "undefined" && result.user != "") {
//                 if (typeof result.autoApproveSettings != "undefined" && result.autoApproveSettings != "") {
//                     clearInterval(startCall);
//                     if (result.autoApproveSettings.length > 0) {
//                         var iterationDelayForApproveAndDecline = 0;
//                         var iterationDelayForDecline = 0;
//                         var runFirstGroupAutomation = true;
//                         var alreadyExistIntervalTime = [];
//                         //console.log(result.autoApproveSettings);
//                         result.autoApproveSettings.forEach(function(item, i) {
//                             if (item.auto_approve == 1) {
//                                 setTimeout(() => {
//                                     if (alreadyExistIntervalTime.length == 0) {
//                                         alreadyExistIntervalTime.push(item.interval_min);
//                                     } else if (alreadyExistIntervalTime.length > 0 && alreadyExistIntervalTime.indexOf(item.interval_min) > -1) {
//                                         item.interval_min = item.interval_min + 2;
//                                         if (alreadyExistIntervalTime.indexOf(item.interval_min) > -1) {
//                                             item.interval_min = Math.max.apply(Math, alreadyExistIntervalTime) + 2;
//                                         }
//                                         alreadyExistIntervalTime.push(item.interval_min);
//                                     }
//                                     console.log('New interval===' + item.interval_min);
//                                     automation_interval_min = item.interval_min;
//                                     var invervalId = setInterval(() => {
//                                         console.log('run in interval');
//                                         openTab(item, invervalId);
//                                     }, item.interval_min * 60 * 1000);
//                                     /***************/
//                                     tempGroupData = [];
//                                     tempGroupData.groupId = item.fb_group_id;
//                                     tempGroupData.invervalId = invervalId;
//                                     tempGroupData.interval = item.interval_min;
//                                     automaticGroupSettings.push(tempGroupData);
//                                     /***************/
//                                     if (runFirstGroupAutomation) {
//                                         console.log('run without interval');
//                                         runFirstGroupAutomation = false
//                                         openTab(item);
//                                     }
//                                 }, iterationDelayForApproveAndDecline);
//                                 iterationDelayForApproveAndDecline = iterationDelayForApproveAndDecline + 2000;
//                             } else if (item.enable_auto_decline == 1 && item.auto_decline_keywords != null && item.auto_decline_keywords != '') {
//                                 //No Use
//                                 /*setTimeout(() => {                            
//                                     var invervalId = setInterval(() =>{
                                        
//                                          openTab(item,invervalId);
//                                     },(parseInt(item.auto_decline_interval)*60*1000)); /// auto decline interval 5 min
                                    
//                                     tempGroupData = [];
//                                     tempGroupData.groupId = item.fb_group_id;
//                                     tempGroupData.invervalId = invervalId;
//                                     tempGroupData.interval = item.interval_min;
//                                     automaticGroupSettings.push(tempGroupData);
                                    
//                                     openTab(item);
//                                 }, iterationDelayForDecline);   
//                                 iterationDelayForDecline = iterationDelayForDecline + 2000;*/
//                             } else {
//                                 //No Use
//                                 //console.log('Nothing is thre');
//                             }
//                         });
//                     }
//                 }
//             }
//         });
//     }, 3000);
// }

async function getFBGroupsSettings() {
    chrome.storage.local.get(["user","jwtToken"], function(result) {
        jwtToken = result.jwtToken;
        //console.log(jwtToken);
        if (typeof result.user != "undefined" && result.user != "") {
            //console.log(jwtToken);
            fetch(apiBaseUrl + "get-auto-approve-settings-by-user", {
                method: "POST",
                body: JSON.stringify({
                    userId: result.user.id
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    'Authorization': "Bearer " + jwtToken
                }
            }).then(response => response.json()).then(response => {
                if (response.status == 200) {
                    console.log(response.autoSettings);
                    chrome.storage.local.set({
                        'autoApproveSettings': response.autoSettings
                    });
                }
            });
        }
    });
}

function get_subscriber_data() {
    //console.log(jwtToken);
    fetch(apiBaseUrl + "get-subscriber-data-v2", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
            "Content-type": "application/json; charset=UTF-8",
            'Authorization': "Bearer " + jwtToken
        }
    }).then(response => response.json()).then(response => {
        if (response.status == 200) {
            jwtToken = response.jwttoken;
            chrome.storage.local.set({
                'jwtToken': jwtToken,
                'user': response.user,
                'autoresponderList': response.autoResponderList,
                'planConfig': response.planConfig,
                'groupConfig': response.groupConfig
            });
            chrome.cookies.set({
                url: baseUrl,
                name: "jwt_token",
                value: jwtToken,
                expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
            });
            currentFBLogin();
            getFBGroupsSettings();
        }
    });
}
startSyncToken();

function startSyncToken() {
   // console.log('startSyncToken')
    setInterval(() => {
        chrome.storage.local.get(["user", "jwtToken"], function(result) {
            if (typeof result.user != "undefined" && result.user != "" && typeof result.jwtToken != "undefined" && result.jwtToken != "") {
                //console.log(result.user);
                //console.log(result.jwtToken);
                chrome.cookies.set({
                    url: baseUrl,
                    name: "jwt_token",
                    value: result.jwtToken,
                    expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
                });
            }
        });
    }, 30000)
}

function initialize() {
   // console.log('initialize');
    chrome.cookies.get({
        url: baseUrl,
        name: "jwt_token"
    }, function(result) {
        //console.log(result)
        if (result != null) {
            jwtToken = result.value;
            //console.log(jwtToken);
            get_subscriber_data();
        }
    });
    intervalSettingsForCheckActivation();
    getLanguageArrayFromServer();
    reloadAllTabsOnStartUp();

}

function installPageUrlLogic() {
    chrome.cookies.get({
        url: baseUrl,
        name: "is_gl_ext_installed"
    }, function(result) {
        if (result != null) {} else {
            chrome.cookies.set({
                url: baseUrl,
                name: "is_gl_ext_installed",
                value: '1',
                expirationDate: (new Date().getTime() / 1000) + (3600 * 24 * 365 * 2)
            });
            chrome.cookies.get({
                url: baseUrl,
                name: "jwt_token"
            }, function(jwt_result) {
                if (result != null) {} else {
                    window.open(custom_data.baseUrl + '/installed', '_blank');
                }
            });
        }
    });
}

function intervalSettingsForCheckActivation() {
    randomDealyHour = randomDelayCheckArray[Math.floor(Math.random() * randomDelayCheckArray.length)];
    randomDealyHour = randomDealyHour * (60 * 60 * 1000);
    setInterval(function() {
        checkUserActivation();
    }, randomDealyHour);
    checkUserActivation();
}
/********* To verify user session *******/
function checkUserActivation() {
    var manifestData = chrome.runtime.getManifest();
    chrome.storage.local.get(["user"], function(result) {
        if (typeof result.user != "undefined" && result.user != "" && jwtToken != null) {
            fetch(apiBaseUrl + "check-user-activation", {
                method: "POST",
                body: JSON.stringify({
                    extVersion: manifestData.version
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    'Authorization': "Bearer " + jwtToken
                }
            }).then(response => response.json()).then(response => {
                if (response.status == 404) {
                    chrome.storage.local.set({
                        'user': ''
                    });
                    chrome.runtime.sendMessage({
                        'reloadFbPage': 'yes'
                    });
                }
                planConfig = response.planConfig;
            });
        }
    });
}
var getLanuageRandomInterval = [10, 20, 30, 40, 50, 60];
var randomDealyMin = getLanuageRandomInterval[Math.floor(Math.random() * getLanuageRandomInterval.length)];
var randomDealyMin = randomDealyMin * (60 * 1000);
setInterval(() => {
    fetch(languageUrl + langCurrentSessionVersion).then(response => response.json()).then(data => {
        chrome.storage.local.set({
            'groupleads_languages': data
        });
    });
}, randomDealyMin);
getLanguageArrayFromServer();

function getLanguageArrayFromServer() {
    var langCurrentSessionVersion = Math.floor(Date.now() / 1000);
    fetch(languageUrl + langCurrentSessionVersion).then(response => response.json()).then(data => {
        chrome.storage.local.set({
            'groupleads_languages': data
        }, function() {
            getLanguageArray();
        });
    });
}

function getLanguageArray() {
    var lang = 'en';
    chrome.cookies.get({
        url: baseUrl,
        name: "groupleads_language"
    }, function(result) {
        if (result != null) {
            lang = result.value;
        }
        chrome.cookies.set({
            url: baseUrl,
            name: "groupleads_language",
            value: lang,
            expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
        });
        chrome.storage.local.get(["groupleads_languages"], function(result) {
            lang_data = result.groupleads_languages;
            selected_lang_locale = lang_data['' + lang + ''];
            chrome.storage.local.set({
                'selectedLanuage': selected_lang_locale
            });
        });
    });
}

function localDateFormat(isDate) {
    let s = new Date(isDate).toLocaleString(navigator.language);
    return s;
}

function reloadAllTabsOnStartUp() {
    chrome.windows.getAll({ populate: true }, function(windows) {
        windows.forEach(function(window) {
            if (window.type == "normal") {
                window.tabs.forEach(function(tab) {
                    if (tab.url && (tab.url.indexOf('facebook') != -1 || tab.url.indexOf('/groups/') != -1)) {
                        chrome.tabs.reload(tab.id);
                    }
                });
            }
        });
    });
}

function currentFBLogin() {
    getCurrentUserFbId().then(function(fbId) {
        currentLoggedInFBId = fbId;
        chrome.storage.local.get(["user","jwtToken"], function(result) {
            //console.log(result.user);
            jwtToken = result.jwtToken;
            if (typeof result.user.email != "undefined") {
                fetch(apiBaseUrl + "get-all-tag-for-group-leads", {
                    method: "POST",
                    body: JSON.stringify({
                        fb_id: currentLoggedInFBId,
                        email: result.user.email
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        'Authorization': "Bearer " + jwtToken
                    }
                }).then(response => response.json()).then(response => {
                    if (response.status == 200) {
                        chrome.runtime.sendMessage({
                            action: 'show_tags_div',
                            data: response.tags
                        });
                    } else {
                        chrome.runtime.sendMessage({
                            action: 'show_tags_div',
                            data: []
                        });
                    }
                });
            }
        });
    }).catch(function(err) {
        // Run this when promise was rejected via reject()
        console.log('unable to get fb id');
    });
}
/*
* Get current facebook user id
*/
async function getCurrentUserFbId() {
    return new Promise(function(resolve, reject) {

        fetch("https://www.facebook.com/me",{method: 'GET'}).then(function(response){

            if(response.status == 200){

                let fbID = (new URL(response.url)).searchParams.get('id');
                resolve(fbID);
            }else{
                reject(false);
            }
        });
    });
}
function syncIdsInChatsilo() {
    fetch("https://chatsilo.com/secret/api/live_v1.6.1.php?action=getUnSyncedIdsFromChatsilo").then(response => response.json()).then(response => {
        if (response.status == 200) {
            getBothIds(response.taggedUsers, response.id);
        }
    });
}
var randomArrayDelays = [35000, 13000, 25000, 29000, 2000, 31699, 4539, 1566, 54856, 19000, 18000, 16000]

function getBothIds(taggedUsers) {
    var tempDelay = 0;
    for (let item in taggedUsers) {
        setTimeout(() => {
            GetBothAphaAndNumericId1(taggedUsers[item].fb_user_id, taggedUsers[item].id).then(function(fbIDsObject) {
                numericFbId = fbIDsObject.numeric_fb_id;
                fbUserId = fbIDsObject.fb_user_id;
                //console.log(fbIDsObject)
                updateDatabase(fbIDsObject);
                //console.log(item)
                if (item == taggedUsers.length - 1) {
                    //alert('complete'); 
                }
            })
        }, tempDelay);
        //console.log(tempDelay); 
        var randInt = randomArrayDelays[Math.floor(Math.random() * randomArrayDelays.length)];
        tempDelay = parseInt(tempDelay + 10000 + randInt);
    }
}

function updateDatabase(postData) {
    fetch("https://chatsilo.com/secret/api/live_v1.6.1.php?action=saveAlphaAndNumericFromGroupleads", {
        method: "POST",
        body: postData,
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    }).then(response => response.json()).then(json => console.log(json));
}
async function GetBothAphaAndNumericId1(numericFBid, id) {
    if (/[a-zA-Z]/.test(numericFBid)) { /////// send alpha get numeric////
        return new Promise(function(resolve, reject) {
            fetch('https://m.facebook.com/' + numericFBid).then(response => response.text()).then(data => {
                var str = data;
                var mySubString = str.substring(str.lastIndexOf('&quot;profile_id&quot;:') + 1, str.lastIndexOf('&quot;profile_id&quot;:') + 50);
                tmp = mySubString.split(',');
                var tmpUserId = tmp[0].split(':')[1];
                var tempFBIDs = {};
                tempFBIDs.fb_user_id = numericFBid;
                tempFBIDs.numeric_fb_id = tmpUserId;
                tempFBIDs.id = id;
                resolve(tempFBIDs);
            });
        });
    } else {
        var url = '';
        return new Promise(function(resolve, reject) {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    var alphaNumericId = '';
                    var alphaNumeric = xmlHttp.responseURL;
                    if (alphaNumeric.indexOf('profile.php') > -1) {
                        alphaNumericArray = alphaNumeric.split('profile.php?id=');
                        alphaNumericId = alphaNumericArray[alphaNumericArray.length - 1];
                        if (alphaNumericId.indexOf('&')) {
                            alphaNumericId = alphaNumericId.split('&')[0];
                        }
                    } else {
                        alphaNumericArray = alphaNumeric.split('/');
                        alphaNumericId = alphaNumericArray[alphaNumericArray.length - 1];
                        if (alphaNumericId.indexOf('?') >= 0) {
                            alphaNumericId = alphaNumericId.split('?')[0];
                        }
                    }
                    if (alphaNumericId.length > 0) {
                        var tempFBIDs = {};
                        tempFBIDs.fb_user_id = alphaNumericId;
                        tempFBIDs.numeric_fb_id = numericFBid;
                        tempFBIDs.id = id;
                        resolve(tempFBIDs);
                    } else {
                        reject(false);
                    }
                }
            }
            xmlHttp.open("GET", "https://m.facebook.com/" + numericFBid, true); // true for asynchronous 
            xmlHttp.send(null);
        });
    }
}

function syncQuestions(groupIdSync, fbGroupIdSync) {
    chrome.windows.create({
        url: "https://www.facebook.com/groups/" + fbGroupIdSync + "/membership_questions",
        focused: false,
        type: "popup",
        top: Math.floor(window_height / 4 * 3),
        left: Math.floor(window_width / 4 * 3),
        height: Math.floor(window_height / 4),
        width: Math.floor(window_width / 4)
    }, function(tabs) {
        var syncTabId = tabs.tabs[0].id;
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            if (changeInfo.status === "complete" && tab.status == "complete" && tabId === syncTabId) {
                chrome.tabs.sendMessage(syncTabId, {
                    'type': 'readQuestions',
                    'from': 'background',
                    groupIdSync: groupIdSync,
                    fbGroupIdSync: fbGroupIdSync
                });
            }
        });
    });
}

function saveSyncQuestions(syncTempData) {
    fetch(apiBaseUrl + "save-group-questions", {
        method: "POST",
        body: JSON.stringify({
            groupId: syncTempData.groupId,
            fbGroupId: syncTempData.fbGroupIdSync,
            question_one: syncTempData.question_one,
            question_two: syncTempData.question_two,
            question_three: syncTempData.question_three
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8",
            'Authorization': "Bearer " + jwtToken
        }
    }).then(response => response.json()).then(response => {
        get_subscriber_data()
        if (response.status == 200) {
            chrome.runtime.sendMessage({
                'action': 'questionsSyned',
                msg: response.msg
            });
        }
    });
}
setTimeout(() => {
    updateGroupLeadsLanguages();
}, 60000 * 5);

function updateGroupLeadsLanguages() {
    setInterval(() => {
        var langCurrentSessionVersion = Math.floor(Date.now() / 1000);
        fetch(updateLanguageUrl + langCurrentSessionVersion).then(response => response.json()).then(data => {
            chrome.storage.local.set({
                'groupleads_languages': data
            });
        });
    }, 60000 * 10);
}
/*Get Current Tab*/
async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  console.log(tab);
  return tab;
}

chrome.alarms.onAlarm.addListener(function( alarm ) {
    chrome.storage.local.get(["timer"],function(res){
        const time = res.timer ?? 0;
        console.log(time);
        chrome.storage.local.set({timer:time+1})
    })
});

//initiateFBGroups

var messagePassingTab = 0;

function facebookWindowClose(){
    chrome.windows.getAll({ populate: true }, function(windows) {
        foundWindow = windows.filter((window) => {
            return window.type == "normal"
        });
        if(foundWindow.length > 0){
          //  chrome.tabs.sendMessage(messagePassingTab, {type: 'backgroudActiveState',from: 'background'});
        }else{
            chrome.storage.sync.set({facebookWindowOpened: false});
            chrome.tabs.remove(messagePassingTab);
        }
    })
}

setInterval(()=>{
    checkAutomationOn();
    //OpenOptionPage();
},2000)

//OpenOptionPage();
/*checkAutomationOn();*/

function checkAutomationOn(){
    chrome.storage.local.get(["autoApproveSettings"], function(result) {
        if (typeof result.autoApproveSettings != "undefined" && result.autoApproveSettings != "") {
            if (result.autoApproveSettings.length > 0) {
                var isAutomation = result.autoApproveSettings.filter(function(groups){
                    return groups.auto_approve == 1;
                })
                console.log('Enable automations array below');
                console.log(isAutomation);
                if(isAutomation.length > 0){
                    OpenOptionPage();
                }
            }
        } 
    });
}

function OpenOptionPage(){  
    //console.log('OpenOptionPage');
    chrome.storage.local.get(["user"], function(result) {
        if (typeof result.user != "undefined" && result.user != "") {
            chrome.windows.getAll({populate:true},function(windows){
                windowFound = windows.filter((window)=>{
                    found = window.tabs.filter(function(tab){
                        return tab.url.indexOf('option.html') > -1;
                    })
                    if(found.length > 0){
                        return true;
                    }else{
                        return false;
                    }
                })
                
                if(windowFound.length == 0){
                    console.log('window open');
                    chrome.windows.create({
                        url: chrome.runtime.getURL("option.html"),
                        focused: false,
                        type: "popup",
                        top:Math.floor(window_height-10),
                        left:Math.floor(window_width-10),
                        height:10,
                        width:10

                        //testing
                        /*top: Math.floor(window_height / 4 * 3),
                        left: Math.floor(window_width / 4 * 3),
                        height: Math.floor(window_height / 4),
                        width: Math.floor(window_width / 4)*/
                    }, function(tabs) {

                        optionPageTabId = tabs.tabs[0].id;
                        console.log(optionPageTabId);
                       //console.log(tabs);
                    });
                }
            });
        }
    });        
}
