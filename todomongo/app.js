window.app = {};

$(window).on("apiReady", function () {

    $('#additem').click(function (e) {
        createRecord();
    });

    checkSession();
});

// session

function checkSession() {

    // check for existing session, relevant when code is hosted on the dsp
    window.df.apis.user.getSession({"body":{}}, function (response) {
        // existing session found, assign session token
        // to be used for the session duration
        var session = new ApiKeyAuthorization("X-Dreamfactory-Session-Token",
            response.session_id, 'header');
        window.authorizations.add("X-DreamFactory-Session-Token", session);
        runApp();
    }, function (response) {
        // no valid session, try to log in
        login();
    });
}

function login() {

    // your app would present a login form here to get email and password
    var body = {
        "email":"_your_dsp_email_",
        "password":"_your_dsp_password_"
    };
    window.df.apis.user.login({"body":body}, function (response) {
        // assign session token to be used for the session duration
        var session = new ApiKeyAuthorization("X-Dreamfactory-Session-Token",
            response.session_id, 'header');
        window.authorizations.add("X-DreamFactory-Session-Token", session);
        runApp();
    }, function (response) {
        alert(getErrorString(response));
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
    }, function (response) {
        alert(getErrorString(response));
    });
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
    }, function (response) {
        alert(getErrorString(response));
    });
}

function updateRecord(id, complete) {

    var item = {"record":[
        {"_id":id, "complete":complete}
    ]};
    df.apis.dfmongohq.mergeRecords({"table_name":"todo", "body":item}, function (response) {
        getRecords();
    }, function (response) {
        alert(getErrorString(response));
    });
}

function deleteRecord(id) {

    df.apis.dfmongohq.deleteRecords({"table_name":"todo", "ids":id}, function (response) {
        getRecords();
    }, function (response) {
        alert(getErrorString(response));
    });
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