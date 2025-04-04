// /api/supply-request.js
const fs = require("fs");
const path = require("path");

// Allowed item types with their predefined properties.
const itemTypes = {
  "food packet": {
    width: 10,
    length: 10,
    priority: 80,
    usageLimit: 30,
  },
  "oxygen cylinder": {
    width: 15,
    length: 15,
    priority: 95,
    usageLimit: 100,
  },
  "first aid kit": {
    width: 20,
    length: 20,
    priority: 100,
    usageLimit: 5,
  },
};

module.exports = (req, res) => {
  // Only allow POST requests.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { itemType, mapFile } = req.body;

  // Validate the itemType.
  if (!itemTypes[itemType]) {
    return res.status(400).json({ error: "Invalid item type" });
  }

  // Build the full path to the CSV file (e.g., "map.csv", "map2.csv", etc.).
  const csvPath = path.join(__dirname, "..", mapFile);
  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: "CSV file not found" });
  }

  try {
    // Read the CSV file.
    const csvContent = fs.readFileSync(csvPath, "utf8").trim();
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",");

    // Generate a new serial number (sno) based on the current number of rows.
    const newSno = lines.length; // Header is line 0.

    // Set a default expiry date (e.g., 30 days from now).
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Build a new item object with default properties.
    const newItem = {
      sno: newSno,
      item_type: itemType,
      item_name: `${itemType} ${newSno}`,
      Expiry_Date: expiryDate,
      centre_coordinates: "100:100", // Default center coordinates (adjust as needed)
      length: itemTypes[itemType].length,
      breadth: itemTypes[itemType].width,
    };

    // Reconstruct the new row following the header order.
    const newRow = headers.map((header) => newItem[header]).join(",");

    // Append the new row to the CSV file.
    fs.appendFileSync(csvPath, "\n" + newRow, "utf8");

    return res.status(200).json({
      message: "Supply request processed successfully",
      newItem,
    });
  } catch (error) {
    console.error("Error processing supply request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
