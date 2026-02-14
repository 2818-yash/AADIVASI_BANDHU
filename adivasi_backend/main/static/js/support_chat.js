// let socket = null;
// let isSocketReady = false;
// let selectedUserId = null;
// let isAdmin = false;

// /* 🔔 UNREAD STATE */
// let unreadCounts = {};   // { userId: count }
// let totalUnread = 0;

// document.addEventListener("DOMContentLoaded", () => {
//   const fab = document.getElementById("chat-fab");
//   const chatBox = document.getElementById("chat-box");
//   const closeBtn = document.getElementById("chat-close");
//   const sendBtn = document.getElementById("chat-send");
//   const input = document.getElementById("chat-input");
//   const messages = document.getElementById("chat-messages");
//   const userList = document.getElementById("admin-user-list");
//   const searchInput = document.getElementById("user-search");
//   const overlay = document.getElementById("chat-overlay");
//   const toggleBadge = document.getElementById("chat-unread-badge");

//   isAdmin = !!userList;

//   /* ==========================
//      🔹 CONNECT SOCKET
//      ========================== */
//   function connectSocket() {
//     if (socket && socket.readyState === WebSocket.OPEN) return;

//     socket = new WebSocket(
//       (location.protocol === "https:" ? "wss://" : "ws://") +
//       location.host +
//       "/ws/support-chat/"
//     );

//     socket.onopen = () => {
//       isSocketReady = true;
//       sendBtn.disabled = false;
//     };

//     socket.onclose = () => {
//       isSocketReady = false;
//       sendBtn.disabled = true;
//     };

//     socket.onmessage = (e) => {
//       const data = JSON.parse(e.data);

//       /* ==========================
//          🔹 ADMIN: USER LIST
//          ========================== */
//       if (data.type === "user_list" && isAdmin) {
//         addOrMoveUser(data.user_id, data.username);
//         return;
//       }

//       /* ==========================
//          🔹 CHAT MESSAGE
//          ========================== */
//       if (data.type === "chat_message") {

//         /* 🔔 UNREAD LOGIC (ADMIN ONLY) */
//         if (
//           isAdmin &&
//           !data.is_admin &&
//           (
//             !selectedUserId ||
//             data.from_user_id !== selectedUserId
//           )
//         ) {
//           unreadCounts[data.from_user_id] =
//             (unreadCounts[data.from_user_id] || 0) + 1;

//           totalUnread++;
//           updateBadges();

//           // ❌ do NOT render message yet
//           return;
//         }

//         // 🔹 Render message only for active chat
//         const isMe = data.sender === CURRENT_USERNAME;

//         messages.innerHTML += `
//           <div class="msg ${isMe ? "user" : "admin"}">
//             <b>${data.sender}:</b> ${data.message}
//           </div>
//         `;
//         messages.scrollTop = messages.scrollHeight;
//       }
//     };
//   }

//   /* ==========================
//      🔹 ADD / MOVE USER
//      ========================== */
//   function addOrMoveUser(userId, username) {
//     if (!userList) return;

//     let item = document.getElementById("user-" + userId);

//     if (!item) {
//       item = document.createElement("div");
//       item.id = "user-" + userId;
//       item.className = "admin-user";

//       item.innerHTML = `
//         <span>${username}</span>
//         <span class="user-unread hidden">0</span>
//       `;

//       item.onclick = () => {
//         selectedUserId = userId;

//         // 🔕 CLEAR UNREAD
//         totalUnread -= unreadCounts[userId] || 0;
//         unreadCounts[userId] = 0;
//         updateBadges();

//         document.querySelectorAll(".admin-user")
//           .forEach(u => u.classList.remove("active"));
//         item.classList.add("active");

//         messages.innerHTML = "";

//         socket.send(JSON.stringify({
//           type: "load_history",
//           user_id: userId
//         }));
//       };
//     }

//     userList.prepend(item);
//   }

//   /* ==========================
//      🔹 UPDATE BADGES
//      ========================== */
//   function updateBadges() {
//     // Toggle badge
//     if (toggleBadge) {
//       if (totalUnread > 0) {
//         toggleBadge.textContent = totalUnread;
//         toggleBadge.classList.remove("hidden");
//       } else {
//         toggleBadge.classList.add("hidden");
//       }
//     }

//     // User list badges
//     Object.keys(unreadCounts).forEach(userId => {
//       const item = document.getElementById("user-" + userId);
//       if (!item) return;

//       const badge = item.querySelector(".user-unread");
//       const count = unreadCounts[userId];

//       if (count > 0) {
//         badge.textContent = count;
//         badge.classList.remove("hidden");
//       } else {
//         badge.classList.add("hidden");
//       }
//     });
//   }

