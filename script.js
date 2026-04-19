let posts = [];
let username = "";
let profilePic = "";
let currentView = "home";

let tapMap = {};
let follows = {};
let searchQuery = "";

/* ---------------- LOAD DATA ---------------- */
window.onload = function () {
    let savedPosts = localStorage.getItem("posts");
    let savedUser = localStorage.getItem("username");
    let savedPic = localStorage.getItem("profilePic");
    let savedFollows = localStorage.getItem("follows");

    if (savedPosts) posts = JSON.parse(savedPosts);

    if (savedUser) {
        username = savedUser;
        document.getElementById("usernameInput").value = username;
    }

    if (savedPic) profilePic = savedPic;
    if (savedFollows) follows = JSON.parse(savedFollows);

    updateProfile();
    displayPosts();
};

/* ---------------- SAVE ALL ---------------- */
function saveAll() {
    localStorage.setItem("posts", JSON.stringify(posts));
    localStorage.setItem("follows", JSON.stringify(follows));
}

/* ---------------- SEARCH ---------------- */
function searchPosts() {
    searchQuery = document.getElementById("searchInput").value.toLowerCase();
    displayPosts();
}

/* clear search fix */
document.addEventListener("input", function (e) {
    if (e.target.id === "searchInput" && e.target.value.trim() === "") {
        searchQuery = "";
        displayPosts();
    }
});

/* ---------------- USER ---------------- */
function setUsername() {
    let input = document.getElementById("usernameInput").value;
    let picInput = document.getElementById("profilePicInput");

    if (input.trim() === "") return;

    username = input;
    localStorage.setItem("username", username);

    if (picInput && picInput.files.length > 0) {
        let reader = new FileReader();

        reader.onload = function (e) {
            profilePic = e.target.result;
            localStorage.setItem("profilePic", profilePic);
            updateProfile();
        };

        reader.readAsDataURL(picInput.files[0]);
    }

    updateProfile();
    alert("Profile saved!");
}

/* ---------------- FOLLOW SYSTEM ---------------- */
function toggleFollow(targetUser) {
    if (!username || username === targetUser) return;

    if (!follows[username]) follows[username] = [];

    let index = follows[username].indexOf(targetUser);

    if (index === -1) {
        follows[username].push(targetUser);
    } else {
        follows[username].splice(index, 1);
    }

    saveAll();
}

/* ---------------- NAV ---------------- */
function showHome() {
    currentView = "home";
    displayPosts();
}

function showProfile() {
    currentView = "profile";
    updateProfile();
    displayPosts();
}

function showSearch() {
    alert("Search is active in the search bar 🔍");
}

/* ---------------- PROFILE ---------------- */
function updateProfile() {
    if (!username) return;

    let userPosts = posts.filter(p => p.user === username);
    let totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);

    let followerCount = 0;

    Object.keys(follows).forEach(user => {
        if (follows[user].includes(username)) {
            followerCount++;
        }
    });

    let nameEl = document.getElementById("profileName");
    let postEl = document.getElementById("postCount");
    let likeEl = document.getElementById("likeCount");
    let followEl = document.getElementById("followCount");
    let picEl = document.getElementById("profilePicDisplay");

    if (nameEl) nameEl.innerText = "@" + username;
    if (postEl) postEl.innerText = "Posts: " + userPosts.length;
    if (likeEl) likeEl.innerText = "Likes: " + totalLikes;
    if (followEl) followEl.innerText = "Followers: " + followerCount;

    if (picEl) picEl.src = profilePic || "https://via.placeholder.com/80";
}

/* ---------------- CREATE POST ---------------- */
function createPost() {
    let textInput = document.getElementById("postInput");
    let imageInput = document.getElementById("imageInput");

    if (!username) return;

    if (textInput.value.trim() === "" && imageInput.files.length === 0) return;

    let newPost = {
        user: username,
        content: textInput.value,
        image: "",
        likes: 0,
        comments: []
    };

    function addPost() {
        posts.unshift(newPost);
        saveAll();
        displayPosts();
        updateProfile();
    }

    if (imageInput.files.length > 0) {
        let reader = new FileReader();

        reader.onload = function (e) {
            newPost.image = e.target.result;
            addPost();
        };

        reader.readAsDataURL(imageInput.files[0]);
    } else {
        addPost();
    }

    textInput.value = "";
    imageInput.value = "";
}

