var credentialEditTempStorageTime = 15; /// in minutes
var currentUnlinkGroupId = '';
var userId = '';
var planConfig = {};
var allGroupDataArray = [];
var groupDataFetched = false;
var $lastActiveTab = null;
var activeCampaignApiUrl = null;
var activeCampaignApiToken = null;
var groupLeadsApiToken = null;
var jwtToken = null;
var selected_lang_locale = null;
/////////delele group//////////
var groupIdToDelete = 0;
var fbGroupIdToDeleteGroup = 0;
//////////end delete group //////
var lang_data = null;
var lastOpenedSettingScreen = "";
var declineRandomMessageHtml = '';
var welcomeRandomMessageHtml = '';
var tagRandomMessageHtml = '';
var validPostUrl = true;
var hash = "";
console.log(baseUrl);
chrome.cookies.get({
    url: baseUrl,
    name: "jwt_token"
}, function(result) {
    if (result != null) {
        jwtToken = result.value;
    }
});
var userLang = 'en';
var oAuth2Redirect = false;
jQuery.fn.extend({
    'vchange': function() {
        var change_event = document.createEvent('HTMLEvents')
        change_event.initEvent('change', false, true)
        return $(this).each(function() {
            $(this)[0].dispatchEvent(change_event)
        })
    },
    'vclick': function() {
        var click_event = document.createEvent('HTMLEvents')
        click_event.initEvent('click', false, true)
        return $(this).each(function() {
            $(this)[0].dispatchEvent(click_event)
        })
    }
});
$('body').bind('DOMSubtreeModified', function(e) {
    // if (e.target.innerHTML.length > 0) {
    //     var height = $(".tabs").outerHeight(true);
    //     $('body').height(height);
    //     $('html').height(height);
    // }
});
$(document).ready(function() {
    $('#licence').on('input', function() {
        $(this).val($(this).val().replace(/[^a-z0-9]/gi, ''));
        var license_key_value = $(this).val();
        if (license_key_value.length > 30) {
            license_key_value = license_key_value.slice(0, 30);
            $(this).val(license_key_value);
        }
    });
    getLanguageArray();
    dashboard();
    $('[data-toggle="tooltip"]').tooltip();
    $("#login_screen").show();
    /********* To show login form *******/
    $(".login-link").on('click', function() {
        $('.tab').hide();
        $("#login_screen").show();
    });
    /********* To show forgot password form *******/
    $(".forgot-license-link").on('click', function() {
        $('.tab,#login_screen').hide();
        $("#forgot_licence_screen").show();
        return false;
    });
    ///////// Login form /////////////
    var loginForm = $("#loginform").validate({
        rules: {
            license_key: {
                required: true
            }
        },
        messages: {
            license_key: {
                required: "License key can not be empty"
            }
        },
        submitHandler: function() {
            $("#loginform button[type='submit']").attr('disabled', true).text('Processing');
            login();
            return false;
        }
    });
    var regex = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
    jQuery.validator.addMethod("regex", function(value, element, regexp) {
        if (regexp.constructor != RegExp) regexp = new RegExp(regexp);
        else if (regexp.global) regexp.lastIndex = 0;
        return this.optional(element) || regexp.test(value);
    }, "erreur expression reguliere");
    var forgotPassword = $("#forgotPasswordForm").validate({
        rules: {
            email: {
                required: true,
                email: true,
                regex: /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i
            }
        },
        messages: {
            email: {
                required: "Email can not be empty",
                email: "Please enter valid email",
                regex: "Sorry, only letters (a-z) (A-Z), numbers (0-9) are allowed."
            }
        },
        submitHandler: function() {
            forgot_password();
            return false;
        }
    });
});
/********* LOGIN  *******/
function login() {
    $('.loader-show').show();
    var tempGLKey = $.trim($('#license_key').val());
    $.ajax({
        type: "POST",
        //url: apiBaseUrl + "?action=login&v=2",
        url: apiBaseUrl + "login",
        data: $("#loginform").serialize(),
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        console.log(response);
        $("#loginform button[type='submit']").removeAttr('disabled').text('Login');
        $('.loader-show').hide();
        if (response.status == 401) {
            message_animation('alert-danger');
            $('.msg').text(response.msg);
            return false;
        } else {
            if (response.status == 404) {
                message_animation('alert-danger');
                $('.msg').text(response.msg);
            } else {
                // chrome.identity.getAuthToken({interactive: true});
                planConfig = response.planConfig;
                message_animation('alert-success');
                jwtToken = response.apiToken;
                chrome.cookies.set({
                    url: baseUrl,
                    name: "jwt_token",
                    value: response.apiToken,
                    expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
                });
                chrome.runtime.sendMessage({
                    'type': 'jwtForBackground',
                    jwtToken: response.apiToken
                })
                chrome.runtime.sendMessage({
                    'reloadFbPage': 'yes'
                });
                $('.msg').text(response.msg);
                chrome.storage.local.set({
                    'user': response.user,
                    'autoresponderList': response.autoResponderList,
                    'jwtToken': response.apiToken,
                    'planConfig': response.planConfig,
                    'groupConfig': response.groupConfig,
                    'languages': response.languages
                }, function() {
                    dashboard();
                });
            }
        }
    });
}
/********* To send reset password link*******/
function forgot_password() {
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "reset-password",
        data: $("#forgotPasswordForm").serialize(),
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 404) {
            message_animation('alert-danger');
            $('.msg').text(response.msg);
        } else {
            message_animation('alert-success');
            $('.msg').text(response.msg);
            $("#forgotPasswordForm")[0].reset();
        }
    });
}
/********* To update the extension popup pages *******/
function dashboard() {
    chrome.storage.local.get(["user", "planConfig"], function(result) {
        console.log(result);
        if (typeof result.user !== "undefined" && result.user != "") {
            if (window.location.href.indexOf('index.html') == -1) {
                document.location.href = '/index.html';
            }
        } else {
            $('.tabs').hide();
            $('#login_screen').show();
        }
    });
}