//   /* ==========================
//      🔹 SEARCH USERS
//      ========================== */
//   if (searchInput) {
//     searchInput.addEventListener("keyup", () => {
//       const value = searchInput.value.toLowerCase();
//       document.querySelectorAll(".admin-user").forEach(user => {
//         user.style.display =
//           user.innerText.toLowerCase().includes(value) ? "flex" : "none";
//       });
//     });
//   }

//   /* ==========================
//      🔹 SEND MESSAGE
//      ========================== */
//   function sendMessage() {
//     const msg = input.value.trim();
//     if (!msg || !isSocketReady) return;

//     const payload = { message: msg };

//     if (isAdmin) {
//       if (!selectedUserId) {
//         alert("Select a user first");
//         return;
//       }
//       payload.to_user_id = selectedUserId;
//     }

//     socket.send(JSON.stringify(payload));
//     input.value = "";
//   }

//   /* ==========================
//      🔹 OPEN / CLOSE CHAT
//      ========================== */
//   fab.onclick = () => {
//     overlay.classList.remove("hidden");
//     chatBox.classList.remove("hidden");

//     overlay.offsetHeight;
//     chatBox.offsetHeight;

//     overlay.classList.add("show");
//     chatBox.classList.add("show");

//     connectSocket();
//   };

//   closeBtn.onclick = closeChat;
//   overlay.onclick = closeChat;

//   function closeChat() {
//     overlay.classList.remove("show");
//     chatBox.classList.remove("show");

//     setTimeout(() => {
//       overlay.classList.add("hidden");
//       chatBox.classList.add("hidden");
//     }, 300);
//   }

//   sendBtn.onclick = sendMessage;

//   input.addEventListener("keydown", (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       sendMessage();
//     }
//   });

//   sendBtn.disabled = true;
// });



// let socket = null;
// let isSocketReady = false;
// let selectedUserId = null;
// let isAdmin = false;

// /* UNREAD STATE */
// let unreadCounts = {};   // { userId: count }
// let totalUnread = 0;

// document.addEventListener("DOMContentLoaded", () => {
//   const fab = document.getElementById("chat-fab");
//   const chatBox = document.getElementById("chat-box");
//   const closeBtn = document.getElementById("chat-close");
//   const sendBtn = document.getElementById("chat-send");
//   const input = document.getElementById("chat-input");
//   const messages = document.getElementById("chat-messages");
//   const userList = document.getElementById("admin-user-list");
//   const searchInput = document.getElementById("user-search");
//   const overlay = document.getElementById("chat-overlay");
//   const toggleBadge = document.getElementById("chat-unread-badge");

//   isAdmin = !!userList;

//   /* CONNECT SOCKET */
//   function connectSocket() {
//     if (socket && socket.readyState === WebSocket.OPEN) return;

//     socket = new WebSocket(
//       (location.protocol === "https:" ? "wss://" : "ws://") +
//       location.host +
//       "/ws/support-chat/"
//     );

//     socket.onopen = () => {
//       isSocketReady = true;
//       sendBtn.disabled = false;

//       // Optional: ask for fresh summary right after connect
//       if (isAdmin) {
//         setTimeout(() => {
//           socket.send(JSON.stringify({ type: "get_unread_summary" }));
//         }, 300);
//       }
//     };

//     socket.onclose = () => {
//       isSocketReady = false;
//       sendBtn.disabled = true;
//     };

//     socket.onmessage = (e) => {
//       const data = JSON.parse(e.data);

//       /* ADMIN: USER LIST */
//       if (data.type === "user_list" && isAdmin) {
//         addOrMoveUser(data.user_id, data.username);
//         return;
//       }

//       /* UNREAD SUMMARY (initial or manual refresh) */
//       if (data.type === "unread_summary" && isAdmin) {
//         unreadCounts = { ...data.per_user };
//         totalUnread = data.total || 0;
//         updateBadges();
//         return;
//       }

//       /* TOTAL UNREAD UPDATE (from server - authoritative) */
//       if (data.type === "unread_count_update" && isAdmin) {
//         totalUnread = data.total_unread || 0;
//         updateBadges();
//         return;
//       }

//       /* CHAT MESSAGE */
//       if (data.type === "chat_message") {

//         /* UNREAD LOGIC - ONLY WHEN CHAT WINDOW IS OPEN */
//         if (
//           isAdmin &&
//           !data.is_admin &&                                 // from user
//           (!selectedUserId || data.from_user_id !== selectedUserId) &&  // not current chat
//           !chatBox.classList.contains("hidden")            // ← KEY FIX: only count if chat is visible
//         ) {
//           unreadCounts[data.from_user_id] =
//             (unreadCounts[data.from_user_id] || 0) + 1;
//           totalUnread++;
//           updateBadges();
//           return; // don't render if not selected
//         }

