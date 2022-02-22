var isMessageAutoStartMessageReceived = true; 
var allMemberRequestData = [];
var autoSettingsOfCurrentGroup = [];
var validMemberRequestData = [];
var currentGroupTabId = null;

var loadRequestCounter = 0;

function isEmailExist(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  if(regex.test(email)){
  	return true;
  }else{
  	return false;
  }
}

function showAutomationOverlayMessages(tabIdForAutmation, autoSettingsOfGroup) {
	if (isMessageAutoStartMessageReceived && (window.location.pathname.indexOf('participant_requests') > -1 || window.location.pathname.indexOf('member-requests') > -1)) {
		isMessageAutoStartMessageReceived = false; 
		var checkGLModalInterval = setInterval(function(){
			if($("#overlay-gr").length > 0){
				clearInterval(checkGLModalInterval);
				$("#overlay-gr").show();
				$("#overlay-gr .gr-msg").text("Automation starts in 30 seconds");
				$("#overlay-gr .close").hide();

				setTimeout(()=>{
					$("html, body").animate({ scrollTop: $(document).height() }, 1000);
				}, 1000)
			} 
		}, 100);
		
		setTimeout(()=>{
			if(autoApproveProcess && $("div[aria-label='Approve']").length > 0){
				$("#overlay-gr .gr-msg").text("Automation is running");
				autoStartScraping(tabIdForAutmation, autoSettingsOfGroup);
			}else{
				console.log('Not found any request.');
				console.log('window close 0')
				window.close();
				chrome.runtime.sendMessage({type: "closeSenderTab"});
				//chrome.runtime.sendMessage({'action':'remove_automation_tab',tabId: tabIdForAutmation});
			}
		},10000);
	}
}