function userSelectedLanguage() {
    chrome.cookies.get({
        url: baseUrl,
        name: "groupleads_language"
    }, function(result) {
        if (result != null) {
            userLang = result.value;
            return userLang;
        } else {
            return userLang;
        }
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
        findOptions = setInterval(() => {
            if ($('#languagesSelect option').length > 0) {
                clearInterval(findOptions);
                $('#languagesSelect [value="' + lang + '"]').attr('selected', 'true');
            }
        }, 200)
        chrome.cookies.set({
            url: baseUrl,
            name: "groupleads_language",
            value: lang,
            expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
        });
        chrome.storage.local.get(["groupleads_languages"], function(result) {
            lang_data = result.groupleads_languages;
            selectedLanuage = lang_data['' + lang + ''];
            chrome.storage.local.set({
                'selectedLanuage': selectedLanuage
            });
            replaceTextByLang();
        });
    });
}

function triggerLogout() {
    // $('#Modal-logout').modal('hide');
    chrome.storage.local.set({
        'user': ''
    });
    $('.tabs').hide();
    // $('#tab1').show();
    // message_animation('alert-success');
    chrome.cookies.set({
        url: baseUrl,
        name: "jwt_token",
        value: '',
        expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
    });
    // $('.msg').text(selected_lang_locale.logout_modal.logout_message);
    chrome.runtime.sendMessage({
        'reloadFbPage': 'yes'
    });
    // $('#tab').hide();
    // $('#tab-content-1').hide();
    document.location.href = '/login.html';
    $('#login_screen').show();
    // $(".before-login-footer").show();
}
/********* To show response messages with animation ******/
function message_animation(addClass, timer = 2000) {
    $('.msg').addClass("alert " + addClass);
    setTimeout(function() {
        $('.msg').removeClass("alert alert-danger alert-success");
        $('.msg').text('');
    }, timer);
}
$(document).on('change', '#languagesSelect', function(e) {
    lang = this.value;
    userLang = lang;
    selectedLanuage = lang_data['' + lang + ''];
    chrome.cookies.set({
        url: baseUrl,
        name: "groupleads_language",
        value: lang,
        expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
    });
    chrome.storage.local.set({
        'selectedLanuage': selectedLanuage
    });
    replaceTextByLang();
});

