// Random quote generator

var express = require('express');
var router  = express.Router();

var query = "https://talaikis.com/api/quotes/random/";

$.ajax({
    url: query,
    method: "GET"
}).then(function (response) {
    $("#quote").text(response.quote);
    $("#author").text(response.author)
})

var selected;

$(document).on("click", ".interaction", function() {
    console.log(this);
});

// Stake logic
var account = 500;
var raised = 200;
var max = 400;

var updateProg = function () {
    var prog = (raised / max) * 100;
    $("#progressBarView").attr("style", "width:" + prog + "%");
    $("#prgsView").text(raised + " / " + max);
    $("#balance").text(account);
}

var checkProg = function () {
    if (raised < max) {
        updateProg();
    }
    else {
        updateProg();
        $("#progressBarView").attr("style", "width:100%");
        $("#prgsView").text("Complete!");
        $(".interaction").remove();
    }
};

checkProg();

$(".buyIn").on("click", function () {
    var bet = parseInt($("#stk").val());
    var remaining = max - raised - bet;
    if (account - bet >= 0 && bet > 0 && remaining >= 0) {
        account -= bet;
        raised += bet;
        checkProg();
        Materialize.toast('Stake successfully placed!', 4000)
    }
    else if (bet <= 0) {
        Materialize.toast('Please enter a valid amount.', 4000);
    }
    else if (remaining < 0) {
        remaining = max - raised;
        Materialize.toast('Invalid Amount! Only ' + remaining + ' available left to stake.', 4000)
    }
    else {
        Materialize.toast('Insufficient Funds', 4000)
    }
})

$(".update").on("click", function () {
    $("#account").text(account);
});



// Modal activation

$(document).ready(function () {
    $("#balance").text(account);
    $('.carousel').carousel();
    $("#mdl1").on("click", function () {

        if ($("#stake").val() > max) {
            $(".modal-trigger").attr("data-target", "modal3");
            $('#modal3').modal();
        }
        else {
            $(".modal-trigger").attr("data-target", "modal1");
            $('#modal1').modal();
        }
    })

});


// Click functions

var goal;

$(document).on("click", ".interaction", function () {

    $(this).html("<i class='material-icons'>check</i>");
    goal = $(this).attr("data-num");
    console.log(goal);
    
});

module.exports(goal);


$("#shortTerm, #longTerm").on("click", function () {
    $("#timeframe").text(this.text);
    if (this.text === "Long Term") {
        $("#timeframeEntry").attr("type", "date")
    }
    else {
        $("#timeframeEntry").attr("type", "time")
    }
})

// ajax post for creating a goal after confirming on modal
$("#goalSubmit").on("click", function () {
    $.post("/create", $("#createGoal").serialize(), function (err, res) {
        if (err) throw err;
    })
})

// on click to populate the confirmation modal with the goal info
$("#mdl1").on("click", function () {
    $("#modalGoalText").text($("#task").val());
    $("#modalMaxWager").text($("#stake").val());
    $("#modalGoalEnd").text($("#timeframeEntry").val());
})








// Testing append on feed

// $("#addRow").on("click", function() {
//     console.log("hi");
//     $("#feedGoals").append("<div class='row'><div class='col s3'></div><div class='card-panel col s6' style='text-align: center'>Goal Example</div><div class='col s3'></div></div>")
// });