function autoStartScraping(tabId, autoSettingsOfGroup) {
	//console.log('in autoStartScraping fun');
	setTimeout(()=>{
	    autoApproveProcess = false;
	    currentGroupTabId = tabId;
		autoSettingsOfCurrentGroup = autoSettingsOfGroup;

		if (window.location.pathname.indexOf('participant_requests') > -1) {
			//console.log('participant_requests');
			if(autoSettingsOfCurrentGroup.gender_filter == 0){
				//console.log('gender_filter 0');
					processAfterGenderCheck(currentGroupTabId);
			}else{
				console.log('in participant_requests else');
				if($('#pagelet_bluebar').length == 0) {
					//console.log('participant_requests if');
					if($(RightSiteBarSelector).find('div[role="tablist"]').length > 0 ) {
						console.log('if gender');

						console.log('autoSettingsOfCurrentGroup '+autoSettingsOfCurrentGroup);
						$(RightSiteBarSelector).find('div[role="tablist"] span:containsI(Gender):eq(0)').mclick();
						findGenderOptions = setInterval(()=>{
							console.log($('div[aria-checked="false"] span:containsI(Female)').length);
							if($('div[aria-checked="false"] span:containsI(Female)').length > 0 || $('div[aria-expanded="false"]span:containsI(Female)').length > 0){
								if (autoSettingsOfCurrentGroup.gender_filter == 1) {
									$('div[aria-checked="false"] span:containsI(Male)').mclick();
								}else if(autoSettingsOfCurrentGroup.gender_filter == 2){
									$('div[aria-checked="false"] span:containsI(Female)').mclick();
								}
							}
						},200);
						processAfterGenderCheck(currentGroupTabId);
					}else if ($('div[aria-label="Group Admin Tools"][role="navigation"] span:containsI("Gender"):eq(0)').length > 0) {		
						console.log('else if gender');
						$('div[aria-label="Group Admin Tools"][role="navigation"] span:containsI("Gender"):eq(0)').mclick();
						findGenderOptions = setInterval(()=>{
				
							if($('.qzhwtbm6.knvmm38d:containsI("Hide women")').length > 0 || $('.qzhwtbm6.knvmm38d:containsI("Female")').length > 0){
								clearInterval(findGenderOptions);
								//console.log(autoSettingsOfCurrentGroup.gender_filter);
								if (autoSettingsOfCurrentGroup.gender_filter == 1) {
									//console.log('here if');
									$('.qzhwtbm6.knvmm38d:containsI("Hide women")').mclick();
									$('.qzhwtbm6.knvmm38d:containsI("Male")').mclick();
								}else if(autoSettingsOfCurrentGroup.gender_filter == 2){
									//console.log('here else');
									$('.qzhwtbm6.knvmm38d:containsI("Hide men")').mclick();
									$('.qzhwtbm6.knvmm38d:containsI("Female")').mclick();
								}
								//processAfterGenderCheck(currentGroupTabId);
							}
						}, 200)
						processAfterGenderCheck(currentGroupTabId);
					}
				}else{
					//console.log('participant_requests else');
					if ($('a[role="button"] span:containsI("Gender")').length > 0) {
						$('a[role="button"] span:containsI("Gender")').mclick();

						findGenderOptions = setInterval(()=>{
							if($('a[role="menuitem"] span:containsI("Hide women")').length > 0 || $('a[role="menuitem"] span:containsI("Female")').length > 0){
								clearInterval(findGenderOptions);
								if (autoSettingsOfCurrentGroup.gender_filter == 1) {
									//console.log('hwre 1')
									$('a[role="menuitem"] span:containsI("Hide women")').mclick();
									$('a[role="menuitem"] span:containsI("Male")').mclick();
								}else{
									//console.log('hwre 2')

									$('a[role="menuitem"] span:containsI("Hide men")').mclick();
									$('a[role="menuitem"] span:containsI("Female")').mclick();
								}
								processAfterGenderCheck(currentGroupTabId);
							}
						}, 200)
					}
				}
			}
			//processAfterGenderCheck(currentGroupTabId)
		}else if((autoSettingsOfCurrentGroup.enable_auto_decline == 1 && autoSettingsOfCurrentGroup.auto_approve == 0 ) ||  autoSettingsOfCurrentGroup.gender_filter == 0){
			processAfterGenderCheck(currentGroupTabId);
		}else{
			//console.log('if');
			if ($('#pagelet_bluebar').length ==0) {
				if($(RightSiteBarSelector).find('div[role="tablist"]').length > 0) {
					console.log('if gender');
					$(RightSiteBarSelector).find('div[role="tablist"] span:containsI(Gender):eq(0)').mclick();
					findGenderOptions = setInterval(()=>{
						console.log($('div[aria-checked="false"] span:containsI(Female)').length);
						if($('div[aria-checked="false"] span:containsI(Female)').length > 0){
							console.log('in')
							clearInterval(findGenderOptions);
							if (autoSettingsOfCurrentGroup.gender_filter == 1) {
								//console.log('here if male');
								$('div[aria-checked="false"] span:containsI(Male)').mclick();
							}else if(autoSettingsOfCurrentGroup.gender_filter == 2){
								//console.log('here else female');
								$('div[aria-checked="false"] span:containsI(Female)').mclick();
							}
						}

					},200);
					processAfterGenderCheck(currentGroupTabId);
				}else if ($('div[aria-label="Group Admin Tools"][role="navigation"] span:containsI("Gender"):eq(0)').length > 0) {
										
					$('div[aria-label="Group Admin Tools"][role="navigation"] span:containsI("Gender"):eq(0)').mclick();

					findGenderOptions = setInterval(()=>{
			
						if($('.qzhwtbm6.knvmm38d:containsI("Hide women")').length > 0 || $('.qzhwtbm6.knvmm38d:containsI("Female")').length > 0){
							clearInterval(findGenderOptions);
							//console.log(autoSettingsOfCurrentGroup.gender_filter);
							if (autoSettingsOfCurrentGroup.gender_filter == 1) {
								//console.log('here if');
								$('.qzhwtbm6.knvmm38d:containsI("Hide women")').mclick();
								$('.qzhwtbm6.knvmm38d:containsI("Male")').mclick();
							}else if(autoSettingsOfCurrentGroup.gender_filter == 2){
								//console.log('here else');
								$('.qzhwtbm6.knvmm38d:containsI("Hide men")').mclick();
								$('.qzhwtbm6.knvmm38d:containsI("Female")').mclick();
							}
							//processAfterGenderCheck(currentGroupTabId);
						}
					}, 200)

					processAfterGenderCheck(currentGroupTabId);
				}
			}else{
				//console.log('else');

				if ($('a[role="button"] span:containsI("Gender")').length > 0) {
					$('a[role="button"] span:containsI("Gender")').mclick();

					findGenderOptions = setInterval(()=>{
						if($('a[role="menuitem"] span:containsI("Hide women")').length > 0 || $('a[role="menuitem"] span:containsI("Female")').length > 0){
							clearInterval(findGenderOptions);
							if (autoSettingsOfCurrentGroup.gender_filter == 1) {
								$('a[role="menuitem"] span:containsI("Hide women")').mclick();
								$('a[role="menuitem"] span:containsI("Male")').mclick();
							}else{
								$('a[role="menuitem"] span:containsI("Hide men")').mclick();
								$('a[role="menuitem"] span:containsI("Female")').mclick();
							}
							processAfterGenderCheck(currentGroupTabId);
						}
					}, 200)
				}

			}
		}
	},3000)
}

