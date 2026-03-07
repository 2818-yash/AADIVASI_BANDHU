let socket = null;
let isSocketReady = false;
let selectedUserId = null;
let isAdmin = IS_ADMIN;

let unreadCounts = {};
let totalUnread = 0;

// Deduplication set (helps with history + any race conditions)
const renderedMessageIds = new Set();

document.addEventListener("DOMContentLoaded", () => {

  const fab = document.getElementById("chat-fab");
  const chatBox = document.getElementById("chat-box");
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("chat-send");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const userList = document.getElementById("admin-user-list");
  const overlay = document.getElementById("chat-overlay");
  const toggleBadge = document.getElementById("chat-unread-badge");

  /* ================= SOCKET ================= */
  function connectSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) return;

    socket = new WebSocket(
      (location.protocol === "https:" ? "wss://" : "ws://") +
      location.host +
      "/ws/support-chat/"
    );

    socket.onopen = () => {
      isSocketReady = true;
      sendBtn.disabled = false;

      if (isAdmin) {
        socket.send(JSON.stringify({ type: "get_unread_summary" }));
      }
    };

    socket.onclose = () => {
      isSocketReady = false;
      sendBtn.disabled = true;
      setTimeout(connectSocket, 3000);
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);

      /* ===== USER LIST ===== */
      if (data.type === "user_list" && isAdmin) {
        addOrMoveUser(data.user_id, data.username);
        return;
      }

      /* ===== UNREAD SUMMARY ===== */
      if (data.type === "unread_summary" && isAdmin) {
        unreadCounts = { ...data.per_user };
        totalUnread = data.total || 0;
        updateBadges();
        return;
      }

      /* ===== UNREAD UPDATE ===== */
      if (data.type === "unread_count_update" && isAdmin) {
        totalUnread = data.total_unread || 0;
        updateBadges();
        return;
      }

      /* ===== CHAT MESSAGE ===== */
      if (data.type === "chat_message") {
        const fromId = Number(data.from_user_id);
        const toId = Number(data.to_user_id);
        const currentUserId = Number(CURRENT_USER_ID);

        const isOwnMessage = fromId === currentUserId;

        let shouldRender = false;

        /* ===== ADMIN SIDE ===== */
        if (isAdmin) {
          const isForSelectedUser =
            (fromId === selectedUserId) ||
            (toId === selectedUserId);

          shouldRender = isForSelectedUser;

          // Count unread only for messages from users when not viewing that user's chat
          if (
            !isOwnMessage &&
            fromId !== selectedUserId &&
            chatBox.classList.contains("hidden")
          ) {
            unreadCounts[fromId] = (unreadCounts[fromId] || 0) + 1;
            totalUnread++;
            updateBadges();
          }
        } 
        /* ===== USER SIDE ===== */
        else {
          // Regular user: render incoming messages, but SKIP own messages (already shown optimistically)
          shouldRender = !isOwnMessage;
        }

        /* ===== RENDER MESSAGE ===== */
        if (shouldRender) {
          // Extra safety: prevent duplicates via message_id
          if (data.message_id && renderedMessageIds.has(data.message_id)) {
            return;
          }
          if (data.message_id) {
            renderedMessageIds.add(data.message_id);
          }

          renderMessage(
            data.sender,
            data.message,
            isOwnMessage
          );
        }
      }
    };
  }

  /* ================= RENDER ================= */
  function renderMessage(sender, text, isMe) {
    const div = document.createElement("div");
    div.className = `msg ${isMe ? "user" : "admin"}`;
    div.innerHTML = `<b>${sender}:</b> ${text}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  /* ================= USER LIST ================= */
  function addOrMoveUser(userId, username) {
    if (!userList) return;

    let item = document.getElementById("user-" + userId);
    if (!item) {
      item = document.createElement("div");
      item.id = "user-" + userId;
      item.className = "admin-user";

      item.innerHTML = `
        <span>${username}</span>
        <span class="user-unread hidden">0</span>
      `;

      item.onclick = () => {
        selectedUserId = Number(userId);

        totalUnread -= unreadCounts[userId] || 0;
        unreadCounts[userId] = 0;
        updateBadges();

        document.querySelectorAll(".admin-user").forEach(u => u.classList.remove("active"));
        item.classList.add("active");

        messages.innerHTML = "";
        renderedMessageIds.clear();

        socket.send(JSON.stringify({
          type: "load_history",
          user_id: userId
        }));
      };
    }
    userList.prepend(item);
  }

  /* ================= BADGES ================= */
  function updateBadges() {
    if (toggleBadge) {
      if (totalUnread > 0) {
        toggleBadge.textContent = totalUnread > 99 ? "99+" : totalUnread;
        toggleBadge.classList.remove("hidden");
      } else {
        toggleBadge.classList.add("hidden");
      }
    }

    Object.keys(unreadCounts).forEach(userId => {
      const item = document.getElementById("user-" + userId);
      if (!item) return;

      const badge = item.querySelector(".user-unread");
      const count = unreadCounts[userId];

      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    });
  }

  /* ================= SEND ================= */
  function sendMessage() {
    const msg = input.value.trim();
    if (!msg || !isSocketReady) return;

    const payload = { message: msg };

    if (isAdmin) {
      if (!selectedUserId) {
        alert("Select a user first");
        return;
      }
      payload.to_user_id = selectedUserId;
    }

    socket.send(JSON.stringify(payload));
    input.value = "";

    // Optimistic render (shows immediately for better UX)
    const senderName = isAdmin ? (CURRENT_USERNAME || "You") : "You";
    renderMessage(senderName, msg, true);
  }

  /* ================= OPEN CHAT ================= */
  fab.onclick = () => {
    overlay.classList.remove("hidden");
    chatBox.classList.remove("hidden");
    overlay.classList.add("show");
    chatBox.classList.add("show");
    connectSocket();

    setTimeout(() => {
      if (isAdmin && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "get_unread_summary" }));
      }
    }, 400);
  };

  /* ================= CLOSE ================= */
  closeBtn.onclick = closeChat;
  overlay.onclick = closeChat;

  function closeChat() {
    overlay.classList.remove("show");
    chatBox.classList.remove("show");

    setTimeout(() => {
      overlay.classList.add("hidden");
      chatBox.classList.add("hidden");
      selectedUserId = null;
    }, 300);
  }

  /* ================= EVENTS ================= */
  sendBtn.onclick = sendMessage;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.disabled = true;
});