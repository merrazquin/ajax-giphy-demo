
/*
### Instructions

1. Before you can make any part of our site work, you need to create an array of strings, each one related to a topic that interests you. Save it to a variable called `topics`.
   * We chose animals for our theme, but you can make a list to your own liking.

2. Your app should take the topics in this array and create buttons in your HTML.
   * Try using a loop that appends a button for each string in the array.

3. When the user clicks on a button, the page should grab 10 static, non-animated gif images from the GIPHY API and place them on the page.

4. When the user clicks one of the still GIPHY images, the gif should animate. If the user clicks the gif again, it should stop playing.

5. Under every gif, display its rating (PG, G, so on).
   * This data is provided by the GIPHY API.
   * Only once you get images displaying with button presses should you move on to the next step.

6. Add a form to your page takes the value from a user input box and adds it into your `topics` array. Then make a function call that takes each topic in the array remakes the buttons on the page.


### Bonus Goals

1. Ensure your app is fully mobile responsive.

2. Allow users to request additional gif's to be added to the page.
   * Each request should ADD 10 gif's to the page, NOT overwrite the existing gifs.

3. List additional metadata (title, tags, etc) for each gif in a clean and readable format.

4. Include a 1-click download button for each gif, this should work across device types.

5. Integrate this search with additional api's such as OMDB, or Bands in Town. Be creative and build something you are proud to showcae in your portfolio

6. Allow users to add their favorite gif's to a `favorites` section.
   * This should persist even when they select or add a new topic.
   * If you are looking for a major challenge, look into making this section persist even when the page is reloaded(via localStorage or cookies). 
*/

/*
API Base URL	https://od-api.oxforddictionaries.com/api/v1
Consistent part of API requests.

Application ID	f48de7a0
This is the application ID, you should send with each API request.

Application Keys	d5e1c50a800e688df04be58ed34388ff
*/

const GIPHY_API_KEY = "3p7b4CMXTX8JPnjVpCpn9CM7uDYuPNAe";

var topics = ["pasta", "pizza", "sushi", "ramen"];
var defaultLimit = 10;


function setupTopicButtons() {
    $("#topic-buttons").empty();

    topics.forEach(topic => {
        $("#topic-buttons").append(
            $("<button>")
                .addClass("btn btn-default topic")
                .text(topic)
                .attr("data-name", topic)
        );
    });
}

function setupListeners() {
    $(document)
        .on("click", ".topic", topicClicked)// when topic buttons are clicked, load associated GIFs
        .on("click", ".gif", toggleGIF)     // when GIFs are clicked, toggle back & forth between still & animated
        .on("click", "#add-food", addFood); // when add food button is clicked, add a new topic button
}

function queryGiphyAPI(keyword, limit) {
    $.getJSON(
        "https://api.giphy.com/v1/gifs/search?q=" + (keyword.replace(" ", "+")) + "&limit=" + limit + "&api_key=" + GIPHY_API_KEY,
        function (result) {
            var data = result.data;

            // empty display
            $("#gifs").empty();

            // add new GIFs
            data.forEach(giphyObj => {
                $("#gifs")
                    // panel container
                    .append($("<div>")
                        .addClass("gif panel panel-default")
                        .append(
                            // image
                            $("<img>")
                                .addClass("img-responsive")
                                .attr("src", giphyObj.images.original_still.url)
                                .attr("data-isStill", 1)
                                .attr("data-stillURL", giphyObj.images.original_still.url)
                                .attr("data-animatedURL", giphyObj.images.original.url),
                            // footer
                            $("<div>")
                                .addClass("panel-footer")
                                .append(
                                    $("<div>")
                                        .addClass("row")
                                        .append(
                                            // rating
                                            $("<span>")
                                                .addClass("col-xs-6 text-left")
                                                .text("Rating: " + (giphyObj.rating || "Not rated").toUpperCase()),
                                            // download button
                                            $("<span>")
                                                .addClass("col-xs-6 text-right")
                                                .append(
                                                    $("<a>")
                                                        .attr("href", giphyObj.images.original.url)
                                                        .attr("download", giphyObj.title.replace(" ", "_"))
                                                        .html('<span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span>')
                                                )


                                        )
                                )
                        ));
            });
        }
    );
}

function topicClicked() {
    queryGiphyAPI($(this).attr("data-name"), defaultLimit);
}

function toggleGIF() {
    // grab reference to clicked gif, and find out if it's currently still
    var gif = $(this).find("img");
    var isStill = Number(gif.attr("data-isStill"));

    // swap the src URL based on current state
    if (isStill) {
        gif.attr("src", gif.attr("data-animatedURL"));
    }
    else {
        gif.attr("src", gif.attr("data-stillURL"));
    }

    // toggle isStill property 
    gif.attr("data-isStill", isStill ? 0 : 1);
}

function addFood(event) {
    // don't submit the form 
    event.preventDefault();
    var topic = $("#food-type").val().trim();
    $(".form-group").removeClass("has-error");

    // add the value of the input field to the topics array
    topics.push(topic);
    // clear out the input field
    $("#food-type").val("");

    // re-generate the buttons
    setupTopicButtons();


    return; // don't validate

    // unused validation code
    $.ajax({
        url: 'https://wordsapiv1.p.mashape.com/words/' + topic.replace(" ", "+") + '/typeOf',
        headers: {
            "X-Mashape-Key": "TmxdjnQGUWmshIDuTHOs0MNk01Q7p1oRKrNjsng12DV0x1xrIR",
            "X-Mashape-Host": "wordsapiv1.p.mashape.com"
        },
        type: 'GET',
        dataType: 'json',
        data: "",
        success: function (data) {
            console.log("succes: " + JSON.stringify(data));
            if (data.typeOf.join(" ").indexOf("food") != -1) {
                // add the value of the input field to the topics array
                topics.push(topic);
                // clear out the input field
                $("#food-type").val("");

                // re-generate the buttons
                setupTopicButtons();
            } else {
                $(".form-group").addClass("has-error");
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log("ERROR");
            $(".form-group").addClass("has-error");
        }
    });
}

$(function () {
    setupTopicButtons();
    setupListeners();
});