function processAfterGenderCheck(tabId){
	//console.log('processAfterGenderCheck');
	setTimeout(()=>{

		let tabTitle = getTabTitleText()
		requestCountArray = tabTitle.replace(/[^0-9]/g,'');

		autoLoadAllRequests(requestCountArray,tabId);

		if ($("div[aria-label='Approve']").length == 0) {
			
			autoApproveProcess = true;
			console.log('window close 1')
			window.close();
			chrome.runtime.sendMessage({type: "closeSenderTab"});	
		}
	},5000)
	
}

function autoLoadAllRequests(totalRequests = 0,tabId, preLoaded = 0){	
	//console.log('autoLoadAllRequests')
	loadedRequests = 0;
	if($('#pagelet_bluebar').length ==0){
		loadedRequests = $(RightSiteBarSelector+" div[aria-label='Approve']").length;
	} else {
		loadedRequests = $(RightSiteBarSelector+" ul.uiList._4kg._4kt._6-h._6-j li[data-testid]").length;
	}
	//console.log(loadedRequests);
	//console.log(autoSettingsOfCurrentGroup);
	if ($(RightSiteBarSelector+" div[aria-label='Approve']").length ==  preLoaded) {	
		loadRequestCounter++;
	}else if(loadedRequests > 0){

		if(loadedRequests > 0){
			//console.log(autoSettingsOfCurrentGroup);
			if (
				autoSettingsOfCurrentGroup.enable_auto_decline == 1 && 
				(
					(autoSettingsOfCurrentGroup.auto_decline_countries != '' && 
						autoSettingsOfCurrentGroup.auto_decline_countries != null) || 

					(autoSettingsOfCurrentGroup.auto_decline_keywords != '' && 
						autoSettingsOfCurrentGroup.auto_decline_keywords != null) 
				)
			)
			{
				console.log('go for auto decline');
				if($('#pagelet_bluebar').length ==0){
					startDeclineRequestsNew(loadedRequests);
				} else {
					startDeclineRequests(loadedRequests);
				}
			}else{
				console.log('automation auto_approve')
				
				if (autoSettingsOfCurrentGroup.auto_approve == 1) {
					console.log('go for auto aprove');
					if($('#pagelet_bluebar').length ==0){
						console.log('startAllGroupDataNew');
							setTimeout(()=>{
								startAllGroupDataNew(loadedRequests);
							},1000)
					} else {
						console.log('startAllGroupData');
						startAllGroupData(loadedRequests);
					}
				}
			}
			return false; 
		}else{
			chrome.runtime.sendMessage({type: "closeSenderTab"});	
		}
	}else{
		loadRequestCounter = 0;
	}

	if( loadedRequests < 50 && loadedRequests < totalRequests){
		$("html, body").animate({ scrollTop: $(document).height() }, 1000);
		setTimeout(function(){
			autoLoadAllRequests(totalRequests,tabId, loadedRequests);
		},1000);
	} else {
		if(loadedRequests > 0){
			if (autoSettingsOfCurrentGroup.enable_auto_decline == 1) {
				if($('#pagelet_bluebar').length == 0){
					startDeclineRequestsNew(loadedRequests);
				} else {
					startDeclineRequests(loadedRequests);
				}
			}else{
				if (autoSettingsOfCurrentGroup.auto_approve == 1) {
					if($('#pagelet_bluebar').length == 0){
							setTimeout(()=>{
								startAllGroupDataNew(loadedRequests);
							},1000)
					} else {
						startAllGroupData(loadedRequests);
					}
				}
			}
		}
	}
}

