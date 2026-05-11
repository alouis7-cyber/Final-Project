let posts = [];
let username = "";
let currentUser = null;
let profilePic = "";
let currentView = "home";
let isLoggedIn = false;
let tapMap = {};
let follows = {};
let searchQuery = "";
let notifications = [];
let users = [{ username: "Anglad", password: "1234", profilePic: "" }];
let viewedUser = null;
let messages = {};

/* ---------------- LOAD DATA ---------------- */
window.onload = function () {
    let savedPosts = localStorage.getItem("posts");
    let savedUser = localStorage.getItem("username");
    let savedFollows = localStorage.getItem("follows");
    let savedNotifications = localStorage.getItem("notifications");
    let savedUsers = localStorage.getItem("users");
    let savedMessages = localStorage.getItem("messages");

    if (savedPosts) posts = JSON.parse(savedPosts);
    if (savedFollows) follows = JSON.parse(savedFollows);
    if (savedNotifications) notifications = JSON.parse(savedNotifications);
    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedMessages) messages = JSON.parse(savedMessages);

    if (savedUser) {
        username = savedUser;
        currentUser = users.find(u => u.username === username) || { username, profilePic: "" };
        isLoggedIn = true;
    }

    loadSuggestedUsers();
    loadStories();
    updateProfile();
    displayPosts();
};

/* ---------------- SAVE ALL ---------------- */
function saveAll() {
    localStorage.setItem("posts", JSON.stringify(posts));
    localStorage.setItem("follows", JSON.stringify(follows));
    localStorage.setItem("notifications", JSON.stringify(notifications));
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("messages", JSON.stringify(messages));
    if (username) localStorage.setItem("username", username);
}

/* ---------------- LOGIN HELPERS ---------------- */
function requireLogin() {
    if (!isLoggedIn || !username) {
        alert("Please login first!");
        return false;
    }
    return true;
}

/* ---------------- NOTIFICATIONS ---------------- */
function addNotification(text) {
    notifications.unshift({
        text,
        time: new Date().toLocaleTimeString()
    });
    saveAll();
}

function showNotifications() {
    let panel = document.getElementById("notificationsPanel");
    let list = document.getElementById("notificationsList");

    panel.style.display = "block";
    list.innerHTML = "";

    if (notifications.length === 0) {
        list.innerHTML = "<p>No notifications yet</p>";
        return;
    }

    notifications.forEach(n => {
        let div = document.createElement("div");
        div.innerHTML = `<p>${n.text}</p><small>${n.time}</small><hr>`;
        list.appendChild(div);
    });
}

/* ---------------- AUTH: SIGNUP / LOGIN / LOGOUT ---------------- */
function signup() {
    let user = document.getElementById("usernameInput").value.trim();
    let pass = document.getElementById("passwordInput").value.trim();
    let picInput = document.getElementById("profilePicInput");

    if (!user || !pass) {
        alert("Please fill username and password");
        return;
    }

    let exists = users.find(u => u.username === user);
    if (exists) {
        alert("User already exists!");
        return;
    }

    let newUser = {
        username: user,
        password: pass,
        profilePic: ""
    };

    function finishSignup() {
        users.push(newUser);
        saveAll();
        loadStories();
        alert("Account created!");
    }

    if (picInput.files.length > 0) {
        let reader = new FileReader();
        reader.onload = function (e) {
            newUser.profilePic = e.target.result;
            finishSignup();
        };
        reader.readAsDataURL(picInput.files[0]);
    } else {
        finishSignup();
    }
}

function login() {
    let user = document.getElementById("usernameInput").value.trim();
    let pass = document.getElementById("passwordInput").value.trim();

    let found = users.find(u => u.username === user && u.password === pass);

    if (!found) {
        alert("Wrong username or password!");
        return;
    }

    username = found.username;
    currentUser = found;
    isLoggedIn = true;

    saveAll();
    loadSuggestedUsers();
    loadStories();
    updateProfile();
    displayPosts();

    alert("Welcome " + username);
}

function logout() {
    username = "";
    currentUser = null;
    isLoggedIn = false;
    viewedUser = null;
    currentView = "home";

    localStorage.removeItem("username");

    alert("Logged out");
    updateProfile();
    displayPosts();
}

