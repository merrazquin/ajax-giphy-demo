
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

For possible future validation:

Dictionary API Base URL	https://od-api.oxforddictionaries.com/api/v1
Consistent part of API requests.

Application ID	f48de7a0
This is the application ID, you should send with each API request.

Application Keys	d5e1c50a800e688df04be58ed34388ff
*/

const GIPHY_API_KEY = "3p7b4CMXTX8JPnjVpCpn9CM7uDYuPNAe";

var rating = "g";
var defaultTopics = ["pasta", "boba tea", "sushi", "ramen"];
var topics = JSON.parse(localStorage.getItem("topics")) || defaultTopics.slice();
var currentTopic = "";
var defaultLimit = 10;
var limitOffset = 0;
var favesHidden = true;
var storedFaves = JSON.parse(localStorage.getItem("favorites")) || {};

/**
 * Displays a button for each topic
 */
function setupTopicButtons() {
    $("#topic-buttons").empty();

    topics.forEach(topic => {
        $("#topic-buttons").append(

            $("<button>")
                .addClass("btn btn-default topic" + (defaultTopics.indexOf(topic) == -1 ? " btn-warning" : ""))
                .text(topic)
                .attr("data-name", topic)
        );
    });

    // store the topics in local storage
    localStorage.setItem("topics", JSON.stringify(topics));

    updateClearButtonVisibility();
}

/**
 * Populate the favorites panel with any existing favorites (stored locally)
 */
function setupFavorites() {
    $("#faves").empty();

    // populate any existing favorites from local storage
    for (let faveKey in storedFaves) {
        let storedFave = storedFaves[faveKey];
        $("#faves").append(createGIFPanel(faveKey, storedFave.title, storedFave.rating, storedFave.stillURL, storedFave.animatedURL, storedFave.maxWidth, true));
    }

    let numFaves = Object.keys(storedFaves).length;
    if (numFaves && favesHidden) {
        toggleFavoritesPanel();
    }

    if (!numFaves && !favesHidden) {
        toggleFavoritesPanel();
    }

    updateFavesHeader();
    updateClearButtonVisibility();
}

/**
 * Bind listeners to clickable elements
 */
function setupListeners() {
    $(document)
        .on("click", ".topic", topicClicked)// when topic buttons are clicked, load associated GIFs
        .on("click", ".gif", toggleGIF)     // when GIFs are clicked, toggle back & forth between still & animated
        .on("click", "#add-food", addFood)  // when add food button is clicked, add a new topic button
        .on("click", ".fave", toggleFavorite)  // when fave button is clicked, toggle the item's favorite status
        .on("click", "#faves-heading", toggleFavoritesPanel) // toggle the favorites panel when clicked
        .on("click", ".dropdown-menu a", updateRating) // change the max allowed rating
        .on("click", "#clear-data", clearUserData)  // when clear button is clicked, clear all locally stored data
        ;
}

/**
 * Query the Giphy API
 * @param {string} keyword 
 * @param {number} limit 
 * @param {number} offset
 */
function queryGiphyAPI(keyword, limit, offset) {
    $.getJSON(
        "https://api.giphy.com/v1/gifs/search?q=" + (keyword.replace(" ", "+")) +
        "&limit=" + limit + "&offset=" + offset +
        "&rating=" + rating +
        "&api_key=" + GIPHY_API_KEY,

        function (result) {
            let data = result.data;

            // empty display only if this is the first set of results
            if (!offset) {
                $("#gifs").empty();
            }

            // if the data is empty, display a message
            if (!data.length) {
                $("#gifs").html("<h3>No results found (try changing the Rating)</h3>");
            }

            // add new GIFs
            data.forEach(giphyObj => {
                // if the GIF isn't already stored in the favorites, add it
                if (!storedFaves[giphyObj.id]) {
                    $("#gifs")
                        .prepend(createGIFPanel(giphyObj.id, giphyObj.title, giphyObj.rating, giphyObj.images.fixed_height_still.url, giphyObj.images.fixed_height_downsampled.url, giphyObj.images.fixed_height.width));
                }
            });
        }
    );
}

/**
 * Creates the entire GIF Panel for displaying a GIF with its title, rating, and buttons for favorite/download
 * @param {string} id GIPHY API ID
 * @param {string} title 
 * @param {string} rating y, g, pg, pg-13, r
 * @param {string} stillURL 
 * @param {string} animatedURL 
 * @param {number} maxWidth
 * @param {boolean} faved 
 */
