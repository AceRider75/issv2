document.addEventListener("DOMContentLoaded", function () {
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

  // Sidebar functionality
  menuIcon.addEventListener("click", function() {
      sidebar.style.width = "300px";
      addLog("Opened sidebar menu");
  });
  
  if (closeSidebar) {
    closeSidebar.addEventListener("click", function() {
      sidebar.style.width = "0";
      supplyRequestForm.style.display = "none";
      logsContainer.style.display = "none";
      addLog("Closed sidebar menu");
    });
  }
  
  supplyRequestOption.addEventListener("click", function() {
      supplyRequestForm.style.display = "block";
      logsContainer.style.display = "none";
      addLog("Opened supply request form");
  });
  
  viewLogsOption.addEventListener("click", function() {
      supplyRequestForm.style.display = "none";
      logsContainer.style.display = "block";
      updateLogsDisplay();
      addLog("Viewed system logs");
  });
  
  mapSelector.addEventListener("change", changeMap);
  submitSupplyRequest.addEventListener("click", handleSupplyRequest);

  // Set initial map background and load CSV data
  mapContainer.style.backgroundImage = "url(" + currentMap + ")";
  loadMapData(currentMap);
  addLog("Application initialized");

  // Load CSV file data and render items onto the map
  function loadMapData(mapFile) {
    const csvFile = mapFile.replace(".png", ".csv");
    fetch(csvFile)
      .then(response => {
          if (!response.ok) throw new Error(`Failed to load ${csvFile}`);
          return response.text();
      })
      .then(csvText => {
          parseCSV(csvText);
          renderItems();
          addLog(`Loaded map data from ${csvFile}`);
      })
      .catch(error => {
          console.error("Error loading map data:", error);
          addLog(`Error: ${error.message}`);
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
    mapData.forEach(item => {
      const coords = item.centre_coordinates.split(":");
      let x = parseFloat(coords[0]);
      let y = parseFloat(coords[1]);
      const length = parseInt(item.length);
      const breadth = parseInt(item.breadth);
      
      // Adjust coordinates so that the item stays within the map
      const mapWidth = mapContainer.offsetWidth;
      const mapHeight = mapContainer.offsetHeight;
      x = Math.min(Math.max(x, 0), mapWidth - length);
      y = Math.min(Math.max(y, 0), mapHeight - breadth);

      const itemElement = document.createElement("div");
      itemElement.className = "item";
      itemElement.dataset.x = x;
      itemElement.dataset.y = y;
      itemElement.dataset.length = length;
      itemElement.dataset.breadth = breadth;
      itemElement.style.left = x + "px";
      itemElement.style.top = y + "px";
      itemElement.style.width = length + "px";
      itemElement.style.height = breadth + "px";
      itemElement.textContent = item.item_name;

      // Set background color based on expiry
      const expiryDate = new Date(item.Expiry_Date);
      const now = new Date();
      const timeLeft = expiryDate - now;
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        itemElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      } else if (daysLeft <= 3) {
        itemElement.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
      } else if (daysLeft <= 7) {
        itemElement.style.backgroundColor = "rgba(255, 165, 0, 0.7)";
      } else {
        itemElement.style.backgroundColor = "rgba(0, 128, 0, 0.7)";
      }
      
      // Tooltip for more details
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

  function changeMap() {
    currentMap = mapSelector.value;
    mapContainer.style.backgroundImage = "url(" + currentMap + ")";
    loadMapData(currentMap);
    addLog(`Changed map to ${currentMap}`);
  }

  function handleSupplyRequest() {
    const itemType = itemTypeInput.value.trim();
    if (!itemType) {
      alert("Please enter an item type for the supply request.");
      return;
    }
    sendSupplyRequestToAPI(itemType)
      .then(response => {
         itemTypeInput.value = "";
         addLog(`Supply request for ${itemType} submitted successfully`);
         alert("Supply request submitted successfully!");
         loadMapData(currentMap);
      })
      .catch(error => {
         addLog(`Error submitting supply request: ${error.message}`);
         alert(`Error: ${error.message}`);
      });
  }

  function sendSupplyRequestToAPI(itemType) {
    return fetch("/api/supply-request.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType, mapFile: currentMap.replace(".png", ".csv") })
    })
    .then(response => {
      if (!response.ok) throw new Error("Supply request failed");
      return response.json();
    });
  }

  function addLog(action) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    logs.push(`[${timeString}] ${action}`);
    if (logs.length > 100) logs.shift();
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