/* ---------------- PROFILE ---------------- */
function updateProfile() {
    let target = viewedUser || currentUser;

    let nameEl = document.getElementById("profileName");
    let postEl = document.getElementById("postCount");
    let likeEl = document.getElementById("likeCount");
    let followEl = document.getElementById("followCount");
    let picEl = document.getElementById("profilePicDisplay");

    if (!target) {
        if (nameEl) nameEl.innerText = "@guest";
        if (postEl) postEl.innerText = "Posts: 0";
        if (likeEl) likeEl.innerText = "Likes: 0";
        if (followEl) followEl.innerText = "Followers: 0";
        if (picEl) picEl.src = "https://via.placeholder.com/80";
        return;
    }

    let userPosts = posts.filter(p => p.user === target.username);
    let totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);

    let followerCount = 0;
    Object.keys(follows).forEach(user => {
        if (follows[user]?.includes(target.username)) {
            followerCount++;
        }
    });

    if (nameEl) nameEl.innerText = "@" + target.username;
    if (postEl) postEl.innerText = "Posts: " + userPosts.length;
    if (likeEl) likeEl.innerText = "Likes: " + totalLikes;
    if (followEl) followEl.innerText = "Followers: " + followerCount;
    if (picEl) picEl.src = target.profilePic || "https://via.placeholder.com/80";
}

function openProfile(user) {
    viewedUser = users.find(u => u.username === user) || { username: user, profilePic: "" };
    currentView = "profile";
    displayPosts();
    updateProfile();
}

function backToFeed() {
    viewedUser = null;
    currentView = "home";
    displayPosts();
    updateProfile();
}

/* ---------------- FOLLOW SYSTEM ---------------- */
function toggleFollow(targetUser) {
    if (!requireLogin()) return;
    if (username === targetUser) return;

    if (!follows[username]) follows[username] = [];

    let index = follows[username].indexOf(targetUser);

    if (index === -1) {
        follows[username].push(targetUser);
        addNotification(username + " followed " + targetUser + " 👥");
    } else {
        follows[username].splice(index, 1);
    }

    saveAll();
    loadSuggestedUsers();
    updateProfile();
}

/* ---------------- SUGGESTED USERS ---------------- */
function loadSuggestedUsers() {
    let list = document.getElementById("suggestedList");
    if (!list) return;

    list.innerHTML = "";
    if (!username) return;

    let following = follows[username] || [];

    let suggestions = users.filter(u =>
        u.username !== username && !following.includes(u.username)
    );

    suggestions.forEach(user => {
        let div = document.createElement("div");
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.marginBottom = "8px";

        let name = document.createElement("span");
        name.innerText = user.username;

        let btn = document.createElement("button");
        btn.innerText = "Follow";

        btn.onclick = function () {
            toggleFollow(user.username);
        };

        div.appendChild(name);
        div.appendChild(btn);
        list.appendChild(div);
    });
}