function replaceTextByLang() {
    chrome.storage.local.get(["selectedLanuage"], function(result) {
        ///////////global group setting page ////////////////
        selected_lang_locale = result.selectedLanuage;
        /////////login page//////////
        $('#login_screen .login_page_title_h3').text(selected_lang_locale.login_page.login_page_title_h3);
        $('#login_screen .p1_text').text(selected_lang_locale.login_page.p1_text);
        $('#login_screen .license_key_label').html(selected_lang_locale.login_page.license_key.label);
        $('#login_screen .license_key_text_placeholder').attr('placeholder', selected_lang_locale.login_page.license_key.placeholder);
        $('#login_screen .forgot_key_a').text(selected_lang_locale.login_page.forgot_key_a);
        $('#login_screen .signup_label').text(selected_lang_locale.login_page.signup_label);
        $('#login_screen .get_support1').text(selected_lang_locale.login_page.get_support1);
        $('#login_screen .note_affiliate_p').text(selected_lang_locale.login_page.note_affiliate_p);
        $('#login_screen .tooltip_label').attr('data-original-title', selected_lang_locale.login_page.license_key.tooltip_label);
        // $('#login_screen .tooltip_label').text(selected_lang_locale.login_page.license_key.tooltip_label);
        $('#login_screen .login_button_label').text(selected_lang_locale.login_page.login_button_label);
        /////////////forgot page/////////////////
        $('#help .help_title').text(selected_lang_locale.help_page.help_title);
        $('#help .help_p').text(selected_lang_locale.help_page.help_p);
        $('#help .step_by_step_tutorials_text').text(selected_lang_locale.help_page.step_by_step_tutorials_text);
        $('#help .schedule_zoom_call_text').text(selected_lang_locale.help_page.schedule_zoom_call_text);
        $('#help .become_affiliate_text').text(selected_lang_locale.help_page.become_affiliate_text);
        $('#help .become_GL_reseller_text').text(selected_lang_locale.help_page.become_GL_reseller_text);
        //     /////////////forgot page/////////////////
        $('#forgot_licence_screen .forgot_label').text(selected_lang_locale.forgot_license_page.forgot_label);
        $('#forgot_licence_screen .p2_text').text(selected_lang_locale.forgot_license_page.p2_text);
        $('#forgot_licence_screen .email_label').text(selected_lang_locale.forgot_license_page.email.email_label);
        $('#forgot_licence_screen .forgot_placeholder').attr('placeholder', selected_lang_locale.forgot_license_page.email.forgot_placeholder);
        $('#forgot_licence_screen .forgot_button_label').text(selected_lang_locale.forgot_license_page.forgot_button_label);
        $('#forgot_licence_screen .already_key_text').text(selected_lang_locale.forgot_license_page.already_key.already_key_text);
        $('#forgot_licence_screen .note_affiliate_p').text(selected_lang_locale.forgot_license_page.already_key.note_affiliate_p);
        $('#forgot_licence_screen .a_text').text(selected_lang_locale.forgot_license_page.already_key.a_text);
        allGroupLeadForms();
    });
}
var allFormObjects = [];

function allGroupLeadForms() {
    allFormObjects.forEach(function(item) {
        item.destroy();
    });
    allFormObjects = [];
    //     ///////// Login form /////////////
    var loginForm = $("#loginform").validate({
        rules: {
            license_key: {
                required: true
            }
        },
        messages: {
            license_key: {
                required: "License key can not be empty"
            }
        },
        submitHandler: function() {
            $("#loginform button[type='submit']").attr('disabled', true).text('Processing');
            login();
            return false;
        }
    });
    allFormObjects.push(loginForm);
    loginForm.settings.messages.license_key.required = selected_lang_locale.login_form;
    /********* Validate forgot password form *******/
    var forgotPassword = $("#forgotPasswordForm").validate({
        rules: {
            email: {
                required: true,
                email: true
            }
        },
        messages: {
            email: {
                required: "Email can not be empty",
                email: "Please enter valid email"
            }
        },
        submitHandler: function() {
            forgot_password();
            return false;
        }
    });
    allFormObjects.push(forgotPassword);
    forgotPassword.settings.messages.email.required = selected_lang_locale.forgot_password.email.required;
    forgotPassword.settings.messages.email.email = selected_lang_locale.forgot_password.email.email;
}