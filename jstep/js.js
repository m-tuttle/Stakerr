var query = "https://talaikis.com/api/quotes/random/";

$.ajax({
    url: query,
    method: "GET"
}).then(function(response) {
    $("#quote").text(response.quote);
    $("#author").text(response.author)
})

$("#addRow").on("click", function() {
    console.log("hi");
    $("#feedGoals").append("<div class='row'><div class='col s3'></div><div class='card-panel col s6' style='text-align: center'>Goal Example</div><div class='col s3'></div></div>")
});

$(document).ready(function(){
    // the "href" attribute of the modal trigger must specify the modal ID that wants to be triggered
    $('.modal').modal();
  });

  