/* ---------------- CREATE POST ---------------- */
function createPost() {
    if (!requireLogin()) return;

    let textInput = document.getElementById("postInput");
    let imageInput = document.getElementById("imageInput");

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
        reader.onload = e => {
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

/* ---------------- DISPLAY POSTS ---------------- */
function displayPosts() {
    let feed = document.getElementById("feed");
    if (!feed) return;

    feed.innerHTML = "";

    posts.forEach((post, index) => {
        let matchUser = post.user.toLowerCase().includes(searchQuery);
        let matchContent = post.content.toLowerCase().includes(searchQuery);

        if (searchQuery && !(matchUser || matchContent)) return;

        if (currentView === "profile" && viewedUser && post.user !== viewedUser.username) return;

        let postDiv = document.createElement("div");
        postDiv.className = "post";

        /* HEADER */
        let header = document.createElement("div");
        let text = document.createElement("p");

        text.innerHTML = `
            <b style="cursor:pointer; color:blue;">
                ${post.user}
            </b>: ${post.content}
        `;

        let nameEl = text.querySelector("b");
        nameEl.onclick = function () {
            openProfile(post.user);
        };
        nameEl.ondblclick = function () {
            openChat(post.user);
        };

        let followBtn = document.createElement("button");
        if (post.user !== username && username) {
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

        /* IMAGE */
        if (post.image) {
            let img = document.createElement("img");
            img.src = post.image;
            postDiv.appendChild(img);
        }

        /* LIKE */
        let likeBtn = document.createElement("button");
        likeBtn.innerText = "❤️ Like";

        let likeCount = document.createElement("span");
        likeCount.innerText = " " + post.likes + " likes";

        likeBtn.onclick = function () {
            if (!requireLogin()) return;
            post.likes++;
            saveAll();
            displayPosts();
            updateProfile();
        };

        postDiv.appendChild(likeBtn);
        postDiv.appendChild(likeCount);

        /* DELETE */
        let deleteBtn = document.createElement("button");
        deleteBtn.innerText = "🗑️ Delete";

        deleteBtn.onclick = function () {
            if (post.user !== username) {
                alert("You can only delete your own posts.");
                return;
            }
            posts.splice(index, 1);
            saveAll();
            displayPosts();
            updateProfile();
        };

        postDiv.appendChild(deleteBtn);

        /* COMMENTS */
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
            if (!requireLogin()) return;
            if (commentInput.value.trim() !== "") {
                post.comments.push({
                    user: username,
                    text: commentInput.value
                });
                addNotification(username + " commented 💬");
                saveAll();
                displayPosts();
            }
        };

        postDiv.appendChild(commentInput);
        postDiv.appendChild(commentBtn);
        postDiv.appendChild(commentList);

        feed.appendChild(postDiv);
    });
}

/* ---------------- SEARCH ---------------- */
function searchPosts() {
    let input = document.getElementById("searchInput");
    searchQuery = (input.value || "").toLowerCase();
    displayPosts();
}

/* ---------------- STORIES ---------------- */
function loadStories() {
    let bar = document.getElementById("storiesBar");
    if (!bar) return;

    bar.innerHTML = "";

    users.forEach(user => {
        let story = document.createElement("div");
        story.className = "story";

        let img = document.createElement("img");
        img.src = user.profilePic || "https://via.placeholder.com/60";

        let name = document.createElement("span");
        name.innerText = user.username;

        story.onclick = function () {
            openProfile(user.username);
        };

        story.appendChild(img);
        story.appendChild(name);
        bar.appendChild(story);
    });
}

/* ---------------- CHAT ---------------- */
function saveMessages() {
    localStorage.setItem("messages", JSON.stringify(messages));
}

function getChatKey(user1, user2) {
    return [user1, user2].sort().join("_");
}

function openChat(user) {
    if (user === username || !username) return;

    let chatKey = getChatKey(username, user);

    let chatBox = document.getElementById("chatBox");
    let chatMessages = document.getElementById("chatMessages");

    chatBox.style.display = "block";
    chatBox.dataset.user = user;

    chatMessages.innerHTML = "";

    let chat = messages[chatKey] || [];

    chat.forEach(msg => {
        let p = document.createElement("p");
        p.innerText = msg.sender + ": " + msg.text;
        chatMessages.appendChild(p);
    });
}

function sendMessage() {
    if (!requireLogin()) return;

    let input = document.getElementById("chatInput");
    let receiver = document.getElementById("chatBox").dataset.user;

    if (!input.value.trim()) return;

    let key = getChatKey(username, receiver);

    if (!messages[key]) {
        messages[key] = [];
    }

    messages[key].push({
        sender: username,
        text: input.value
    });

    saveMessages();
    openChat(receiver);
    input.value = "";
}

/* ---------------- BOTTOM NAV / VIEWS ---------------- */
function setActiveTab(tab) {
    document.querySelectorAll(".bottom-nav button")
        .forEach(btn => btn.classList.remove("active"));

    if (tab === "home") document.querySelectorAll(".bottom-nav button")[0].classList.add("active");
    if (tab === "search") document.querySelectorAll(".bottom-nav button")[1].classList.add("active");
    if (tab === "profile") document.querySelectorAll(".bottom-nav button")[2].classList.add("active");
}

function showHome() {
    currentView = "home";
    viewedUser = null;
    displayPosts();
    updateProfile();
    setActiveTab("home");
}

function showSearch() {
    alert("Search is controlled by the search box above 🔍");
    setActiveTab("search");
}

function showProfile() {
    if (!requireLogin()) return;
    currentView = "profile";
    viewedUser = currentUser;
    displayPosts();
    updateProfile();
    setActiveTab("profile");
}

/* ---------------- SET DISPLAY USERNAME (OPTIONAL) ---------------- */
function setUsername() {
    let input = document.getElementById("displayUsernameInput");
    if (!input.value.trim()) return;

    username = input.value.trim();
    currentUser = users.find(u => u.username === username) || { username, profilePic: "" };
    isLoggedIn = true;

    saveAll();
    updateProfile();
    displayPosts();
}
