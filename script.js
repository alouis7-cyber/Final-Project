let posts = [];
let username = "";
let profilePic = "";
let currentView = "home";
let isLoggedIn = false;
let tapMap = {};
let follows = {};
let searchQuery = "";
let notifications = [];
let users = [ { username: "alex", password: "1234", profilePic: "" }];
let currentUser = null;
let viewedUser = null;
let messages = {};

/* ---------------- LOAD DATA ---------------- */
window.onload = function () {
    let savedPosts = localStorage.getItem("posts");
    let savedUser = localStorage.getItem("username");
    let savedPic = localStorage.getItem("profilePic");
    let savedFollows = localStorage.getItem("follows");
    let savedNotifications = localStorage.getItem("notifications");
    let savedUsers = localStorage.getItem("users");
    let savedMessages = localStorage.getItem("messages");

if (savedMessages) {
    messages = JSON.parse(savedMessages);
}
    if (savedPosts) posts = JSON.parse(savedPosts);
    if (savedFollows) follows = JSON.parse(savedFollows);
    if (savedNotifications) notifications = JSON.parse(savedNotifications);
    if (savedUsers) users = JSON.parse(savedUsers);

    if (savedUser) {
        username = savedUser;
        currentUser = savedUser;
    }

    if (!savedUsers) {
    users = [];

    } else {

    users = JSON.parse(savedUsers);
}

loadSuggestedUsers();

let savedUsers = localStorage.getItem("users");

if (savedUsers) {
    users = JSON.parse(savedUsers);
    }

    updateProfile();
    displayPosts();
};

/* ---------------- SAVE ALL ---------------- */
function saveAll() {
    localStorage.setItem("posts", JSON.stringify(posts));
    localStorage.setItem("follows", JSON.stringify(follows));
    localStorage.setItem("notifications", JSON.stringify(notifications));
    localStorage.setItem("users", JSON.stringify(users));
}

/* ---------------- LOGIN HELPERS ---------------- */
function requireLogin() {
    if (!username) {
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

/* ---------------- FOLLOW SYSTEM ---------------- */
function toggleFollow(targetUser) {
    if (!username || username === targetUser) return;

    if (!follows[username]) follows[username] = [];

    let index = follows[username].indexOf(targetUser);

    if (index === -1) {
        follows[username].push(targetUser);
        addNotification(username + " followed " + targetUser + " 👥");
    } else {
        follows[username].splice(index, 1);
    }

    saveAll();
}

/* ---------------- PROFILE ---------------- */
function updateProfile() {
    let target = viewedUser || username;

    let userPosts = posts.filter(p => p.user === target);
    let totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);

    let followerCount = 0;

    Object.keys(follows).forEach(user => {
        if (follows[user]?.includes(target)) {
            followerCount++;
        }
    });

    let nameEl = document.getElementById("profileName");
    let postEl = document.getElementById("postCount");
    let likeEl = document.getElementById("likeCount");
    let followEl = document.getElementById("followCount");

    if (nameEl) nameEl.innerText = "@" + target;
    if (postEl) postEl.innerText = "Posts: " + userPosts.length;
    if (likeEl) likeEl.innerText = "Likes: " + totalLikes;
    if (followEl) followEl.innerText = "Followers: " + followerCount;
}

/* ---------------- OPEN PROFILE ---------------- */
function openProfile(user) {
    viewedUser = user;
    currentView = "profile";
    displayPosts();
    updateProfile();
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
    feed.innerHTML = "";

    posts.forEach((post, index) => {

        let matchUser = post.user.toLowerCase().includes(searchQuery);
        let matchContent = post.content.toLowerCase().includes(searchQuery);

        if (searchQuery && !(matchUser || matchContent)) return;

        if (currentView === "profile" && post.user !== viewedUser && viewedUser !== null) return;

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
text.querySelector("b").onclick = function () {
    openProfile(post.user);
};

text.querySelector("b").ondblclick = function () {
    openChat(post.user);
};

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

/* ---------------- NOTIFICATIONS ---------------- */
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

function signup() {
    let user = document.getElementById("usernameInput").value;
    let pass = document.getElementById("passwordInput").value;
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

    // HANDLE IMAGE
    if (picInput.files.length > 0) {
        let reader = new FileReader();

        reader.onload = function (e) {
            newUser.profilePic = e.target.result;

            users.push(newUser);
            localStorage.setItem("users", JSON.stringify(users));

            alert("Account created with profile photo!");
        };

        reader.readAsDataURL(picInput.files[0]);
    } else {
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        alert("Account created!");
    }
}
function login() {
    let user = document.getElementById("usernameInput").value;
    let pass = document.getElementById("passwordInput").value;

    let found = users.find(u => u.username === user && u.password === pass);

    if (!found) {
        alert("Wrong username or password!");
        return;
    }
    loadSuggestedUsers();
    username = found.username;
    currentUser = found;
    isLoggedIn = true;

    localStorage.setItem("username", username);

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

    displayPosts();
    }

function requireLogin() {
    if (!isLoggedIn) {
        alert("Please login first!");
        return false;
    }
    return true;
}

function updateProfile() {

    let target = viewedUser || currentUser;

    if (!target) return;

    let userPosts = posts.filter(p => p.user === target.username);
    let totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);

    let followerCount = 0;

    loadSuggestedUsers();

    Object.keys(follows).forEach(user => {
        if (follows[user]?.includes(target.username)) {
            followerCount++;
        }
    });

    let followBtn = document.getElementById("followBtn");

    if (!followBtn) {

    followBtn = document.createElement("button");
    followBtn.id = "followBtn";
    document.getElementById("profileSection").appendChild(followBtn);
}

if (!viewedUser || viewedUser.username === username) {
    followBtn.style.display = "none";
} else {
    followBtn.style.display = "block";

    let isFollowing = follows[username]?.includes(viewedUser.username);

    followBtn.innerText = isFollowing ? "Unfollow" : "Follow";

    followBtn.onclick = function () {

        if (!follows[username]) {
            follows[username] = [];
        }

        let index = follows[username].indexOf(viewedUser.username);

        if (index === -1) {
            follows[username].push(viewedUser.username);

            addNotification(username + " followed " + viewedUser.username + " 👥");
        } else {
            follows[username].splice(index, 1);
        }

        saveAll();
        updateProfile();
    };
}

    let nameEl = document.getElementById("profileName");
    let postEl = document.getElementById("postCount");
    let likeEl = document.getElementById("likeCount");
    let picEl = document.getElementById("profilePicDisplay");

    if (nameEl) nameEl.innerText = "@" + target.username;
    if (postEl) postEl.innerText = "Posts: " + userPosts.length;
    if (likeEl) likeEl.innerText = "Likes: " + totalLikes;

    if (picEl) {
        picEl.src = target.profilePic || "https://via.placeholder.com/80";
    }
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
}

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
            if (!follows[username]) follows[username] = [];

            follows[username].push(user.username);

            addNotification(username + " followed " + user.username + " 👥");

            saveAll();
            loadSuggestedUsers();
            updateProfile();
        };

        div.appendChild(name);
        div.appendChild(btn);

        list.appendChild(div);
    });
}

function saveMessages() {
    localStorage.setItem("messages", JSON.stringify(messages));
}

function openChat(user) {
    if (user === username) return;

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

function getChatKey(user1, user2) {
    return [user1, user2].sort().join("_");
}

function sendMessage() {
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

}