function createGIFPanel(id, title, rating, stillURL, animatedURL, maxWidth, faved) {
    return $("<div>")
        .addClass("gif-panel panel panel-default")
        .css("max-width", maxWidth + "px")
        .data({ id: id, title: title, rating: rating, stillURL: stillURL, animatedURL: animatedURL, maxWidth: maxWidth })
        .append(
            $("<div>")
                .addClass("panel-body")
                // image
                .append($("<img>")
                    .addClass("gif img-responsive")
                    .attr("alt", "GIF: " + title)
                    .attr("src", stillURL)
                    .attr("data-isStill", 1)
                    .attr("data-stillURL", stillURL)
                    .attr("data-animatedURL", animatedURL),
                    // favorite button
                    $("<span>")
                        .addClass("fave glyphicon glyphicon-heart" + (faved ? " faved" : ""))
                        .attr("aria-hidden", "true"),
                    $('<span class="sr-only">Favorite</span>'),
                    // download button
                    $("<a>")
                        .attr("href", animatedURL)
                        .addClass("download")
                        .attr("download", "img.gif")
                        .html('<span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span><span class="sr-only">Download</span>'))
            ,
            // footer (title & rating)
            $("<div>")
                .addClass("panel-footer")
                .append(
                    $("<h4>")
                        .text(title),
                    $("<p>")
                        .text("Rating: " + rating.toUpperCase())
                )
        );
}

/**
 * When topic buton is clicked, queryGiphyAPI is called with the selected topic & default limit
 */
function topicClicked() {
    var newTopic = $(this).attr("data-name");

    if (newTopic != currentTopic) {
        limitOffset = 0;
    } else {
        limitOffset += defaultLimit;
    }

    currentTopic = newTopic;
    queryGiphyAPI(newTopic, defaultLimit, limitOffset);
}

/**
 * When a GIF is clicked, toggle between still & animated
 */
function toggleGIF() {
    // grab reference to clicked gif, and find out if it's currently still
    let gif = $(this)
    let isStill = Number(gif.attr("data-isStill"));

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

/**
 * When the add food button is clicked, add a new topic button
 * @param {object} event 
 */
function addFood(event) {
    // don't submit the form 
    event.preventDefault();

    let topic = $("#food-type").val().toLowerCase().trim();

    // if the input is empty, show an error and return
    if (!topic) {
        $(".form-group").addClass("has-error");
        $("#food-type").attr("placeholder", "required");
        return;
    }

    if (topics.indexOf(topic) != -1) {
        $(".form-group").addClass("has-error");
        $("#food-type").val("");
        $("#food-type").attr("placeholder", "already in use");
        return;
    }

    // add the value of the input field to the topics array
    topics.push(topic);

    // reset the form input
    $("#food-type").attr("placeholder", "i.e. cereal");
    $(".form-group").removeClass("has-error");
    $("#food-type").val("");

    // re-generate the buttons
    setupTopicButtons();

    return; // skipping validation until a more reliable API can be found

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

/**
 * Open and close the favorites panel
 */
function toggleFavoritesPanel() {
    let toggleButton = $("#faves-toggle");

    // check the glyphicon being used to determine the current state
    if (favesHidden) {
        toggleButton.removeClass("glyphicon-collapse-down");
        toggleButton.addClass("glyphicon-collapse-up");
    }
    else {
        toggleButton.removeClass("glyphicon-collapse-up");
        toggleButton.addClass("glyphicon-collapse-down");
    }

    // toggle the flag, and show or hide the faves panel body
    favesHidden = !favesHidden;
    favesHidden ? $("#faves").hide() : $("#faves").show();
}

/**
 * Update a GIF's "favorite" status
 */
function toggleFavorite() {
    // if this is the first favorite being added, and the faves panel is closed, open it
    if (!Object.keys(storedFaves).length && favesHidden) {
        toggleFavoritesPanel();
    }

    let panel = $(this).parents(".gif-panel");
    if ($(this).hasClass("faved")) {
        // remove it from the stored favorites
        delete storedFaves[panel.data().id];

        // remove the panel
        panel.remove();

        // if this is the last favorite removed, and the faves panel is open, close it
        if (!Object.keys(storedFaves).length && !favesHidden) {
            toggleFavoritesPanel();
        }
    }
    else {
        // add the faved class
        $(this).addClass("faved");

        // move the GIF panel to the faves panel
        $("#faves").prepend(panel);

        // add it to the stored favorites
        storedFaves[panel.data().id] = panel.data();
    }

    // update local storage, fave count in header, and clear button visibility 
    localStorage.setItem("favorites", JSON.stringify(storedFaves));
    updateFavesHeader();
    updateClearButtonVisibility();
}

/**
 * Update the heading with the current number of favorited GIFs
 */
function updateFavesHeader() {
    $("#faves-heading h3").text("Favorites (" + Object.keys(storedFaves).length + ")");
}

/**
 * Show or hide the clear user data button depending on local storage contents
 */
function updateClearButtonVisibility() {
    if (!Object.keys(storedFaves).length && topics.length == defaultTopics.length) {
        $("#clear-data").hide();
    }
    else {
        $("#clear-data").show();
    }
}

/**
 * Update the rating based on dropdown selection
 */
function updateRating() {
    $("#rating-label").text((rating = $(this).attr("data-rating")).toUpperCase());
}

/**
 * Clear out all locally stored data
 */
function clearUserData() {
    localStorage.clear();
    topics = defaultTopics.slice();
    storedFaves = {};

    setupTopicButtons();
    setupFavorites();
}

/**
 * On ready, call setup functions
 */
$(function () {
    setupTopicButtons();
    setupFavorites()
    setupListeners();
});