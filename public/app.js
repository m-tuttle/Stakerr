// Random quote generator

// var express = require('express');
// var router  = express.Router();

var query = "https://talaikis.com/api/quotes/random/";

$.ajax({
    url: query,
    method: "GET"
}).then(function (response) {
    $("#quote").text(response.quote);
    $("#author").text(response.author)
})

var selected;

// Stake logic

var updateProg = function () {
    var prog = (raised / max) * 100;
    $("#progressBarView").attr("style", "width:" + prog + "%");
    // $("#prgsView").text(raised + " / " + max);
    // $("#balance").text(account);
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

var max;
var raised;
var account;


$(".buyIn").on("click", function () {
    var bet = parseInt($("#stk").val());
    var remaining = max - raised - bet;
    if (account - bet >= 0 && bet > 0 && remaining >= 0) {
        account -= bet;
        raised += bet;
        checkProg();
        Materialize.toast('Stake successfully placed!', 4000)
        $.post("/stake/create",
            {
                "wager_amount": bet,
                "goal_id": $(".buyIn").attr("data-goal"),
                "credits": $("#balance").text(),
                "raised": parseInt($("#prgsView").text())
            },
            function (err, res) {
                if (err) throw err;
                console.log(res);
            })
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



// Modal activation

$(document).ready(function () {
    // $("#balance").text(account);
    $('.carousel').carousel();
    max = $("#maxWager").text();
    raised = $("#raised").text();
    account = $("#balanceAmount").text();
    $("#account").text(account);
    console.log(max);
    console.log(raised);
    console.log(account);
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

$(document).on("click", "#follow", function() {

    $(this).html("<i class='material-icons'>check</i>")

})