function startDeclineRequestsNew(loadedRequests=0) { // VERIFIED
		console.log('startDeclineRequestsNew')
		var checkScrapedRequests = setTimeout(function(){
		///if(groupData.length == loadedRequests){
		//	clearInterval(checkScrapedRequests);
			//console.log(groupData);  // 7, 9, 11
			validMemberRequestData = [];
			autoDeclineDelay = 0;
			groupData.forEach(function (item, i) {
			
				setTimeout(()=>{
			
					memerId = item[1].split('/');
					memerId = memerId[memerId.length-1];
					
					$memberElement = $(RightSiteBarSelector+" "+MemberRequestSelector+"[data-testid='"+memerId+"']");

					console.log(memerId);
					console.log($memberElement);
					if($memberElement.length > 0){
						console.log('memberElement in')
									
						var validMemberRequestToDecline = false;
						
						anserswersText = item[7]+' '+item[9]+' '+item[11];

						console.log(anserswersText)

						console.log(autoSettingsOfCurrentGroup.auto_decline_keywords);
						if(autoSettingsOfCurrentGroup.auto_decline_keywords != ''){

							allKeywords = JSON.parse(autoSettingsOfCurrentGroup.auto_decline_keywords);
				
					    allKeywords.forEach(function (oneKeyword) {
						    if(anserswersText.toLowerCase().indexOf(oneKeyword.toLowerCase()) > -1 && !validMemberRequestToDecline) {
									validMemberRequestToDecline = true;
								}
					    })
						}

						console.log('validMemberRequestToDecline ' +validMemberRequestToDecline);
					  if (!validMemberRequestToDecline && autoSettingsOfCurrentGroup.auto_decline_countries != null && autoSettingsOfCurrentGroup.auto_decline_countries != '') {

					    var livesIn  = $(RightSiteBarSelector+" "+MemberRequestSelector+"[data-testid='"+memerId+"'] "+memberRequestMetaDataContainer+" span:containsI(Lives in)").find('a').text();
							console.log(livesIn);
					
							if(livesIn == ''){
								livesIn  = $(RightSiteBarSelector+" "+MemberRequestSelector+"[data-testid='"+memerId+"'] "+memberRequestMetaDataContainer+" span:containsI(From )").find('a').text();
							}

							console.log(livesIn);

						    allCountries = JSON.parse(autoSettingsOfCurrentGroup.auto_decline_countries);
			
						  allCountries.forEach(function (oneCountry) {
						  	console.log(livesIn.toLowerCase());
						  	console.log(oneCountry.toLowerCase())
							  if(livesIn.toLowerCase().indexOf(oneCountry.toLowerCase()) > -1 && !validMemberRequestToDecline) {
									validMemberRequestToDecline = true;
								}
						  })
					  }
				    	
						if(validMemberRequestToDecline){
							console.log(validMemberRequestToDecline);

							console.log('actualFBDecline : ' +actualFBDecline);
							
							if(actualFBDecline){

								console.log('in side  decline btn click')
     						//$memberElement.find("div[aria-label='Decline']:not(.decline_one)").mclick();
     						console.log('test')
     						port = chrome.runtime.connect({ 'name': 'formfiller'})
     						port.postMessage({'type': 'verifyGoogleSheetfordecline','google_sheet_url': currentGroupDetails[0].google_sheet_url,'memberId':memerId, 'autodecline':true});
     					
							}
						}

					

						if (i == groupData.length-1) {
							setTimeout(()=>{
								if (autoSettingsOfCurrentGroup.auto_approve == 1) {
									console.log('startAllGroupDataNew');
									startAllGroupDataNew(groupData.length);
								}else{
									autoApproveProcess = true;
									console.log('window close 2');
									window.close();
									chrome.runtime.sendMessage({type: "closeSenderTab"});	
								}
							},15000);	
						}
					} else {
						console.log('not found');
					}
				},autoDeclineDelay);
				console.log(autoDeclineDelay);
				autoDeclineDelay = autoDeclineDelay + 5000;

			});

		//}
	},500);		
}

function startDeclineRequests(loadedRequests=0) {
		console.log('startDeclineRequests');
		var checkScrapedRequests = setTimeout(function(){
		//if(groupData.length == loadedRequests){
			//clearInterval(checkScrapedRequests);
			// console.log(groupData);  // 7, 9, 11
			validMemberRequestData = [];
			autoDeclineDelay = 0;
			groupData.forEach(function (item, i) {
			
				setTimeout(()=>{
			
					memerId = item[1].split('/');
					memerId = memerId[memerId.length-1];
					
					$memberElement = $(RightSiteBarSelector+" ul.uiList._4kg._4kt._6-h._6-j li[data-testid='"+memerId+"']");
					if($memberElement.length > 0){
									
						var validMemberRequestToDecline = false;
						
						anserswersText = item[7]+' '+item[9]+' '+item[11];

					    allKeywords = JSON.parse(autoSettingsOfCurrentGroup.auto_decline_keywords);
				
					    allKeywords.forEach(function (oneKeyword) {
						    if(anserswersText.indexOf(oneKeyword) > -1 && !validMemberRequestToDecline) {
								validMemberRequestToDecline = true;
							}
					    })
						
						if(validMemberRequestToDecline){
							//console.log('valid'+memerId);
							if(actualFBDecline){
								console.log('in side actual decline click');
								console.log('test');
								/*console.log($memberElement.find("button[name='decline']:not(.decline_one)").length)
								$memberElement.find("button[name='decline']:not(.decline_one)").mclick();*/
								port = chrome.runtime.connect({ 'name': 'formfiller'})
								port.postMessage({'type': 'verifyGoogleSheetfordecline','google_sheet_url': currentGroupDetails[0].google_sheet_url,'memberId':memerId, 'autodecline':true});
							}
						}

						//console.log(i);
						//console.log(groupData.length-1);

						if (i == groupData.length-1) {
						
							setTimeout(()=>{
								if (autoSettingsOfCurrentGroup.auto_approve == 1) {
									/*console.log(groupData.length);*/
									startAllGroupData(groupData.length);
								}else{
									autoApproveProcess = true;
									console.log('window close 3')
									window.close();
									chrome.runtime.sendMessage({type: "closeSenderTab"});	
								}
							},1000);	
						}
					}
				},autoDeclineDelay);

				autoDeclineDelay = autoDeclineDelay + 5000;

			});

		//}
	},500);		
}

