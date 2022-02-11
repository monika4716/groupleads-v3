console.log('option js');

var automaticGroupSettings = [];

var startCall = '';
chrome.storage.local.set({'automaticGroupSettings':automaticGroupSettings});

setInterval(()=>{
    console.log('send msg for active bg');
    chrome.runtime.sendMessage({type:"activeBackground",from:"option"})
},10000);

setTimeout(()=>{
    console.log('1');
    initiateFBGroups();
},500);

chrome.runtime.onMessage.addListener(function(message, sender, send_response) {
    if(message.type == "automationUpdateSettings" && message.from == "background"){
        console.log('call from clearAutomicIntervals initiateFBGroups');
        chrome.storage.local.get(["automaticGroupSettings"], function(result) {
        automaticGroupSettings = result.automaticGroupSettings;
        console.log(automaticGroupSettings);
            if(automaticGroupSettings != undefined && automaticGroupSettings != ''){
                if (automaticGroupSettings.length > 0) {
                    automaticGroupSettings.forEach(function(item) {
                        console.log(item.invervalId)
                        if (typeof item.invervalId != "undefined"){
                            clearInterval(item.invervalId);
                        } 
                    });
                    automaticGroupSettings = [];
                }
                console.log(automaticGroupSettings);
                chrome.storage.local.set({'automaticGroupSettings':automaticGroupSettings});
            }
            setTimeout(() => {
                console.log('startCall '+startCall);
                clearInterval(startCall);
                initiateFBGroups();
            },500);
        });
    }
})

function initiateFBGroups() {
    console.log('initiateFBGroups in');
    startCall = setInterval(function() {
        chrome.storage.local.get(["user", "autoApproveSettings","automaticGroupSettings"], function(result) {
            console.log(result.autoApproveSettings);
            console.log(result.automaticGroupSettings);
            if (typeof result.user != "undefined" && result.user != "") {
                if (typeof result.autoApproveSettings != "undefined" && result.autoApproveSettings != "") {
                    console.log('startCall '+startCall);
                    clearInterval(startCall);
                    if (result.autoApproveSettings.length > 0) {
                        console.log(result.autoApproveSettings.length);
                        var iterationDelayForApproveAndDecline = 0;
                        var iterationDelayForDecline = 0;
                        var runFirstGroupAutomation = true;
                        var alreadyExistIntervalTime = [];
                        //console.log(result.autoApproveSettings);
                         console.log('runFirstGroupAutomation : '+runFirstGroupAutomation);
                         console.log(result.autoApproveSettings)
                        result.autoApproveSettings.forEach(function(item, i) {
                            var groupItem = item;             
                            if (groupItem.auto_approve == 1) {
                                console.log(groupItem);
                                console.log('if 1');
                                setTimeout(() => {
                                    if (alreadyExistIntervalTime.length == 0) {
                                        alreadyExistIntervalTime.push(groupItem.interval_min);
                                    } else if (alreadyExistIntervalTime.length > 0 && alreadyExistIntervalTime.indexOf(groupItem.interval_min) > -1) {
                                        groupItem.interval_min = groupItem.interval_min + 2;
                                        if (alreadyExistIntervalTime.indexOf(groupItem.interval_min) > -1) {
                                            groupItem.interval_min = Math.max.apply(Math, alreadyExistIntervalTime) + 2;
                                        }
                                        alreadyExistIntervalTime.push(groupItem.interval_min);
                                    }
                                    console.log('New interval===' + groupItem.interval_min);
                                    automation_interval_min = groupItem.interval_min;
                                    console.log(groupItem.interval_min * 60 * 1000);
                                    var invervalId = setInterval(() => {
                                        chrome.runtime.sendMessage({type:"activeBackground",from:"option"})
                                        console.log('run in interval');
                                        console.log('New interval===' + groupItem.interval_min);
                                       // openTab(item, invervalId);
                                       setTimeout(()=>{
                                            chrome.runtime.sendMessage({'from': 'optionPage','type':'openTabWithInterval','item':groupItem,'invervalId':invervalId});
                                       },200);
                                        
                                    },groupItem.interval_min * 60 * 1000);
                                    /***************/
                                    tempGroupData = {};
                                    tempGroupData.groupId = groupItem.fb_group_id;
                                    tempGroupData.invervalId = invervalId;
                                    tempGroupData.interval = groupItem.interval_min;

                                    console.log(tempGroupData);
                                    automaticGroupSettings.push(tempGroupData);
                                    chrome.storage.local.set({'automaticGroupSettings':automaticGroupSettings});
                                   
                                    /***************/
                                    console.log('runFirstGroupAutomation : '+runFirstGroupAutomation);
                                    if (runFirstGroupAutomation) {
                                        console.log('run without interval');
                                        runFirstGroupAutomation = false
                                        console.log('runFirstGroupAutomation : '+runFirstGroupAutomation);
                                        console.log(automaticGroupSettings);
                                        chrome.runtime.sendMessage({from: 'optionPage',type:'openTab',item:groupItem});
                                        //openTab(item);
                                    }
                                    console.log('runFirstGroupAutomation : '+runFirstGroupAutomation);
                                }, iterationDelayForApproveAndDecline);
                                iterationDelayForApproveAndDecline = iterationDelayForApproveAndDecline + 2000;
                            }
                        });
                    }
                }
            }
        });
    }, 3000);
}

function facebookWindowClose(){
    chrome.windows.getAll({ populate: true }, function(windows) {
        foundWindow = windows.filter((window) => {
            return window.type == "normal" || (window.type == "popup" && window.tabs[0].url.indexOf('/group/') > 0);
        });
        if(foundWindow.length > 0){
          //  chrome.tabs.sendMessage(messagePassingTab, {type: 'backgroudActiveState',from: 'background'});
        }else{
            window.close();
            chrome.runtime.sendMessage({type:'optionWindowClose'});
        }
    })

    chrome.storage.local.get(["user"], function(result) {
        if(result.user == 'undefined' || result.user == ''){
            window.close();
            chrome.runtime.sendMessage({type:'optionWindowClose'});
        }
    })
}


setInterval(()=>{
    facebookWindowClose();
},20000);



chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (typeof changes.autoApproveSettings != "undefined") {
        console.log('checkAutomationOnforCloseWindow');
        checkAutomationOnforCloseWindow();
    }
});

function checkAutomationOnforCloseWindow(){
    chrome.storage.local.get(["autoApproveSettings"], function(result) {
        console.log('checkAutomationOnforCloseWindow');
        console.log(result.autoApproveSettings);
        if (typeof result.autoApproveSettings != "undefined" && result.autoApproveSettings != "") {
            if (result.autoApproveSettings.length > 0) {
                var isAutomation = result.autoApproveSettings.filter(function(groups){
                    return groups.auto_approve == 1;
                })
                if(isAutomation.length == 0){
                    window.close();
                    chrome.runtime.sendMessage({type:'optionWindowClose'});
                }
            }
        } 
    });
}

