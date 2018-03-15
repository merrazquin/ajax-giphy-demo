
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

const GIPHY_API_KEY = "3p7b4CMXTX8JPnjVpCpn9CM7uDYuPNAe";

var topics = ["pasta", "pizza", "sushi", "ramen"];

function setupTopicButtons() {
    topics.forEach(topic => {
        $("#topic-buttons").append($("<button>").addClass("btn btn-default").text(topic));
    });
}

$(function () {
    setupTopicButtons();
});