//         // Render message only if this is the currently selected user's chat
//         if (isAdmin && selectedUserId && data.from_user_id === selectedUserId) {
//           const isMe = data.sender === CURRENT_USERNAME;

//           messages.innerHTML += `
//             <div class="msg ${isMe ? "user" : "admin"}">
//               <b>${data.sender}:</b> ${data.message}
//             </div>
//           `;
//           messages.scrollTop = messages.scrollHeight;
//         }
//       }
//     };
//   }

//   /* ADD / MOVE USER IN LIST */
//   function addOrMoveUser(userId, username) {
//     if (!userList) return;

//     let item = document.getElementById("user-" + userId);

//     if (!item) {
//       item = document.createElement("div");
//       item.id = "user-" + userId;
//       item.className = "admin-user";

//       item.innerHTML = `
//         <span>${username}</span>
//         <span class="user-unread hidden">0</span>
//       `;

//       item.onclick = () => {
//         selectedUserId = userId;

//         // CLEAR UNREAD FOR THIS USER
//         totalUnread -= unreadCounts[userId] || 0;
//         unreadCounts[userId] = 0;
//         updateBadges();

//         document.querySelectorAll(".admin-user")
//           .forEach(u => u.classList.remove("active"));
//         item.classList.add("active");

//         messages.innerHTML = "";

//         socket.send(JSON.stringify({
//           type: "load_history",
//           user_id: userId
//         }));
//       };
//     }

//     userList.prepend(item);
//   }

//   /* UPDATE BADGES */
//   function updateBadges() {
//     // Main floating badge
//     if (toggleBadge) {
//       if (totalUnread > 0) {
//         toggleBadge.textContent = totalUnread > 99 ? "99+" : totalUnread;
//         toggleBadge.classList.remove("hidden");
//       } else {
//         toggleBadge.classList.add("hidden");
//       }
//     }

//     // Per-user badges
//     Object.keys(unreadCounts).forEach(userId => {
//       const item = document.getElementById("user-" + userId);
//       if (!item) return;

//       const badge = item.querySelector(".user-unread");
//       const count = unreadCounts[userId];

//       if (count > 0) {
//         badge.textContent = count > 99 ? "99+" : count;
//         badge.classList.remove("hidden");
//       } else {
//         badge.classList.add("hidden");
//       }
//     });
//   }

//   /* SEARCH USERS */
//   if (searchInput) {
//     searchInput.addEventListener("keyup", () => {
//       const value = searchInput.value.toLowerCase();
//       document.querySelectorAll(".admin-user").forEach(user => {
//         user.style.display =
//           user.innerText.toLowerCase().includes(value) ? "flex" : "none";
//       });
//     });
//   }

//   /* SEND MESSAGE */
//   function sendMessage() {
//     const msg = input.value.trim();
//     if (!msg || !isSocketReady) return;

//     const payload = { message: msg };

//     if (isAdmin) {
//       if (!selectedUserId) {
//         alert("Select a user first");
//         return;
//       }
//       payload.to_user_id = selectedUserId;
//     }

//     socket.send(JSON.stringify(payload));
//     input.value = "";
//   }

//   /* OPEN / CLOSE CHAT */
//   fab.onclick = () => {
//     overlay.classList.remove("hidden");
//     chatBox.classList.remove("hidden");

//     overlay.offsetHeight;
//     chatBox.offsetHeight;

//     overlay.classList.add("show");
//     chatBox.classList.add("show");

//     connectSocket();

//     // Force fresh count from server when opening
//     setTimeout(() => {
//       if (isAdmin && socket && socket.readyState === WebSocket.OPEN) {
//         socket.send(JSON.stringify({ type: "get_unread_summary" }));
//       }
//     }, 400);
//   };

//   closeBtn.onclick = closeChat;
//   overlay.onclick = closeChat;

//   function closeChat() {
//     overlay.classList.remove("show");
//     chatBox.classList.remove("show");

//     setTimeout(() => {
//       overlay.classList.add("hidden");
//       chatBox.classList.add("hidden");
//       // Optional: reset selected user when closing
//       selectedUserId = null;
//     }, 300);
//   }

//   sendBtn.onclick = sendMessage;

//   input.addEventListener("keydown", (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       sendMessage();
//     }
//   });

//   sendBtn.disabled = true;
// });























let socket = null;
let isSocketReady = false;
let selectedUserId = null;
let isAdmin = false;

/* UNREAD STATE */
let unreadCounts = {};
let totalUnread = 0;

