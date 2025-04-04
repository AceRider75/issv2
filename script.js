document.addEventListener("DOMContentLoaded", function () {
  // Global variables
  let currentMap = "map.png";
  let mapData = [];
  let logs = [];

  // DOM elements
  const menuIcon = document.getElementById("menuIcon");
  const sidebar = document.getElementById("sidebar");
  const closeSidebar = document.getElementById("closeSidebar");
  const supplyRequestOption = document.getElementById("supplyRequestOption");
  const viewLogsOption = document.getElementById("viewLogsOption");
  const supplyRequestForm = document.getElementById("supplyRequestForm");
  const logsContainer = document.getElementById("logsContainer");
  const mapSelector = document.getElementById("mapSelector");
  const mapContainer = document.getElementById("mapContainer");
  const itemsContainer = document.getElementById("itemsContainer");
  const submitSupplyRequest = document.getElementById("submitSupplyRequest");
  const logsElement = document.getElementById("logs");
  const itemTypeInput = document.getElementById("itemType");

  // Event listeners
  menuIcon.addEventListener("click", openSidebar);
  closeSidebar.addEventListener("click", closeAll);
  supplyRequestOption.addEventListener("click", showSupplyRequestForm);
  viewLogsOption.addEventListener("click", showLogs);
  mapSelector.addEventListener("change", changeMap);
  submitSupplyRequest.addEventListener("click", handleSupplyRequest);

  // Initial load: set background image for mapContainer and load CSV data
  mapContainer.style.backgroundImage = "url(" + currentMap + ")";
  loadMapData(currentMap);
  addLog("Application initialized");

  function openSidebar() {
    sidebar.classList.add("open");
    sidebar.style.width = "300px";
    addLog("Opened sidebar menu");
  }

  function closeAll() {
    sidebar.classList.remove("open");
    sidebar.style.width = "0";
    supplyRequestForm.style.display = "none";
    logsContainer.style.display = "none";
    addLog("Closed sidebar menu");
  }

  function showSupplyRequestForm() {
    supplyRequestForm.style.display = "block";
    logsContainer.style.display = "none";
    addLog("Opened supply request form");
  }

  function showLogs() {
    supplyRequestForm.style.display = "none";
    logsContainer.style.display = "block";
    updateLogsDisplay();
    addLog("Viewed system logs");
  }

  function changeMap() {
    currentMap = mapSelector.value;
    // Update the background image of mapContainer
    mapContainer.style.backgroundImage = "url(" + currentMap + ")";
    loadMapData(currentMap);
    addLog(`Changed map to ${currentMap}`);
  }

  function loadMapData(mapFile) {
    // Determine the corresponding CSV file based on the map filename
    const csvFile = mapFile.replace(".png", ".csv");

    fetch(csvFile)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${csvFile}`);
        }
        return response.text();
      })
      .then((csvText) => {
        parseCSV(csvText);
        renderItems();
        addLog(`Loaded map data from ${csvFile}`);
      })
      .catch((error) => {
        console.error("Error loading map data:", error);
        addLog(`Error: ${error.message}`);
        // Clear items container in case of error
        itemsContainer.innerHTML = "";
      });
  }

  function parseCSV(csvText) {
    const lines = csvText.split("\n");
    if (lines.length === 0) return;
    const headers = lines[0].split(",");
    mapData = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(",");
      let item = {};
      for (let j = 0; j < headers.length; j++) {
        item[headers[j].trim()] = values[j].trim();
      }
      mapData.push(item);
    }
  }

  function renderItems() {
    itemsContainer.innerHTML = "";

    mapData.forEach((item) => {
      // Extract coordinates and dimensions
      const coords = item.centre_coordinates.split(":");
      const x = parseFloat(coords[0]);
      const y = parseFloat(coords[1]);
      const length = parseInt(item.length);
      const breadth = parseInt(item.breadth);

      // Create a new div for the item
      const itemElement = document.createElement("div");
      itemElement.className = "item";
      itemElement.style.left = (x - length / 2) + "px";
      itemElement.style.top = (y - breadth / 2) + "px";
      itemElement.style.width = length + "px";
      itemElement.style.height = breadth + "px";
      // Display the item name on the grid element
      itemElement.textContent = item.item_name;

      // Determine expiry status and adjust color
      const expiryDate = new Date(item.Expiry_Date);
      const now = new Date();
      const timeLeft = expiryDate - now;
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

      if (daysLeft < 0) {
        itemElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)"; // expired
      } else if (daysLeft <= 3) {
        itemElement.style.backgroundColor = "rgba(255, 0, 0, 0.7)"; // critical
      } else if (daysLeft <= 7) {
        itemElement.style.backgroundColor = "rgba(255, 165, 0, 0.7)"; // warning
      } else {
        itemElement.style.backgroundColor = "rgba(0, 128, 0, 0.7)"; // good
      }

      // Tooltip for more info on hover
      const itemInfo = document.createElement("div");
      itemInfo.className = "item-info";
      let expiryText = daysLeft < 0 ? "EXPIRED" : `Expires in ${daysLeft} days`;
      itemInfo.innerHTML = `
        <div><strong>Item Type:</strong> ${item.item_type}</div>
        <div><strong>Name:</strong> ${item.item_name}</div>
        <div><strong>Expiry:</strong> ${expiryText}</div>
        <div><strong>ID:</strong> ${item.sno}</div>
      `;
      itemElement.appendChild(itemInfo);
      itemsContainer.appendChild(itemElement);
    });
  }

  function handleSupplyRequest() {
    const itemType = itemTypeInput.value.trim();

    if (!itemType) {
      alert("Please enter an item type for the supply request.");
      return;
    }

    // Dummy API call – replace with actual API call per project requirements.
    sendSupplyRequestToAPI(itemType)
      .then((response) => {
        itemTypeInput.value = "";
        addLog(`Supply request for ${itemType} submitted successfully`);
        alert("Supply request submitted successfully!");
      })
      .catch((error) => {
        addLog(`Error submitting supply request: ${error.message}`);
        alert(`Error: ${error.message}`);
      });
  }

  function sendSupplyRequestToAPI(itemType) {
    return new Promise((resolve, reject) => {
      console.log(`Sending supply request for: ${itemType}`);
      setTimeout(() => {
        resolve({ success: true, message: "Request processed" });
      }, 1000);
    });
  }

  function addLog(action) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    logs.push(`[${timeString}][${action}]`);

    if (logs.length > 100) {
      logs.shift();
    }

    if (logsContainer.style.display === "block") {
      updateLogsDisplay();
    }
  }

  function updateLogsDisplay() {
    logsElement.innerHTML = "";
    for (let i = logs.length - 1; i >= 0; i--) {
      const logEntry = document.createElement("div");
      logEntry.textContent = logs[i];
      logsElement.appendChild(logEntry);
    }
  }
});


