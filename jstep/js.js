// Random quote generator

var query = "https://talaikis.com/api/quotes/random/";

$.ajax({
    url: query,
    method: "GET"
}).then(function(response) {
    $("#quote").text(response.quote);
    $("#author").text(response.author)
})

// Modal activation

$(document).ready(function(){
    $('.modal').modal();
  });

// Click functions

$(document).on("click", "#follow", function() {

    $(this).html("<i class='material-icons'>check</i>")

})

$("#shortTerm, #longTerm").on("click", function() {
    $("#timeframe").text(this.text);
    if(this.text === "Long Term") {
        $("#timeframeEntry").attr("type", "date")
    }
    else {
        $("#timeframeEntry").attr("type", "time")
    }
})

// Testing append on feed

// $("#addRow").on("click", function() {
//     console.log("hi");
//     $("#feedGoals").append("<div class='row'><div class='col s3'></div><div class='card-panel col s6' style='text-align: center'>Goal Example</div><div class='col s3'></div></div>")
// });