document.addEventListener("DOMContentLoaded", () => {

  const fab = document.getElementById("chat-fab");
  const chatBox = document.getElementById("chat-box");
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("chat-send");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const userList = document.getElementById("admin-user-list");
  const searchInput = document.getElementById("user-search");
  const overlay = document.getElementById("chat-overlay");
  const toggleBadge = document.getElementById("chat-unread-badge");

  isAdmin = !!userList;


  // ================= CONNECT =================
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

      // auto reconnect
      setTimeout(connectSocket, 3000);
    };


    // ================= RECEIVE =================
    socket.onmessage = (e) => {

      const data = JSON.parse(e.data);

      console.log("WS:", data); // debug


      // -------- USER LIST --------
      if (data.type === "user_list" && isAdmin) {
        addOrMoveUser(data.user_id, data.username);
        return;
      }


      // -------- UNREAD SUMMARY --------
      if (data.type === "unread_summary" && isAdmin) {

        unreadCounts = { ...data.per_user };
        totalUnread = data.total || 0;

        updateBadges();
        return;
      }


      // -------- TOTAL UNREAD --------
      if (data.type === "unread_count_update" && isAdmin) {

        totalUnread = data.total_unread || 0;

        updateBadges();
        return;
      }


      // ================= CHAT MESSAGE =================
      if (data.type === "chat_message") {

        /* -------- ADMIN SIDE -------- */
        if (isAdmin && selectedUserId) {

          const belongsToChat =
            data.from_user_id === selectedUserId ||
            data.to_user_id === selectedUserId;

          // unread
          if (
            !data.is_admin &&
            data.from_user_id !== selectedUserId
          ) {

            unreadCounts[data.from_user_id] =
              (unreadCounts[data.from_user_id] || 0) + 1;

            totalUnread++;

            updateBadges();
            return;
          }


          if (belongsToChat) {

            renderMessage(
              data.sender,
              data.message,
              data.sender === CURRENT_USERNAME
            );
          }

          return;
        }


        /* -------- USER SIDE -------- */
        if (!isAdmin) {

          renderMessage(
            data.sender,
            data.message,
            data.sender === CURRENT_USERNAME
          );
        }
      }
    };
  }


  // ================= RENDER =================
  function renderMessage(sender, text, isMe) {

    const div = document.createElement("div");
    div.className = "msg " + (isMe ? "user" : "admin");

    const bold = document.createElement("b");
    bold.textContent = sender + ": ";

    const span = document.createElement("span");
    span.textContent = text;

    div.appendChild(bold);
    div.appendChild(span);

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
  }


  // ================= USER LIST =================
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

        selectedUserId = userId;


        // clear unread
        totalUnread -= unreadCounts[userId] || 0;
        unreadCounts[userId] = 0;

        updateBadges();


        document.querySelectorAll(".admin-user")
          .forEach(u => u.classList.remove("active"));

        item.classList.add("active");

        messages.innerHTML = "";


        socket.send(JSON.stringify({
          type: "load_history",
          user_id: userId
        }));
      };
    }

    userList.prepend(item);
  }


  // ================= BADGES =================
  function updateBadges() {

    // main badge
    if (toggleBadge) {

      if (totalUnread > 0) {

        toggleBadge.textContent =
          totalUnread > 99 ? "99+" : totalUnread;

        toggleBadge.classList.remove("hidden");

      } else {

        toggleBadge.classList.add("hidden");
      }
    }


    // per user
    Object.keys(unreadCounts).forEach(userId => {

      const item = document.getElementById("user-" + userId);

      if (!item) return;

      const badge = item.querySelector(".user-unread");

      const count = unreadCounts[userId];

      if (count > 0) {

        badge.textContent =
          count > 99 ? "99+" : count;

        badge.classList.remove("hidden");

      } else {

        badge.classList.add("hidden");
      }
    });
  }


  // ================= SEARCH =================
  if (searchInput) {

    searchInput.addEventListener("keyup", () => {

      const value = searchInput.value.toLowerCase();

      document.querySelectorAll(".admin-user").forEach(user => {

        user.style.display =
          user.innerText.toLowerCase().includes(value)
            ? "flex"
            : "none";
      });
    });
  }


  // ================= SEND =================
  function sendMessage() {

    const msg = input.value.trim();

    if (!msg || !isSocketReady) return;

    const payload = { message: msg };

    if (isAdmin) {

      if (!selectedUserId) {
        alert("Select user first");
        return;
      }

      payload.to_user_id = selectedUserId;
    }


    socket.send(JSON.stringify(payload));

    input.value = "";
  }


  // ================= OPEN =================
  fab.onclick = () => {

    overlay.classList.remove("hidden");
    chatBox.classList.remove("hidden");

    overlay.offsetHeight;
    chatBox.offsetHeight;

    overlay.classList.add("show");
    chatBox.classList.add("show");

    connectSocket();
  };


  // ================= CLOSE =================
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


  // ================= INPUT =================
  sendBtn.onclick = sendMessage;

  input.addEventListener("keydown", e => {

    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });


  sendBtn.disabled = true;

});
