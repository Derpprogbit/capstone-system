
"use strict";

/*
 * GNC PeerLearn - Frontend Prototype
 *
 * Demo admin:
 * LRN/username: admin
 * Password: admin123
 *
 * Demo student:
 * LRN: 123456789012
 * Password: student123
 *
 * This prototype stores information in the current browser.
 * A real school deployment needs a secure backend and database.
 */

document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector) => document.querySelector(selector);

    const STORAGE = {
        users: "gncPeerLearnUsers",
        posts: "gncPeerLearnPosts",
        topics: "gncPeerLearnTopics",
        resources: "gncPeerLearnResources",
        resets: "gncPeerLearnResets",
        session: "gncPeerLearnSession"
    };

    const DEFAULT_TOPICS = [
        { name: "Programming", description: "Programming languages, logic, and problem solving." },
        { name: "Web Development", description: "HTML, CSS, JavaScript, and web applications." },
        { name: "Database", description: "SQL, database design, and data management." },
        { name: "Networking", description: "Networking concepts, IP addressing, and configuration." },
        { name: "School Help", description: "Questions about subjects, activities, and lessons." },
        { name: "Projects", description: "Capstone projects and collaborative development." },
        { name: "General", description: "Other academic questions and student discussions." }
    ];

    const $id = (id) => document.getElementById(id);

    function readData(key, fallback) {
        try {
            const stored = localStorage.getItem(key);
            return stored === null ? fallback : JSON.parse(stored);
        } catch (error) {
            console.error("Unable to read saved data:", error);
            return fallback;
        }
    }

    function saveData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Unable to save data:", error);
            showToast("Unable to save data in this browser.", true);
            return false;
        }
    }

    function getUsers() {
        return readData(STORAGE.users, []);
    }

    function getPosts() {
        return readData(STORAGE.posts, []);
    }

    function getTopics() {
        return readData(STORAGE.topics, DEFAULT_TOPICS);
    }

    function getResources() {
        return readData(STORAGE.resources, []);
    }

    function getResets() {
        return readData(STORAGE.resets, []);
    }

    function getSession() {
        return readData(STORAGE.session, null);
    }

    function currentUser() {
        const session = getSession();
        if (!session) return null;

        return getUsers().find(user => user.id === session.userId) || null;
    }

    function isAdmin() {
        const user = currentUser();
        return !!user && user.role === "admin";
    }

    function makeId() {
        return Date.now().toString(36) +
            Math.random().toString(36).slice(2, 9);
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function safeUrl(value) {
        try {
            const url = new URL(value);
            return ["https:", "http:"].includes(url.protocol)
                ? url.href
                : "";
        } catch {
            return "";
        }
    }

    function formatDate(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "Date unavailable";

        return date.toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short"
        });
    }

    let toastTimer;

    function showToast(message, isError = false) {
        const toast = $id("toast");
        if (!toast) return;

        toast.textContent = message;
        toast.classList.toggle("error", isError);
        toast.classList.add("show");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3200);
    }

    function setHidden(element, hidden) {
        if (element) element.classList.toggle("hidden", hidden);
    }

    function seedInitialData() {
        if (localStorage.getItem(STORAGE.users) === null) {
            saveData(STORAGE.users, [
                {
                    id: "demo-admin",
                    lrn: "admin",
                    name: "GNC Administrator",
                    course: "Administration",
                    password: "admin123",
                    role: "admin",
                    createdAt: new Date().toISOString()
                },
                {
                    id: "demo-student",
                    lrn: "123456789012",
                    name: "Demo Student",
                    course: "BSIT",
                    password: "student123",
                    role: "student",
                    createdAt: new Date().toISOString()
                }
            ]);
        }

        if (localStorage.getItem(STORAGE.topics) === null) {
            saveData(STORAGE.topics, DEFAULT_TOPICS);
        }

        if (localStorage.getItem(STORAGE.posts) === null) {
            saveData(STORAGE.posts, []);
        }

        if (localStorage.getItem(STORAGE.resources) === null) {
            saveData(STORAGE.resources, []);
        }

        if (localStorage.getItem(STORAGE.resets) === null) {
            saveData(STORAGE.resets, []);
        }
    }

    seedInitialData();

    // ---------------- AUTHENTICATION ----------------

    function showAuthForm(formName) {
        const forms = {
            login: $id("loginForm"),
            register: $id("registerForm"),
            forgot: $id("forgotForm")
        };

        Object.entries(forms).forEach(([name, form]) => {
            setHidden(form, name !== formName);
        });
    }

    function showLoginScreen() {
        setHidden($id("appScreen"), true);
        setHidden($id("authScreen"), false);
        showAuthForm("login");
    }

    function openApp(user) {
        saveData(STORAGE.session, { userId: user.id });

        setHidden($id("authScreen"), true);
        setHidden($id("appScreen"), false);

        setHidden($id("adminNav"), user.role !== "admin");
        setHidden($id("addResourceButton"), user.role !== "admin");

        $id("sidebarName").textContent = user.name;
        $id("sidebarRole").textContent =
            user.role === "admin" ? "Administrator" : user.course;

        $id("sidebarAvatar").textContent =
            (user.name.trim()[0] || "S").toUpperCase();

        $id("topName").textContent = user.name;
        $id("welcomeName").textContent = user.name.split(" ")[0];
        $id("statCourse").textContent = user.course;

        goToView("home");
        renderAll();
    }

    $id("loginForm").addEventListener("submit", event => {
        event.preventDefault();

        const lrn = $id("loginLrn").value.trim().toLowerCase();
        const password = $id("loginPassword").value;

        const user = getUsers().find(account =>
            account.lrn.toLowerCase() === lrn &&
            account.password === password
        );

        if (!user) {
            showToast("Invalid LRN or password. Please try again.", true);
            return;
        }

        openApp(user);
        $id("loginForm").reset();
        showToast("Welcome to GNC PeerLearn.");
    });

    $id("registerForm").addEventListener("submit", event => {
        event.preventDefault();

        const lrn = $id("registerLrn").value.trim();
        const name = $id("registerName").value.trim();
        const course = $id("registerCourse").value;
        const password = $id("registerPassword").value;
        const confirm = $id("registerConfirm").value;

        if (!lrn || !name || !course || !password) {
            showToast("Please complete all required fields.", true);
            return;
        }

        if (lrn.toLowerCase() === "admin") {
            showToast("That LRN cannot be used.", true);
            return;
        }

        if (getUsers().some(user =>
            user.lrn.toLowerCase() === lrn.toLowerCase()
        )) {
            showToast("An account with this LRN already exists.", true);
            return;
        }

        if (password.length < 6) {
            showToast("Your password must have at least 6 characters.", true);
            return;
        }

        if (password !== confirm) {
            showToast("The passwords do not match.", true);
            return;
        }

        const users = getUsers();
        users.push({
            id: makeId(),
            lrn,
            name,
            course,
            password,
            role: "student",
            createdAt: new Date().toISOString()
        });

        if (!saveData(STORAGE.users, users)) return;

        $id("registerForm").reset();
        $id("loginLrn").value = lrn;
        showAuthForm("login");
        showToast("Account created. You can now log in.");
    });

    $id("forgotForm").addEventListener("submit", event => {
        event.preventDefault();

        const lrn = $id("forgotLrn").value.trim();
        const user = getUsers().find(account =>
            account.lrn.toLowerCase() === lrn.toLowerCase() &&
            account.role !== "admin"
        );

        if (!user) {
            showToast("No matching student account was found.", true);
            return;
        }

        const requests = getResets();

        if (requests.some(request =>
            request.userId === user.id &&
            request.status === "pending"
        )) {
            showToast("You already have a pending reset request.");
            return;
        }

        requests.push({
            id: makeId(),
            userId: user.id,
            lrn: user.lrn,
            name: user.name,
            status: "pending",
            createdAt: new Date().toISOString()
        });

        if (!saveData(STORAGE.resets, requests)) return;

        $id("forgotForm").reset();
        showAuthForm("login");
        showToast("Reset request submitted for administrator review.");
    });

    // ---------------- NAVIGATION ----------------

    const VIEW_INFO = {
        home: { id: "homeView", title: "Student Discussion Feed" },
        topics: { id: "topicsView", title: "Discussion Topics" },
        myPosts: { id: "myPostsView", title: "My Posts" },
        resources: { id: "resourcesView", title: "Learning Resources" },
        admin: { id: "adminView", title: "Admin Dashboard" },
        postDetail: { id: "postDetailView", title: "Discussion Details" }
    };

    function goToView(view) {
        if (!VIEW_INFO[view]) view = "home";

        if (view === "admin" && !isAdmin()) {
            view = "home";
            showToast("Administrator access is required.", true);
        }

        Object.entries(VIEW_INFO).forEach(([key, info]) => {
            setHidden($id(info.id), key !== view);
        });

        document.querySelectorAll(".nav-item[data-view]").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.view === view
            );
        });

        $id("pageCrumb").textContent =
            view === "postDetail" ? "Discussion" :
            VIEW_INFO[view].title;

        $id("pageHeading").textContent = VIEW_INFO[view].title;

        closeSidebar();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.querySelectorAll("[data-view]").forEach(button => {
        button.addEventListener("click", () => {
            const view = button.dataset.view;
            goToView(view);

            if (view === "home") {
                $id("feedFilter").value = "All";
            }

            renderAll();
        });
    });

    function openSidebar() {
        $id("sidebar").classList.add("open");
        $id("sidebarOverlay").classList.add("open");
    }

    function closeSidebar() {
        $id("sidebar").classList.remove("open");
        $id("sidebarOverlay").classList.remove("open");
    }

    $id("openSidebar").addEventListener("click", openSidebar);
    $id("closeSidebar").addEventListener("click", closeSidebar);
    $id("sidebarOverlay").addEventListener("click", closeSidebar);

    $id("logoutButton").addEventListener("click", () => {
        localStorage.removeItem(STORAGE.session);
        showLoginScreen();
        $id("loginPassword").value = "";
        showToast("You have logged out.");
    });

    // ---------------- GENERAL BUTTON ACTIONS ----------------

    document.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        switch (button.dataset.action) {
            case "show-login":
                showAuthForm("login");
                break;

            case "show-register":
                showAuthForm("register");
                break;

            case "show-forgot":
                showAuthForm("forgot");
                break;

            case "new-post":
                goToView("home");
                setHidden($id("postForm"), false);
                $id("postTitle").focus();
                break;

            case "cancel-post":
                $id("postForm").reset();
                setHidden($id("postForm"), true);
                break;

            case "new-resource":
                if (!isAdmin()) return;
                setHidden($id("resourceForm"), false);
                $id("resourceTitle").focus();
                break;

            case "cancel-resource":
                $id("resourceForm").reset();
                setHidden($id("resourceForm"), true);
                break;

            case "back-to-feed":
                goToView("home");
                renderPosts();
                break;

            case "close-reset":
                $id("resetDialog").close();
                break;

            case "open-post":
                openPost(button.dataset.id);
                break;

            case "delete-post":
                deletePost(button.dataset.id);
                break;

            case "delete-topic":
                deleteTopic(button.dataset.name);
                break;

            case "delete-resource":
                deleteResource(button.dataset.id);
                break;

            case "review-reset":
                openResetDialog(button.dataset.id);
                break;

            case "dismiss-reset":
                dismissReset(button.dataset.id);
                break;

            case "remove-user":
                removeUser(button.dataset.id);
                break;

            case "filter-topic":
                $id("feedFilter").value = button.dataset.name;
                goToView("home");
                renderPosts();
                break;
        }
    });

    // ---------------- TOPIC MANAGEMENT ----------------

    function categoryExists(category) {
        return getTopics().some(topic =>
            topic.name.toLowerCase() === category.toLowerCase()
        );
    }

    function updateTopicSelects() {
        const topics = getTopics();
        const postSelect = $id("postCategory");
        const feedSelect = $id("feedFilter");

        const currentPostCategory = postSelect.value;
        const currentFilter = feedSelect.value;

        postSelect.innerHTML = topics.map(topic =>
            `<option value="${escapeHTML(topic.name)}">${escapeHTML(topic.name)}</option>`
        ).join("");

        feedSelect.innerHTML =
            `<option value="All">All topics</option>` +
            topics.map(topic =>
                `<option value="${escapeHTML(topic.name)}">${escapeHTML(topic.name)}</option>`
            ).join("");

        if (topics.some(topic => topic.name === currentPostCategory)) {
            postSelect.value = currentPostCategory;
        }

        if (currentFilter === "All" ||
            topics.some(topic => topic.name === currentFilter)) {
            feedSelect.value = currentFilter || "All";
        } else {
            feedSelect.value = "All";
        }
    }

    $id("topicForm").addEventListener("submit", event => {
        event.preventDefault();

        if (!isAdmin()) {
            showToast("Administrator access is required.", true);
            return;
        }

        const name = $id("newTopicName").value.trim();

        if (!name) return;

        if (name.length > 50) {
            showToast("Topic names must be 50 characters or fewer.", true);
            return;
        }

        if (categoryExists(name)) {
            showToast("This topic already exists.", true);
            return;
        }

        const topics = getTopics();
        topics.push({
            name,
            description: "A space for student discussions about " + name + "."
        });

        if (!saveData(STORAGE.topics, topics)) return;

        $id("topicForm").reset();
        renderAll();
        showToast("Topic added successfully.");
    });

    function deleteTopic(name) {
        if (!isAdmin()) return;

        const topics = getTopics();
        const topic = topics.find(item => item.name === name);
        if (!topic) return;

        if (DEFAULT_TOPICS.some(item => item.name === name)) {
            showToast("Default topics cannot be deleted.", true);
            return;
        }

        if (!confirm(`Delete the topic "${name}"? Existing posts will remain.`)) {
            return;
        }

        if (!saveData(
            STORAGE.topics,
            topics.filter(item => item.name !== name)
        )) return;

        updateTopicSelects();
        renderAll();
        showToast("Topic deleted.");
    }

    function renderTopics() {
        const topics = getTopics();
        const posts = getPosts();

        $id("topicCards").innerHTML = topics.map(topic => {
            const count = posts.filter(post =>
                post.category === topic.name
            ).length;

            return `
                <article class="topic-card">
                    <span class="topic-badge">DISCUSSION TOPIC</span>
                    <h3>${escapeHTML(topic.name)}</h3>
                    <p>${escapeHTML(topic.description)}</p>
                    <p>${count} discussion${count === 1 ? "" : "s"}</p>
                    <button class="button button-primary"
                            type="button"
                            data-action="filter-topic"
                            data-name="${escapeHTML(topic.name)}">
                        View Discussions
                    </button>
                </article>`;
        }).join("") || `<div class="admin-empty">No topics available.</div>`;

        $id("adminTopicList").innerHTML = topics.map(topic => `
            <div class="admin-list-item">
                <div class="admin-list-copy">
                    <strong>${escapeHTML(topic.name)}</strong>
                    <span>${escapeHTML(topic.description)}</span>
                </div>
                ${
                    DEFAULT_TOPICS.some(item => item.name === topic.name)
                    ? `<span class="topic-badge">Default</span>`
                    : `<button class="button button-danger" type="button"
                        data-action="delete-topic"
                        data-name="${escapeHTML(topic.name)}">Delete</button>`
                }
            </div>
        `).join("") || `<div class="admin-empty">No topics added.</div>`;
    }

    // ---------------- DISCUSSION POSTS ----------------

    $id("postForm").addEventListener("submit", event => {
        event.preventDefault();

        const user = currentUser();
        if (!user) return showLoginScreen();

        const title = $id("postTitle").value.trim();
        const body = $id("postBody").value.trim();
        const category = $id("postCategory").value;

        if (!title || !body) {
            showToast("Please enter a title and message.", true);
            return;
        }

        if (!categoryExists(category)) {
            showToast("Please select a valid discussion topic.", true);
            return;
        }

        const posts = getPosts();

        posts.unshift({
            id: makeId(),
            title,
            body,
            category,
            authorId: user.id,
            authorName: user.name,
            authorCourse: user.course,
            createdAt: new Date().toISOString(),
            comments: []
        });

        if (!saveData(STORAGE.posts, posts)) return;

        $id("postForm").reset();
        setHidden($id("postForm"), true);

        updateTopicSelects();
        renderAll();
        goToView("home");
        showToast("Your discussion has been published.");
    });

    function canDeletePost(post) {
        const user = currentUser();
        return !!user &&
            (user.role === "admin" || post.authorId === user.id);
    }

    function postCardHTML(post) {
        const user = currentUser();
        const comments = Array.isArray(post.comments) ? post.comments : [];
        const canDelete = canDeletePost(post);
        const initial = (post.authorName || "S").trim()[0] || "S";

        return `
            <article class="post-card">
                <div class="post-card-header">
                    <div class="post-author">
                        <div class="avatar">${escapeHTML(initial.toUpperCase())}</div>
                        <div class="post-author-copy">
                            <strong>${escapeHTML(post.authorName)}</strong>
                            <span>${escapeHTML(post.authorCourse || "")} · ${escapeHTML(formatDate(post.createdAt))}</span>
                        </div>
                    </div>
                    <span class="topic-badge">${escapeHTML(post.category)}</span>
                </div>

                <h3>${escapeHTML(post.title)}</h3>
                <p class="post-body">${escapeHTML(post.body)}</p>

                <div class="post-footer">
                    <button class="post-action" type="button"
                            data-action="open-post" data-id="${escapeHTML(post.id)}">
                        Open Discussion · ${comments.length} comment${comments.length === 1 ? "" : "s"}
                    </button>

                    ${canDelete ? `
                        <button class="post-action danger" type="button"
                                data-action="delete-post"
                                data-id="${escapeHTML(post.id)}">
                            Delete Post
                        </button>` : ""}
                </div>
            </article>`;
    }

    function renderPosts() {
        const posts = getPosts();
        const user = currentUser();
        const filter = $id("feedFilter").value;

        const filtered = posts.filter(post =>
            filter === "All" || post.category === filter
        );

        $id("postList").innerHTML = filtered.map(postCardHTML).join("");
        setHidden($id("emptyFeed"), filtered.length !== 0);
        $id("postCount").textContent =
            `${filtered.length} discussion${filtered.length === 1 ? "" : "s"}`;

        const myPosts = user
            ? posts.filter(post => post.authorId === user.id)
            : [];

        $id("myPostList").innerHTML = myPosts.map(postCardHTML).join("");
        setHidden($id("emptyMyPosts"), myPosts.length !== 0);

        $id("statPosts").textContent = posts.length;
        $id("statComments").textContent = posts.reduce(
            (total, post) =>
                total + (Array.isArray(post.comments) ? post.comments.length : 0),
            0
        );

        $id("statCourse").textContent = user ? user.course : "—";
    }

    $id("feedFilter").addEventListener("change", renderPosts);

    function openPost(postId) {
        const post = getPosts().find(item => item.id === postId);

        if (!post) {
            showToast("This discussion could not be found.", true);
            return;
        }

        const comments = Array.isArray(post.comments) ? post.comments : [];
        const canDelete = canDeletePost(post);
        const user = currentUser();

        $id("postDetail").innerHTML = `
            <article class="post-card">
                <div class="post-card-header">
                    <div class="post-author">
                        <div class="avatar">${escapeHTML((post.authorName || "S")[0].toUpperCase())}</div>
                        <div class="post-author-copy">
                            <strong>${escapeHTML(post.authorName)}</strong>
                            <span>${escapeHTML(post.authorCourse || "")} · ${escapeHTML(formatDate(post.createdAt))}</span>
                        </div>
                    </div>
                    <span class="topic-badge">${escapeHTML(post.category)}</span>
                </div>

                <h3>${escapeHTML(post.title)}</h3>
                <p class="post-body">${escapeHTML(post.body)}</p>

                ${canDelete ? `
                    <div class="post-footer">
                        <button class="post-action danger" type="button"
                                data-action="delete-post"
                                data-id="${escapeHTML(post.id)}">
                            Delete Post
                        </button>
                    </div>` : ""}

                <div class="post-detail-content">
                    <h3>Comments (${comments.length})</h3>
                    <div class="comment-list">
                        ${comments.map(comment => `
                            <div class="comment-item">
                                <strong>${escapeHTML(comment.authorName)}</strong>
                                <p>${escapeHTML(comment.body)}</p>
                                <span class="comment-date">${escapeHTML(formatDate(comment.createdAt))}</span>
                            </div>
                        `).join("") || `<div class="admin-empty">No comments yet. Be the first to respond.</div>`}
                    </div>

                    ${user ? `
                        <form class="comment-form" id="commentForm">
                            <label for="commentBody">Write a comment</label>
                            <textarea id="commentBody" maxlength="2000"
                                      placeholder="Share a helpful response..."
                                      required></textarea>
                            <button class="button button-primary" type="submit">
                                Publish Comment
                            </button>
                        </form>` : ""}
                </div>
            </article>`;

        goToView("postDetail");

        const commentForm = $id("commentForm");
        if (commentForm) {
            commentForm.addEventListener("submit", event => {
                event.preventDefault();

                const current = currentUser();
                const body = $id("commentBody").value.trim();

                if (!current || !body) return;

                const latestPosts = getPosts();
                const targetPost = latestPosts.find(item => item.id === postId);

                if (!targetPost) return;

                if (!Array.isArray(targetPost.comments)) {
                    targetPost.comments = [];
                }

                targetPost.comments.push({
                    id: makeId(),
                    authorId: current.id,
                    authorName: current.name,
                    body,
                    createdAt: new Date().toISOString()
                });

                if (!saveData(STORAGE.posts, latestPosts)) return;

                renderAll();
                openPost(postId);
                showToast("Your comment has been published.");
            });
        }
    }

    function deletePost(postId) {
        const posts = getPosts();
        const post = posts.find(item => item.id === postId);

        if (!post || !canDeletePost(post)) {
            showToast("You are not allowed to delete this post.", true);
            return;
        }

        if (!confirm(`Delete the discussion "${post.title}"?`)) return;

        if (!saveData(
            STORAGE.posts,
            posts.filter(item => item.id !== postId)
        )) return;

        goToView("home");
        renderAll();
        showToast("Discussion deleted.");
    }

    // ---------------- LEARNING RESOURCES ----------------

    $id("resourceForm").addEventListener("submit", event => {
        event.preventDefault();

        if (!isAdmin()) {
            showToast("Only administrators can add resources.", true);
            return;
        }

        const title = $id("resourceTitle").value.trim();
        const rawUrl = $id("resourceUrl").value.trim();
        const description = $id("resourceDescription").value.trim();
        const url = safeUrl(rawUrl);

        if (!title || !url) {
            showToast("Enter a valid HTTP or HTTPS resource URL.", true);
            return;
        }

        const resources = getResources();

        resources.unshift({
            id: makeId(),
            title,
            url,
            description,
            createdAt: new Date().toISOString(),
            createdBy: currentUser().name
        });

        if (!saveData(STORAGE.resources, resources)) return;

        $id("resourceForm").reset();
        setHidden($id("resourceForm"), true);
        renderAll();
        showToast("Learning resource added.");
    });

    function renderResources() {
        const resources = getResources();

        $id("resourceList").innerHTML = resources.map(resource => {
            const url = safeUrl(resource.url);
            if (!url) return "";

            return `
                <article class="resource-card">
                    <span class="topic-badge">LEARNING RESOURCE</span>
                    <h3>${escapeHTML(resource.title)}</h3>
                    <p>${escapeHTML(resource.description || "Shared learning material.")}</p>
                    <a href="${escapeHTML(url)}" target="_blank"
                       rel="noopener noreferrer">Open Resource ↗</a>
                    ${isAdmin() ? `
                        <div class="post-footer">
                            <button class="post-action danger" type="button"
                                    data-action="delete-resource"
                                    data-id="${escapeHTML(resource.id)}">
                                Delete Resource
                            </button>
                        </div>` : ""}
                </article>`;
        }).join("");

        setHidden($id("emptyResources"), resources.length > 0);
    }

    function deleteResource(resourceId) {
        if (!isAdmin()) return;

        const resources = getResources();
        const resource = resources.find(item => item.id === resourceId);
        if (!resource) return;

        if (!confirm(`Delete the resource "${resource.title}"?`)) return;

        if (!saveData(
            STORAGE.resources,
            resources.filter(item => item.id !== resourceId)
        )) return;

        renderResources();
        showToast("Resource deleted.");
    }

    // ---------------- PASSWORD RESET ADMIN FLOW ----------------

    function openResetDialog(requestId) {
        if (!isAdmin()) return;

        const request = getResets().find(item =>
            item.id === requestId && item.status === "pending"
        );

        if (!request) {
            showToast("This request is no longer pending.", true);
            renderAdmin();
            return;
        }

        $id("resetRequestId").value = request.id;
        $id("resetDialogDescription").textContent =
            `Set a new password for ${request.name} (LRN: ${request.lrn}).`;

        $id("newResetPassword").value = "";
        $id("resetDialog").showModal();
    }

    $id("resetPasswordForm").addEventListener("submit", event => {
        event.preventDefault();

        if (!isAdmin()) return;

        const requestId = $id("resetRequestId").value;
        const password = $id("newResetPassword").value;

        if (password.length < 6) {
            showToast("The new password must have at least 6 characters.", true);
            return;
        }

        const requests = getResets();
        const request = requests.find(item =>
            item.id === requestId && item.status === "pending"
        );

        if (!request) {
            showToast("This request is no longer pending.", true);
            $id("resetDialog").close();
            renderAdmin();
            return;
        }

        const users = getUsers();
        const user = users.find(item => item.id === request.userId);

        if (!user) {
            showToast("The student account could not be found.", true);
            return;
        }

        user.password = password;
        request.status = "completed";
        request.completedAt = new Date().toISOString();

        if (!saveData(STORAGE.users, users)) return;
        if (!saveData(STORAGE.resets, requests)) return;

        $id("resetDialog").close();
        renderAll();
        showToast("Password updated successfully.");
    });

    function dismissReset(requestId) {
        if (!isAdmin()) return;

        const requests = getResets();
        const request = requests.find(item => item.id === requestId);

        if (!request) return;

        if (!confirm("Dismiss this password reset request?")) return;

        if (!saveData(
            STORAGE.resets,
            requests.filter(item => item.id !== requestId)
        )) return;

        renderAdmin();
        showToast("Reset request dismissed.");
    }

    // ---------------- ADMIN ACCOUNT MANAGEMENT ----------------

    function removeUser(userId) {
        if (!isAdmin()) return;

        const user = getUsers().find(item => item.id === userId);

        if (!user || user.role === "admin") {
            showToast("This account cannot be removed here.", true);
            return;
        }

        if (!confirm(`Delete the account for ${user.name}? Their posts will remain.`)) {
            return;
        }

        if (!saveData(
            STORAGE.users,
            getUsers().filter(item => item.id !== userId)
        )) return;

        // Also remove pending reset requests for the deleted account.
        saveData(
            STORAGE.resets,
            getResets().filter(item => item.userId !== userId)
        );

        renderAll();
        showToast("Student account removed.");
    }

    // ---------------- RENDER ADMIN DASHBOARD ----------------

    function renderAdmin() {
        if (!isAdmin()) return;

        const users = getUsers();
        const posts = getPosts();
        const requests = getResets();
        const pending = requests.filter(item => item.status === "pending");

        $id("adminPostCount").textContent = posts.length;
        $id("adminUserCount").textContent =
            users.filter(user => user.role !== "admin").length;
        $id("adminResetCount").textContent = pending.length;

        $id("resetRequestList").innerHTML = pending.map(request => `
            <div class="admin-list-item">
                <div class="admin-list-copy">
                    <strong>${escapeHTML(request.name)}</strong>
                    <span>LRN: ${escapeHTML(request.lrn)}</span>
                    <span>${escapeHTML(formatDate(request.createdAt))}</span>
                </div>
                <div class="admin-list-actions">
                    <button class="button button-primary" type="button"
                            data-action="review-reset"
                            data-id="${escapeHTML(request.id)}">Set Password</button>
                    <button class="button button-muted" type="button"
                            data-action="dismiss-reset"
                            data-id="${escapeHTML(request.id)}">Dismiss</button>
                </div>
            </div>
        `).join("") || `<div class="admin-empty">There are no pending reset requests.</div>`;

        $id("moderationList").innerHTML = posts.map(post => `
            <div class="admin-list-item">
                <div class="admin-list-copy">
                    <strong>${escapeHTML(post.title)}</strong>
                    <span>By ${escapeHTML(post.authorName)} · ${escapeHTML(post.category)}</span>
                    <span>${escapeHTML(formatDate(post.createdAt))}</span>
                </div>
                <div class="admin-list-actions">
                    <button class="button button-muted" type="button"
                            data-action="open-post"
                            data-id="${escapeHTML(post.id)}">View</button>
                    <button class="button button-danger" type="button"
                            data-action="delete-post"
                            data-id="${escapeHTML(post.id)}">Delete</button>
                </div>
            </div>
        `).join("") || `<div class="admin-empty">There are no discussions to moderate.</div>`;

        $id("adminAccountsList").innerHTML = users.map(user => `
            <div class="admin-list-item">
                <div class="admin-list-copy">
                    <strong>${escapeHTML(user.name)}</strong>
                    <span>LRN: ${escapeHTML(user.lrn)} · ${escapeHTML(user.course)}</span>
                    <span>Role: ${escapeHTML(user.role)}</span>
                </div>
                ${user.role !== "admin" ? `
                    <button class="button button-danger" type="button"
                            data-action="remove-user"
                            data-id="${escapeHTML(user.id)}">Remove</button>` : ""}
            </div>
        `).join("") || `<div class="admin-empty">No accounts found.</div>`;
    }

    // ---------------- FULL RENDER ----------------

    function renderAll() {
        updateTopicSelects();
        renderPosts();
        renderTopics();
        renderResources();

        if (isAdmin()) {
            renderAdmin();
        }
    }

    // ---------------- STARTUP ----------------

    document.querySelectorAll('[data-action="show-login"]').forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            showAuthForm("login");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    const session = getSession();
    const loggedInUser = session
        ? getUsers().find(user => user.id === session.userId)
        : null;

    if (loggedInUser) {
        openApp(loggedInUser);
    } else {
        showLoginScreen();
    }
});