function startAllGroupDataNew(loadedRequests=0) { // VERIFIED
	
	console.log('startAllGroupDataNew');

	loadedRequests = $("div[aria-label='Approve']").length;

	var checkScrapedRequests = setTimeout(function() {
		//	if(groupData.length == loadedRequests){
			//clearInterval(checkScrapedRequests);
			
			validMemberRequestData = [];

			groupData.forEach(function (item, i) {
				var oneMemberData = [];
				memerId = item[1].split('/');
				memerId = memerId[memerId.length-1];
				//console.log(memerId);
				$memberElement = $(RightSiteBarSelector+" "+MemberRequestSelector+"[data-testid='"+memerId+"']");
			
				console.log($memberElement);

				if($memberElement.length > 0){
					console.log("get in "+$memberElement.length);

					var validMemberRequest = true;
					
					var mutualFriends = 0;
					var commonGroup = 0;
					var friendsInGroup = 0;
					var livesIn = '';
					///////////rule filter//////////////

					console.log('validMemberRequest 0 ' +validMemberRequest);

					if (autoSettingsOfCurrentGroup.rule_filter == 1 && $(RightSiteBarSelector+" "+MemberRequestSelector+"[data-testid='"+memerId+"']").find('span:containsI("agree to the group rules from the admin")').length > 0) {

						if($(RightSiteBarSelector+" "+MemberRequestSelector+"[data-testid='"+memerId+"']").find('span:containsI("agree to the group rules from the admin")').next().find('span:containsI("No response")').length > 0){
							validMemberRequest = false;
							console.log('validMemberRequest 1 ' +validMemberRequest);
							
						}

					}

					/****** Scrap Lives in Filter***********/
					livesIn  = $(RightSiteBarSelector+" "+MemberRequestSelector+"[data-testid='"+memerId+"'] "+memberRequestMetaDataContainer+" span:containsI(Lives in)").find('a').text();
					
					if(livesIn == ''){
						livesIn  = $(RightSiteBarSelector+" "+MemberRequestSelector+"[data-testid='"+memerId+"'] "+memberRequestMetaDataContainer+" span:containsI(From )").find('a').text();
					}

					let totalTextIsArray = [];

					if($memberElement.find(MemberRequestSelectorForFriendsDetails).first().find('span').length > 0){
						totalTextIs = $memberElement.find(MemberRequestSelectorForFriendsDetails).first().find('span')[0].innerText;
						totalTextIsArray = totalTextIs.split('·');
					}
					
					console.log(totalTextIsArray);

					totalTextIsArray.forEach(function (textItem) {
						console.log(textItem)
						if( (textItem.indexOf(" Friends in Group")!=-1)){
							friendsInGroup =  textItem.split(' Friends in Group')[0];
						}else if( (textItem.indexOf(" Friend in Group")!=-1)){
							friendsInGroup =  textItem.split(' Friend in Group')[0];
						}else if((textItem.indexOf(" friends in group")!=-1)){
							console.log('in friends in group')
							friendsInGroup =  textItem.split(' friends in group')[0];
						}else if ( textItem.indexOf(" Mutual")!=-1){
							mutualFriends =  textItem.split(' Mutual')[0];
						}else if ( textItem.indexOf(" mutual friends")!=-1){
							console.log('in mutual friends')
							mutualFriends =  textItem.split(' mutual friends')[0];
						}else if ( textItem.indexOf(" mutual friend")!=-1){
							mutualFriends =  textItem.split(' mutual friend')[0];
						}else if( (textItem.indexOf(" friend in group")!=-1)){
							friendsInGroup =  textItem.split(' friend in group')[0];
						}

						console.log(friendsInGroup);
						console.log(mutualFriends);
					})

					commonGroupText = $memberElement.find(MemberRequestSelectorForFriendsDetails).find('span:containsI(in Common)').text().split('·');
					
					if (commonGroupText.length > 0 && commonGroupText[0].indexOf('in Common') > -1) {
						commonGroupTextArray = commonGroupText[0].split('in Common');

						//commonGroup  = commonGroupText[0].replace(/[^0-9]/g,'');

						commonGroup  = commonGroupTextArray[0].replace(/[^0-9]/g,'');
						console.log("commonGroup: "+ commonGroup);
					}else if(commonGroupText.length > 0 && commonGroupText[0].indexOf('in common') > -1){
							commonGroupTextArray = commonGroupText[0].split('in common');

						//commonGroup  = commonGroupText[0].replace(/[^0-9]/g,'');

						commonGroup  = commonGroupTextArray[0].replace(/[^0-9]/g,'');
						console.log("commonGroup: "+ commonGroup);

					}


					
					/************** Filter request ******************/
					
					/******** all_answered Filter implementation ******/
					console.log('validMemberRequest 1.5 ' +validMemberRequest);

					console.log(autoSettingsOfCurrentGroup.all_answered);
					if(autoSettingsOfCurrentGroup.all_answered == 1){
						if(item[6] !='' && item[7] !='' && item[8] !='' && item[9] !='' && item[10] !='' && item[11] !=''){
							
						} else {
					
							validMemberRequest = false;
						}						
					}

					console.log('validMemberRequest 2 ' +validMemberRequest);
					
					/* 'Email must be in one of the questions' Filter implementation */
					if(validMemberRequest && autoSettingsOfCurrentGroup.is_email == 1){

						
						if( isEmailExist($.trim(item[7]))  || isEmailExist($.trim(item[9]))   || isEmailExist($.trim(item[11])) ){
							
						}else{
							validMemberRequest = false;
						}						
					}

					console.log('validMemberRequest 3 ' +validMemberRequest);
					
					/* 'mutual_friends' Filter implementation */

					console.log(validMemberRequest);
		
					if(validMemberRequest && autoSettingsOfCurrentGroup.mutual_friends >= 0){
						console.log("mutual friend : "+mutualFriends);
						if(mutualFriends >= autoSettingsOfCurrentGroup.mutual_friends){
							
						} else {
					
							validMemberRequest = false; 
						}
					}
					
					console.log('validMemberRequest 4 ' +validMemberRequest);
					/* 'common_groups' Filter implementation */
					console.log(commonGroup)
					if(validMemberRequest && autoSettingsOfCurrentGroup.common_groups >= 0){
						if(commonGroup >= autoSettingsOfCurrentGroup.common_groups){
							
						} else {
						
							validMemberRequest = false; 
						}
					}
					
					console.log('validMemberRequest 5 ' +validMemberRequest);
					/* 'friends_in_group' Filter implementation */
					if(validMemberRequest && autoSettingsOfCurrentGroup.friends_in_group >= 0){
						console.log("friends In Group : "+friendsInGroup);

						console.log(friendsInGroup);
						console.log(autoSettingsOfCurrentGroup.friends_in_group);
						if(friendsInGroup >= autoSettingsOfCurrentGroup.friends_in_group ){
							
						} else {
					
							validMemberRequest = false; 
						}
					}
					console.log('validMemberRequest 6 ' +validMemberRequest);

					/* 'lives_in' Filter implementation */
					if(validMemberRequest && autoSettingsOfCurrentGroup.lives_in != null && autoSettingsOfCurrentGroup.lives_in != ''){
						
						if(livesIn.toLowerCase().indexOf(autoSettingsOfCurrentGroup.lives_in.toLowerCase()) > -1){					

						} else {
						
							validMemberRequest = false; 
						}
					}
					console.log('validMemberRequest 7 ' +validMemberRequest);
					/* 'When Joined Facebook' Filter implementation */	
					
					if(validMemberRequest){
						if (autoSettingsOfCurrentGroup.when_joined == 'all') {
							
							
						} else if ( parseInt(autoSettingsOfCurrentGroup.when_joined) >= 1 && validateJoinWhenForNew(item[5],parseInt(autoSettingsOfCurrentGroup.when_joined)) ){

							
						}else{
						
							validMemberRequest = false; 
						}
					}		
					console.log('validMemberRequest 8 ' +validMemberRequest);

					/* Add request if valid as per filters */
					if(validMemberRequest){
						validMemberRequestData.push(item);
						$memberElement.find("div[aria-label='Approve']").addClass('groupleads-auto-approve');
					}else{
						$memberElement.find("div[aria-label='Decline']").addClass('groupleads-auto-decline-with-approve');
					}
				}
			});

			console.log(validMemberRequestData);
			if(validMemberRequestData.length > 0 ){
				groupCurrentName = getGroupName();
				port = chrome.runtime.connect({ 'name': 'formfiller'})
				port.postMessage({'type': 'callGoogleSheet','fbGroupData': validMemberRequestData,'currentGroupDetails':currentGroupDetails, 'groupCurrentName' :groupCurrentName,  'currentGroupTabId' :currentGroupTabId});	
			}else{
				console.log('window close 4');
				window.close();
				chrome.runtime.sendMessage({type: "closeSenderTab"});	
			}

	},500);		
}


