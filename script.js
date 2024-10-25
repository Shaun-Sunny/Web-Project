


// Star rating system
let stars = document.getElementsByClassName("star");
let output = document.getElementById("output");
let ratingInput = document.getElementById("rating"); // Hidden input for storing the rating
let selectedRating = 0;

// Function to update rating
function gfg(n) {
    selectedRating = n;
    ratingInput.value = n; // Set the hidden rating input value
    remove();
    for (let i = 0; i < n; i++) {
        stars[i].classList.add("selected");
    }
    output.innerText = "Rating is: " + n + "/5";
}

// To remove the pre-applied styling
function remove() {
    let i = 0;
    while (i < 5) {
        stars[i].classList.remove("selected");
        i++;
    }
}

// Handle review form submission
document.getElementById('reviewForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const reviewText = document.getElementById('reviewText').value;
    const rating = document.getElementById('rating').value;
    const publicReview = document.getElementById('publicReview').checked;

    const reviewData = {
        user_id: userId,
        review_text: reviewText,
        rating: parseInt(rating),
        public_review: publicReview,
        date: new Date().toISOString().split('T')[0]  // Adds current date
    };

    // POST review data to the backend
    const response = await fetch('/submit-review', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
    });

    if (response.ok) {
        alert('Review submitted successfully!');
        document.getElementById('reviewForm').reset();
        output.innerText = "Rating is: 0/5"; // Reset rating output
        remove(); // Reset star styles
    } else {
        alert('Error submitting review');
    }
});










