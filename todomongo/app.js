window.app = {};

$(document).ready(function() {

    $('#additem').click(function (e) {
        createRecord();
    });

    function checkEnterKey(e, action) {
        if (e.keyCode == 13) {
            action();
        }
    }

    $('#loginDialog').find('input').keydown(function(e) {
        checkEnterKey(e, logIn);
    });
});

$(window).on("apiReady", function () {

    checkSession();
});

// session

function checkSession() {

    $("#loading").show();
    // check for existing session, relevant when code is hosted on the dsp
    window.df.apis.user.getSession({"body":{}}, function (response) {
        $("#loading").hide();
        // existing session found, assign session token
        // to be used for the session duration
        var session = new ApiKeyAuthorization("X-Dreamfactory-Session-Token",
            response.session_id, 'header');
        window.authorizations.add("X-DreamFactory-Session-Token", session);
        runApp();
    }, function (response) {
        $("#loading").hide();
        // no valid session, try to log in
        doLogInDialog();
    });
}

// main app entry point

function runApp() {

    // your app starts here
    getRecords();
}

// CRUD

function getRecords() {

    window.df.apis.dfmongohq.getRecords({"table_name":"todo"}, function (response) {
        buildItemList(response);
    }, crudError
    );
}

function createRecord() {

    var name = $('#itemname').val();
    if (name === '') return;
    var item = {"record":[
        {"name":name, "complete":false}
    ]};
    df.apis.dfmongohq.createRecords({"table_name":"todo", "body":item}, function (response) {
        $('#itemname').val('');
        getRecords();
    }, crudError
    );
}

function updateRecord(id, complete) {

    var item = {"record":[
        {"_id":id, "complete":complete}
    ]};
    df.apis.dfmongohq.updateRecords({"table_name":"todo", "body":item}, function (response) {
        getRecords();
    }, crudError
    );
}

function deleteRecord(id) {

    df.apis.dfmongohq.deleteRecords({"table_name":"todo", "ids":id}, function (response) {
        getRecords();
    }, crudError
    );
}

// ui

function buildItemList(json) {

    var html = '';
    if (json.record) {
        json.record.forEach(function (entry) {
            var name = entry.name;
            var id = entry._id;
            html += '<tr>';
            html += '<td><a><i class="icon icon-minus-sign" data-id="' + id + '"></i></a></td>';
            if (entry.complete === true) {
                html += '<td style="width:100%" class="item strike" data-id="' + id + '">' + name + '</td>';
            } else {
                html += '<td style="width:100%" class="item" data-id="' + id + '">' + name + '</td>';
            }
            html += '</tr>';
        });
    }
    $('table').html(html);
    $('#list-container .item').click(function (e) {
        var id = $(this).data('id');
        var complete = $(this).hasClass('strike');
        updateRecord(id, !complete);
    });
    $('#list-container i').click(function (e) {
        var id = $(this).data('id');
        deleteRecord(id);
    });
}

// error utils

function getErrorString(response) {

    var msg = "An error occurred, but the server provided no additional information.";
    if (response.content && response.content.data && response.content.data.error) {
        msg = response.content.data.error[0].message;
    }
    msg = msg.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&apos;/g, '\'');
    return msg;
}

function crudError(response) {

    if (response.status == 401 || response.status == 403) {
        doLogInDialog();
    } else {
        alert(getErrorString(response));
    }
}

// login dialog

function clearLogIn() {

    var $_dlg = $('#loginDialog');
    $('input', $_dlg).val('');
}

function doLogInDialog() {

    var _message = 'Please enter your User Email and Password below to sign in.';
    $('#loginErrorMessage').removeClass('alert-error').empty().html(_message);
    clearLogIn();
    $("#loginDialog").modal('show').on('shown', function() {
        $('#UserEmail').focus();
    });
}

function logIn() {

    var email = $('#UserEmail').val();
    var pw = $('#Password').val();
    if (!email || !pw) {
        $("#loginErrorMessage").addClass('alert-error').html('You must enter your email address and password to continue.');
        return;
    }
    var body = {
        "email":email,
        "password":pw
    };
    $("#loading").show();
    window.df.apis.user.login({"body":body}, function (response) {
        // assign session token to be used for the session duration
        var session = new ApiKeyAuthorization("X-Dreamfactory-Session-Token",
            response.session_id, 'header');
        window.authorizations.add("X-DreamFactory-Session-Token", session);
        $("#loginDialog").modal('hide');
        $("#loading").hide();
        runApp();
    }, function (response) {
        $("#loading").hide();
        $("#loginErrorMessage").addClass('alert-error').html(getErrorString(response));
    });
}