function startAllGroupData(loadedRequests=0) {
	console.log('startAllGroupData')
	loadedRequests = $(RightSiteBarSelector+" ul.uiList._4kg._4kt._6-h._6-j li[data-testid]").length;
	console.log(loadedRequests)
	var checkScrapedRequests = setTimeout(function(){
		//if(groupData.length == loadedRequests){
		//	clearInterval(checkScrapedRequests);

			validMemberRequestData = [];
			groupData.forEach(function (item, i) {
				var oneMemberData = [];
				memerId = item[1].split('/');
				memerId = memerId[memerId.length-1];
				
				$memberElement = $(RightSiteBarSelector+" ul.uiList._4kg._4kt._6-h._6-j li[data-testid='"+memerId+"']");
				if($memberElement.length > 0){
								
					var validMemberRequest = true;
					
					var mutualFriends = 0;
					var commonGroup = 0;
					var friendsInGroup = 0;
					var livesIn = '';

					///////////rule filter//////////////

					if (autoSettingsOfCurrentGroup.rule_filter == 1 && $(RightSiteBarSelector+" ul.uiList._4kg._4kt._6-h._6-j li[data-testid='"+memerId+"']").find('div:containsI("agree to the group rules from the admin")').length > 0) {
						$(RightSiteBarSelector+" ul.uiList._4kg._4kt._6-h._6-j li[data-testid='"+memerId+"']").find('div:containsI("agree to the group rules from the admin")').closest('div._4wsr').addClass('gl-check-rules');																																												
						if($(RightSiteBarSelector+" ul.uiList._4kg._4kt._6-h._6-j li[data-testid='"+memerId+"'] div.gl-check-rules:containsI('No response')").length > 0){
							validMemberRequest = false;
						}
					}

					
					/****** Scrap Lives in Filter***********/
					livesIn  = $("li[data-testid='"+memerId+"'] ul li:containsI(Lives in)").find('a').text();
					
					if(livesIn == ''){
						livesIn  = $("li[data-testid='"+memerId+"'] ul li:containsI(From )").find('a').text();
					}
					console.log(livesIn);
					
					$memberElement.find('._45fk.fsm.fwn.fcg').find('a').each(function(index) {
						console.log($(this));
						if ( $(this).text().indexOf(" Mutual")!=-1){
							mutualFriends =  $(this).text().split(' Mutual')[0];
						} else if($(this).text().indexOf(" Group in Common")!=-1){
							commonGroup =  $(this).text().split(' Group in Common')[0];
						}else if($(this).text().indexOf(" Groups in Common")!=-1){
							commonGroup =  $(this).text().split(' Groups in Common')[0];
						}else if( ($(this).text().indexOf(" Friends in Group")!=-1)){
							friendsInGroup =  $(this).text().split(' Friends in Group')[0];
						}else if( ($(this).text().indexOf(" Friend in Group")!=-1)){
							friendsInGroup =  $(this).text().split(' Friend in Group')[0];
						}
					});
					
					/************** Filter request ******************/
					
					/******** all_answered Filter implementation ******/
					if(autoSettingsOfCurrentGroup.all_answered == 1){
						if(item[6] !='' && item[7] !='' && item[8] !='' && item[9] !='' && item[10] !='' && item[11] !=''){
							
						} else {
							
							validMemberRequest = false;
						}						
					}
					
				
					/* 'Email must be in one of the questions' Filter implementation */
					if(validMemberRequest && autoSettingsOfCurrentGroup.is_email == 1){
						if( isEmailExist($.trim(item[7]))  || isEmailExist($.trim(item[9]))   || isEmailExist($.trim(item[11])) ){
							
						} else {
							
							validMemberRequest = false;
						}						
					}
					
					/* 'When Joined Facebook' Filter implementation */
					
					if(validMemberRequest){
						if (autoSettingsOfCurrentGroup.when_joined == 'all') {
							
						} else if ( parseInt(autoSettingsOfCurrentGroup.when_joined) >= 1 && validateJoinWhen(item[5],parseInt(autoSettingsOfCurrentGroup.when_joined)) ){
							
						}else{
						
							validMemberRequest = false; 
						}
					}
					
					/* 'mutual_friends' Filter implementation */
					
					if(validMemberRequest && autoSettingsOfCurrentGroup.mutual_friends >= 0){
						if(mutualFriends >= autoSettingsOfCurrentGroup.mutual_friends){
							
						} else {
							
							validMemberRequest = false; 
						}
					}
					
					/* 'common_groups' Filter implementation */
					if(validMemberRequest && autoSettingsOfCurrentGroup.common_groups >= 0){
						if(commonGroup >= autoSettingsOfCurrentGroup.common_groups){
							
						} else {
							
							validMemberRequest = false; 
						}
					}
					
					/* 'friends_in_group' Filter implementation */
					if(validMemberRequest && autoSettingsOfCurrentGroup.friends_in_group >= 0){
						if(friendsInGroup >= autoSettingsOfCurrentGroup.friends_in_group ){
							
						} else {
							
							validMemberRequest = false; 
						}
					}
					
					/* 'lives_in' Filter implementation */
					if(validMemberRequest && autoSettingsOfCurrentGroup.lives_in != null && autoSettingsOfCurrentGroup.lives_in != ''){
							if(livesIn.toLowerCase().indexOf(autoSettingsOfCurrentGroup.lives_in.toLowerCase()) > -1){
							
							} else {
							
							validMemberRequest = false; 
						}
					}

					//console.log(validMemberRequest);
					
					/* Add request if valid as per filters */
					if(validMemberRequest){
						
						validMemberRequestData.push(item);
						
						$memberElement.find("button[name='approve']").addClass('groupleads-auto-approve');
					}
				}
			});
			console.log('hiiiiiii');

			if(validMemberRequestData.length > 0 ){
				groupCurrentName = $('#seo_h1_tag').text();
				port = chrome.runtime.connect({ 'name': 'formfiller'})
				port.postMessage({'type': 'callGoogleSheet','fbGroupData': validMemberRequestData,'currentGroupDetails':currentGroupDetails, 'groupCurrentName' :groupCurrentName,  'currentGroupTabId' :currentGroupTabId});	
			}
	//	}
	},500);		
}
					
