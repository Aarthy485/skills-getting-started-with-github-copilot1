document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: (keeps code safe) - simple text encoder for user-provided strings when needed
  const encodeHtml = (str) => String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build main card HTML (static parts)
        activityCard.innerHTML = `
          <h4>${encodeHtml(name)}</h4>
          <p>${encodeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${encodeHtml(details.schedule)}</p>
          <p class="activity-availability"><strong>Availability:</strong> ${encodeHtml(spotsLeft + " spots left")}</p>
          <div class="participants">
            <h5>Participants (<span class="participants-count">${details.participants.length}</span>)</h5>
            <div class="participants-content"></div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants list safely using DOM methods
        const participantsContent = activityCard.querySelector(".participants-content");
        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // participant email span
            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            // delete button
            const btn = document.createElement("button");
            btn.className = "delete-participant";
            btn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
            btn.title = "Unregister participant";
            btn.textContent = "✖";

            // Attach click handler to perform DELETE request
            btn.addEventListener("click", async () => {
              if (!confirm(`Unregister ${p} from ${name}?`)) return;
              try {
                const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, {
                  method: "DELETE",
                });
                const body = await res.json().catch(() => ({}));
                if (res.ok) {
                  // remove from DOM
                  ul.removeChild(li);
                  // update counts and availability text
                  const countEl = activityCard.querySelector(".participants-count");
                  const participantsCount = ul.querySelectorAll(".participant-item").length;
                  countEl.textContent = participantsCount;
                  const availabilityEl = activityCard.querySelector(".activity-availability");
                  if (availabilityEl) {
                    const max = details.max_participants;
                    const spots = max - participantsCount;
                    availabilityEl.textContent = `${spots} spots left`;
                  }
                } else {
                  alert(body.detail || body.message || "Failed to unregister participant");
                }
              } catch (err) {
                console.error("Error unregistering participant:", err);
                alert("Failed to unregister participant. See console for details.");
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });
          participantsContent.appendChild(ul);
        } else {
          const pNo = document.createElement("p");
          pNo.className = "no-participants";
          pNo.innerHTML = "<em>No participants yet</em>";
          participantsContent.appendChild(pNo);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the new participant immediately
        try {
          await fetchActivities();
        } catch (err) {
          console.error("Error refreshing activities after signup:", err);
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
