$(document).ready(function() {

    $('#additem').click(function(e){
        addItem();
    });

    getItems();
});

function getItems() {

    $.ajax({
        dataType:'json',
        url:location.protocol + '//' + location.host + '/rest/dfmongohq/todo',
        data:'app_name=todomongo',
        cache:false,
        success:function (response) {
            buildItemList(response);
        },
        error:function (response) {
            alert("There was an error retrieving the to do list items.");
        }
    });
}

function addItem() {

    var name = $('#itemname').val();
    if (name === '') return;
    var item = {"record":[{"name":name,"complete":false}]};
    $.ajax({
        dataType:'json',
        type : "POST",
        url:location.protocol + '//' + location.host + '/rest/dfmongohq/todo?app_name=todomongo',
        data:JSON.stringify(item),
        cache:false,
        processData: false,
        success:function (response) {
            $('#itemname').val('');
            getItems();
        },
        error: function(response) {
            $('#itemname').val('');
            alert("There was an error creating the list item.");
        }
    });
}

function updateItem(id, complete) {

    var item = {"record":[{"_id":id,"complete":complete}]};
    $.ajax({
        dataType:'json',
        type : "PATCH",
        url:location.protocol + '//' + location.host + '/rest/dfmongohq/todo?app_name=todomongo',
        data:JSON.stringify(item),
        cache:false,
        processData: false,
        success:function (response) {
            getItems();
        },
        error: function(response) {
            alert("There was an error updating the list item.");
        }
    });
}

function deleteItem(id) {

    $.ajax({
        dataType:'json',
        type : "DELETE",
        url:location.protocol + '//' + location.host + '/rest/dfmongohq/todo/' + id + '?app_name=todomongo',
        cache:false,
        processData: false,
        success:function (response) {
            getItems();
        },
        error: function(response) {
            alert("There was an error deleting the list item.");
        }
    });
}

function buildItemList(json) {

    var html = '';
    if (json.record && json.record.length > 0) {
        html += '<table class="table table-hover table-striped table-bordered todolist">';
        for (var i in json.record) {
            var name = json.record[i].name;
            var id = json.record[i]._id;
            html += '<tr>';
            html += '<td><a><i class="icon icon-minus-sign" data-id="' + id + '"></i></a></td>';
            if (json.record[i].complete === true) {
                html += '<td style="width:100%" class="item strike" data-id="' + id + '">' + name + '</td>';
            } else {
                html += '<td style="width:100%" class="item" data-id="' + id + '">' + name + '</td>';
            }
            html += '</tr>';
        }
        html += '</table>';
    }
    $('#list-container').html(html);
    $('#list-container .item').click(function(e) {
        var id = $(this).data('id');
        var complete = $(this).hasClass('strike');
        updateItem(id, !complete);
    });
    $('#list-container i').click(function(e) {
        var id = $(this).data('id');
        deleteItem(id);
    });
}