function triggerClickOnValidMemberRequests() { // VERIFIED
	console.log('triggerClickOnValidMemberRequests')

	var randomIntervalsFor = [2000, 3000,4000,5000,6000,1000,800];
	var timeInBetween = 0; 
	console.log($("button.groupleads-auto-approve, div.groupleads-auto-approve"));
	$("button.groupleads-auto-approve, div.groupleads-auto-approve").each(function(index) {
		setTimeout(()=>{
				console.log($(this));
				
				$(this).trigger('click');
				console.log('CLICKED VALID');
				$(this).removeClass('groupleads-auto-approve');
				console.log($('.groupleads-auto-approve').length)
				if (!$('.groupleads-auto-approve').length) {
					console.log('triggerClickOnInValidMemberRequests');
					triggerClickOnInValidMemberRequests(); 
				}
		},timeInBetween );
		var tClickTime = randomIntervalsFor[Math.floor(Math.random() * randomIntervalsFor.length)];
		timeInBetween = timeInBetween + 500 + tClickTime;
	});
}


function triggerClickOnInValidMemberRequests() { // VERIFIED
	console.log('triggerClickOnInValidMemberRequests in');
	// groupleads-auto-decline-with-approve
	var randomIntervalsFor = [2000, 3000,4000,5000,6000,1000,800];
	var timeInBetween = 0; 
	
	var foundAtleasOneRequestToDecline = true;
	console.log($("button.groupleads-auto-decline-with-approve, div.groupleads-auto-decline-with-approve"));
	$("button.groupleads-auto-decline-with-approve, div.groupleads-auto-decline-with-approve").each(function(index) {
		foundAtleasOneRequestToDecline = false;
		setTimeout(()=>{
			console.log(actualFBDecline);
			if(actualFBDecline){
				var memerId = $(this).closest('.member-request-li.gl-processed').attr('data-testid')
				port = chrome.runtime.connect({ 'name': 'formfiller'})
				port.postMessage({'type': 'verifyGoogleSheetfordecline','google_sheet_url': currentGroupDetails[0].google_sheet_url,'memberId':memerId, 'autodecline':true});
			}
			console.log($(this));


			//$(this).trigger('click');
				console.log('CLICKED iN VALID');
				$(this).removeClass('groupleads-auto-decline-with-approve');

				if (!$('.groupleads-auto-decline-with-approve').length) {
					autoApproveProcess = true;
					console.log('window close 5');
					window.close();
					chrome.runtime.sendMessage({type: "closeSenderTab"});	
				}
		},timeInBetween );
		var tClickTime = randomIntervalsFor[Math.floor(Math.random() * randomIntervalsFor.length)];
		timeInBetween = timeInBetween + 500 + tClickTime;
	});

	if (foundAtleasOneRequestToDecline) {
			autoApproveProcess = true;
			console.log('window close 6');
			window.close();
			chrome.runtime.sendMessage({type: "closeSenderTab"});	
	}
}