/* ---------------- DOUBLE TAP LIKE ---------------- */
function handleDoubleTap(post, postDiv) {
    let now = Date.now();

    if (!tapMap[post.content]) tapMap[post.content] = 0;

    let diff = now - tapMap[post.content];

    if (diff < 300) {
        post.likes++;
        saveAll();
        updateProfile();
        displayPosts();

        let heart = document.createElement("div");
        heart.innerText = "❤️";
        heart.style.position = "absolute";
        heart.style.fontSize = "40px";
        heart.style.left = "50%";
        heart.style.top = "50%";
        heart.style.transform = "translate(-50%, -50%)";
        heart.style.opacity = "1";
        heart.style.transition = "opacity 0.6s";

        postDiv.style.position = "relative";
        postDiv.appendChild(heart);

        setTimeout(() => {
            heart.style.opacity = "0";
        }, 200);

        setTimeout(() => {
            heart.remove();
        }, 800);
    }

    tapMap[post.content] = now;
}

/* ---------------- DISPLAY POSTS (SEARCH FIXED HERE) ---------------- */
function displayPosts() {
    let feed = document.getElementById("feed");
    feed.innerHTML = "";

    posts.forEach((post, index) => {

        // 🔍 SEARCH FILTER (SAFE)
        let matchUser = post.user.toLowerCase().includes(searchQuery);
        let matchContent = post.content.toLowerCase().includes(searchQuery);

        if (searchQuery && !(matchUser || matchContent)) return;

        if (currentView === "profile" && post.user !== username) return;

        let postDiv = document.createElement("div");
        postDiv.className = "post";

        // HEADER
        let header = document.createElement("div");

        let text = document.createElement("p");
        text.innerHTML = "<b>" + post.user + "</b>: " + post.content;

        let followBtn = document.createElement("button");

        if (post.user !== username) {
            let isFollowing = follows[username]?.includes(post.user);

            followBtn.innerText = isFollowing ? "Unfollow" : "Follow";

            followBtn.onclick = function () {
                toggleFollow(post.user);
                displayPosts();
            };
        } else {
            followBtn.style.display = "none";
        }

        header.appendChild(text);
        header.appendChild(followBtn);
        postDiv.appendChild(header);

        // IMAGE
        if (post.image) {
            let img = document.createElement("img");
            img.src = post.image;

            img.onclick = function () {
                handleDoubleTap(post, postDiv);
            };

            postDiv.appendChild(img);
        }

        // LIKE
        let likeBtn = document.createElement("button");
        likeBtn.innerText = "❤️ Like";

        let likeCount = document.createElement("span");
        likeCount.innerText = " " + post.likes + " likes";

        likeBtn.onclick = function () {
            post.likes++;
            saveAll();
            displayPosts();
            updateProfile();
        };

        postDiv.appendChild(likeBtn);
        postDiv.appendChild(likeCount);

        // DELETE
        let deleteBtn = document.createElement("button");
        deleteBtn.innerText = "🗑️ Delete";

        deleteBtn.onclick = function () {
            posts.splice(index, 1);
            saveAll();
            displayPosts();
            updateProfile();
        };

        postDiv.appendChild(deleteBtn);

        // COMMENTS
        let commentInput = document.createElement("input");
        commentInput.placeholder = "Write a comment...";

        let commentBtn = document.createElement("button");
        commentBtn.innerText = "Add Comment";

        let commentList = document.createElement("div");

        post.comments.forEach(c => {
            let p = document.createElement("p");
            p.innerText = c.user + ": " + c.text;
            commentList.appendChild(p);
        });

        commentBtn.onclick = function () {
            if (commentInput.value.trim() !== "") {
                post.comments.push({
                    user: username,
                    text: commentInput.value
                });

                saveAll();
                displayPosts();
            }
        };

        postDiv.appendChild(document.createElement("br"));
        postDiv.appendChild(commentInput);
        postDiv.appendChild(commentBtn);
        postDiv.appendChild(commentList);

        feed.appendChild(postDiv);
    });
}
