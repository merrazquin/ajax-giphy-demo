/*

For possible future validation:

Dictionary API Base URL	https://od-api.oxforddictionaries.com/api/v1
Consistent part of API requests.

Application ID	f48de7a0
This is the application ID, you should send with each API request.

Application Keys	d5e1c50a800e688df04be58ed34388ff
*/

var GIPHY_API_KEY = "3p7b4CMXTX8JPnjVpCpn9CM7uDYuPNAe";

var rating = "g";
var defaultTopics = ["pasta", "boba tea", "sushi", "ramen"];
var topics = JSON.parse(localStorage.getItem("topics")) || defaultTopics.slice();
var currentTopic = "";
var defaultLimit = 10;
var limitOffset = 0;
var favesHidden = true;
var storedFaves = JSON.parse(localStorage.getItem("favorites")) || {};
var foodOfTheDay = null;

/**
 * Displays a button for each topic
 */
function setupTopicButtons() {
    $("#topic-buttons").empty();

    var allTopics = topics.slice();
    if (foodOfTheDay) allTopics.push(foodOfTheDay);
    allTopics.forEach(topic => {
        var buttonClass = "btn btn-default topic";
        if (topic == foodOfTheDay) {
            buttonClass += " btn-info";
        }
        else if (defaultTopics.indexOf(topic) == -1) {
            buttonClass += " btn-warning";
        }

        $("#topic-buttons").append(

            $("<button>")
                .addClass(buttonClass)
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
    for (var faveKey in storedFaves) {
        var storedFave = storedFaves[faveKey];
        $("#faves").append(createGIFPanel(faveKey, storedFave.title, storedFave.rating, storedFave.stillURL, storedFave.animatedURL, storedFave.maxWidth, true));
    }

    var numFaves = Object.keys(storedFaves).length;
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
            var data = result.data;

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
    var gif = $(this)
    var isStill = Number(gif.attr("data-isStill"));

    // turn off animation on all others (not part of the assignment)
    // $(".gif[data-isStill=0]").each(function (i) { $(this).attr("data-isStill", 1); $(this).attr("src", $(this).attr("data-stillURL")) });

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

    var topic = $("#food-type").val().toLowerCase().trim();

    // if the input is empty, show an error and return
    if (!topic) {
        $(".form-group").addClass("has-error");
        $("#food-type").attr("placeholder", "required");
        return;
    }

    if (topics.indexOf(topic) != -1 || topic == foodOfTheDay) {
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
    var toggleButton = $("#faves-toggle");

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

    var panel = $(this).parents(".gif-panel");
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

    // Add the food of the day (pull today's national food holiday using rss2json api)
    $.ajax({
        url: 'https://api.rss2json.com/v1/api.json',
        method: 'GET',
        dataType: 'json',
        data: {
            rss_url: 'https://foodimentary.com/feed/',
            api_key: 'rv4krou4oxcj8fpt6hx5btus0ccexoyo27cpredh', // put your api key here
            count: 2
        }
    }).done(function (result) {

        if (result.status != 'ok') {
            //die silently
        }

        var title = result.items[0].title;

        // parse "today's food" from the title normally in the form of "[date] is National ____ Day!"
        // could also be "[date] is ___ day" such as "March 22nd is World Water day"
        title = title.toLowerCase().replace("national ", "");
        foodOfTheDay = title.substring(title.indexOf("is") + "is".length, title.indexOf("day")).trim().toLowerCase();
        setupTopicButtons();
    });
});